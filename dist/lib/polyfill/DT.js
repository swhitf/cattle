"use strict";
/**
 * Originally take from https://github.com/lgarron/clipboard-polyfill
 *
 * Unchanged; just couldn't get npm include to work...
 */
Object.defineProperty(exports, "__esModule", { value: true });
var dataTypes = ["text/plain", "text/html"];
// TODO: Dedup with main file?
var warnOrLog = function () {
    (console.warn || console.log).call(arguments);
}; // IE9 workaround (can't bind console functions).
var warn = warnOrLog.bind(console, "[clipboard-polyfill]");
var showWarnings = true;
function suppressDTWarnings() {
    showWarnings = false;
}
exports.suppressDTWarnings = suppressDTWarnings;
var DT = /** @class */ (function () {
    function DT() {
        this.m = {};
    }
    DT.prototype.setData = function (type, value) {
        if (showWarnings && dataTypes.indexOf(type) === -1) {
            warn("Unknown data type: " + type, "Call clipboard.suppressWarnings() " + "to suppress this warning.");
        }
        this.m[type] = value;
    };
    DT.prototype.getData = function (type) {
        return this.m[type];
    };
    // TODO: Provide an iterator consistent with DataTransfer.
    DT.prototype.forEach = function (f) {
        for (var k in this.m) {
            f(this.m[k], k);
        }
    };
    return DT;
}());
exports.DT = DT;
//# sourceMappingURL=DT.js.map