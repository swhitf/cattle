"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@no-export
var DT_1 = require("./DT");
/**
 * Originally take from https://github.com/lgarron/clipboard-polyfill
 *
 * Unchanged; just couldn't get npm include to work...
 */
// Debug log strings should be short, since they are copmiled into the production build.
// TODO: Compile debug logging code out of production builds?
var debugLog = function (s) { };
var showWarnings = true;
var warnOrLog = function () {
    (console.warn || console.log).call(arguments);
}; // IE9 workaround (can't bind console functions).
var warn = warnOrLog.bind(console, "[clipboard-polyfill]");
var TEXT_PLAIN = "text/plain";
var ClipboardPolyfill = /** @class */ (function () {
    function ClipboardPolyfill() {
    }
    ClipboardPolyfill.setDebugLog = function (f) {
        debugLog = f;
    };
    ClipboardPolyfill.suppressWarnings = function () {
        showWarnings = false;
        DT_1.suppressDTWarnings();
    };
    ClipboardPolyfill.write = function (data) {
        if (showWarnings && !data.getData(TEXT_PLAIN)) {
            warn("clipboard.write() was called without a " +
                "`text/plain` data type. On some platforms, this may result in an " +
                "empty clipboard. Call clipboard.suppressWarnings() " +
                "to suppress this warning.");
        }
        return new Promise(function (resolve, reject) {
            // Internet Explorer
            if (seemToBeInIE()) {
                if (writeIE(data)) {
                    resolve();
                }
                else {
                    reject(new Error("Copying failed, possibly because the user rejected it."));
                }
                return;
            }
            if (execCopy(data)) {
                debugLog("regular execCopy worked");
                resolve();
                return;
            }
            // Success detection on Edge is not possible, due to bugs in all 4
            // detection mechanisms we could try to use. Assume success.
            if (navigator.userAgent.indexOf("Edge") > -1) {
                debugLog('UA "Edge" => assuming success');
                resolve();
                return;
            }
            // Fallback 1 for desktop Safari.
            if (copyUsingTempSelection(document.body, data)) {
                debugLog("copyUsingTempSelection worked");
                resolve();
                return;
            }
            // Fallback 2 for desktop Safari.
            if (copyUsingTempElem(data)) {
                debugLog("copyUsingTempElem worked");
                resolve();
                return;
            }
            // Fallback for iOS Safari.
            var text = data.getData(TEXT_PLAIN);
            if (text !== undefined && copyTextUsingDOM(text)) {
                debugLog("copyTextUsingDOM worked");
                resolve();
                return;
            }
            reject(new Error("Copy command failed."));
        });
    };
    ClipboardPolyfill.writeText = function (s) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(s);
        }
        var dt = new DT_1.DT();
        dt.setData(TEXT_PLAIN, s);
        return this.write(dt);
    };
    ClipboardPolyfill.read = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            // TODO: Attempt to use navigator.clipboard.read() directly.
            // Requires DT -> DataTransfer conversion.
            _this.readText().then(function (s) { return resolve(DTFromText(s)); }, reject);
        });
    };
    ClipboardPolyfill.readText = function () {
        if (navigator.clipboard && navigator.clipboard.readText) {
            return navigator.clipboard.readText();
        }
        if (seemToBeInIE()) {
            return readIE();
        }
        return new Promise(function (resolve, reject) {
            reject("Read is not supported in your browser.");
        });
    };
    ClipboardPolyfill.DT = DT_1.DT;
    return ClipboardPolyfill;
}());
exports.ClipboardPolyfill = ClipboardPolyfill;
/******** Implementations ********/
var FallbackTracker = /** @class */ (function () {
    function FallbackTracker() {
        this.success = false;
    }
    return FallbackTracker;
}());
function copyListener(tracker, data, e) {
    debugLog("listener called");
    tracker.success = true;
    data.forEach(function (value, key) {
        e.clipboardData.setData(key, value);
        if (key === TEXT_PLAIN && e.clipboardData.getData(key) != value) {
            debugLog("setting text/plain failed");
            tracker.success = false;
        }
    });
    e.preventDefault();
}
function execCopy(data) {
    var tracker = new FallbackTracker();
    var listener = copyListener.bind(this, tracker, data);
    document.addEventListener("copy", listener);
    try {
        // We ignore the return value, since FallbackTracker tells us whether the
        // listener was called. It seems that checking the return value here gives
        // us no extra information in any browser.
        document.execCommand("copy");
    }
    finally {
        document.removeEventListener("copy", listener);
    }
    return tracker.success;
}
// Temporarily select a DOM element, so that `execCommand()` is not rejected.
function copyUsingTempSelection(e, data) {
    selectionSet(e);
    var success = execCopy(data);
    selectionClear();
    return success;
}
// Create a temporary DOM element to select, so that `execCommand()` is not
// rejected.
function copyUsingTempElem(data) {
    var tempElem = document.createElement("div");
    // Setting an individual property does not support `!important`, so we set the
    // whole style instead of just the `-webkit-user-select` property.
    tempElem.setAttribute("style", "-webkit-user-select: text !important");
    // Place some text in the elem so that Safari has something to select.
    tempElem.textContent = "temporary element";
    document.body.appendChild(tempElem);
    var success = copyUsingTempSelection(tempElem, data);
    document.body.removeChild(tempElem);
    return success;
}
// Uses shadow DOM.
function copyTextUsingDOM(str) {
    debugLog("copyTextUsingDOM");
    var tempElem = document.createElement("div");
    // Setting an individual property does not support `!important`, so we set the
    // whole style instead of just the `-webkit-user-select` property.
    tempElem.setAttribute("style", "-webkit-user-select: text !important");
    // Use shadow DOM if available.
    var spanParent = tempElem;
    if (tempElem.attachShadow) {
        debugLog("Using shadow DOM.");
        spanParent = tempElem.attachShadow({ mode: "open" });
    }
    var span = document.createElement("span");
    span.innerText = str;
    // span.style.whiteSpace = "pre-wrap"; // TODO: Use `innerText` above instead?
    spanParent.appendChild(span);
    document.body.appendChild(tempElem);
    selectionSet(span);
    var result = document.execCommand("copy");
    selectionClear();
    document.body.removeChild(tempElem);
    return result;
}
/******** Selection ********/
function selectionSet(elem) {
    var sel = document.getSelection();
    var range = document.createRange();
    range.selectNodeContents(elem);
    sel.removeAllRanges();
    sel.addRange(range);
}
function selectionClear() {
    var sel = document.getSelection();
    sel.removeAllRanges();
}
/******** Convenience ********/
function DTFromText(s) {
    var dt = new DT_1.DT();
    dt.setData(TEXT_PLAIN, s);
    return dt;
}
function seemToBeInIE() {
    return (typeof ClipboardEvent === "undefined" &&
        typeof window.clipboardData !== "undefined" &&
        typeof window.clipboardData.setData !== "undefined");
}
function writeIE(data) {
    // IE supports text or URL, but not HTML: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
    // TODO: Write URLs to `text/uri-list`? https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types
    var text = data.getData(TEXT_PLAIN);
    if (text !== undefined) {
        return window.clipboardData.setData("Text", text);
    }
    throw "No `text/plain` value was specified.";
}
// Returns "" if the read failed, e.g. because the user rejected the permission.
function readIE() {
    return new Promise(function (resolve, reject) {
        var text = window.clipboardData.getData("Text");
        if (text === "") {
            reject(new Error("Empty clipboard or could not read plain text from clipboard"));
        }
        else {
            resolve(text);
        }
    });
}
//# sourceMappingURL=clipboard.js.map