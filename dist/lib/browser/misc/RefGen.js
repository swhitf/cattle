define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var start = new Date().getTime().toString();
    var count = 0;
    var RefGen = (function () {
        function RefGen() {
        }
        RefGen.next = function (prefix) {
            if (prefix === void 0) { prefix = 'C'; }
            return prefix + start + '-' + (count++);
        };
        return RefGen;
    }());
    exports.RefGen = RefGen;
});
//# sourceMappingURL=RefGen.js.map