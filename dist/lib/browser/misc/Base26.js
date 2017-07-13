define(["require", "exports", "bases"], function (require, exports, bases) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Alpha26 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var Base26 = (function () {
        function Base26(num, str) {
            this.num = num;
            this.str = str;
        }
        Base26.num = function (num) {
            return new Base26(num, bases.toAlphabet(num, Alpha26));
        };
        Base26.str = function (str) {
            return new Base26(bases.fromAlphabet(str.toUpperCase(), Alpha26), str);
        };
        return Base26;
    }());
    exports.Base26 = Base26;
});
//# sourceMappingURL=Base26.js.map