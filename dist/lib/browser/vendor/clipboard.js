/**
 * Embedding of Clipboard.js - https://github.com/zenorocha/clipboard.js/
 *
 * After various attempts, I was unable to npm install including types effectively and because an index.js is not
 * used I cannot use the TypeScript 2.1 unknown module import, so resorting to local embedded version.  Will remove
 * in the future if possible.
 *
 * Modifications have been made to make the code compile:
 * - Removed Promise polyfill (imported instead)
 * - Restructured export and added typed interface
 * - Some changes to prevent type checking where undesired
 */
define(["require", "exports", "es6-promise"], function (require, exports, es6_promise_1) {
    "use strict";
    //Declare window as an any var alias to prevent TS moaning...
    var wnd = window;
    var clipboard = {};
    clipboard.copy = (function () {
        var _intercept = false;
        var _data = null; // Map from data type (e.g. "text/html") to value.
        var _bogusSelection = false;
        function cleanup() {
            _intercept = false;
            _data = null;
            if (_bogusSelection) {
                window.getSelection().removeAllRanges();
            }
            _bogusSelection = false;
        }
        document.addEventListener("copy", function (e) {
            if (_intercept) {
                for (var key in _data) {
                    e.clipboardData.setData(key, _data[key]);
                }
                e.preventDefault();
            }
        });
        // Workaround for Safari: https://bugs.webkit.org/show_bug.cgi?id=156529
        function bogusSelect() {
            var sel = document.getSelection();
            // If "nothing" is selected...
            if (!document.queryCommandEnabled("copy") && sel.isCollapsed) {
                // ... temporarily select the entire body.
                //
                // We select the entire body because:
                // - it's guaranteed to exist,
                // - it works (unlike, say, document.head, or phantom element that is
                //   not inserted into the DOM),
                // - it doesn't seem to flicker (due to the synchronous copy event), and
                // - it avoids modifying the DOM (can trigger mutation observers).
                //
                // Because we can't do proper feature detection (we already checked
                // document.queryCommandEnabled("copy") , which actually gives a false
                // negative for Blink when nothing is selected) and UA sniffing is not
                // reliable (a lot of UA strings contain "Safari"), this will also
                // happen for some browsers other than Safari. :-()
                var range = document.createRange();
                range.selectNodeContents(document.body);
                sel.addRange(range);
                _bogusSelection = true;
            }
        }
        ;
        return function (data) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                _intercept = true;
                if (typeof data === "string") {
                    _data = { "text/plain": data };
                }
                else if (data instanceof Node) {
                    _data = { "text/html": new XMLSerializer().serializeToString(data) };
                }
                else {
                    _data = data;
                }
                try {
                    bogusSelect();
                    if (document.execCommand("copy")) {
                        // document.execCommand is synchronous: http://www.w3.org/TR/2015/WD-clipboard-apis-20150421/#integration-with-rich-text-editing-apis
                        // So we can call resolveRef() back here.
                        cleanup();
                        resolve();
                    }
                    else {
                        throw new Error("Unable to copy. Perhaps it's not available in your browser?");
                    }
                }
                catch (e) {
                    cleanup();
                    reject(e);
                }
            });
        };
    })();
    clipboard.paste = (function () {
        var _intercept = false;
        var _resolve;
        var _dataType;
        document.addEventListener("paste", function (e) {
            if (_intercept) {
                _intercept = false;
                e.preventDefault();
                var resolve = _resolve;
                _resolve = null;
                resolve(e.clipboardData.getData(_dataType));
            }
        });
        return function (dataType) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                _intercept = true;
                _resolve = resolve;
                _dataType = dataType || "text/plain";
                try {
                    if (!document.execCommand("paste")) {
                        _intercept = false;
                        reject(new Error("Unable to paste. Pasting only works in Internet Explorer at the moment."));
                    }
                }
                catch (e) {
                    _intercept = false;
                    reject(new Error(e));
                }
            });
        };
    })();
    // Handle IE behaviour.
    if (typeof ClipboardEvent === "undefined" &&
        typeof wnd.clipboardData !== "undefined" &&
        typeof wnd.clipboardData.setData !== "undefined") {
        clipboard.copy = function (data) {
            return new es6_promise_1.Promise(function (resolve, reject) {
                // IE supports string and URL types: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
                // We only support the string type for now.
                if (typeof data !== "string" && !("text/plain" in data)) {
                    throw new Error("You must provide a text/plain type.");
                }
                var strData = (typeof data === "string" ? data : data["text/plain"]);
                var copySucceeded = wnd.clipboardData.setData("Text", strData);
                if (copySucceeded) {
                    resolve();
                }
                else {
                    reject(new Error("Copying was rejected."));
                }
            });
        };
        clipboard.paste = function () {
            return new es6_promise_1.Promise(function (resolve, reject) {
                var strData = wnd.clipboardData.getData("Text");
                if (strData) {
                    resolve(strData);
                }
                else {
                    // The user rejected the paste request.
                    reject(new Error("Pasting was rejected."));
                }
            });
        };
    }
    exports.Clipboard = clipboard;
});
//# sourceMappingURL=clipboard.js.map