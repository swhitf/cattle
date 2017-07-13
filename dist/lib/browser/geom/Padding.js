define(["require", "exports", "../misc/Util"], function (require, exports, Util_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Padding = (function () {
        function Padding(top, right, bottom, left) {
            this.top = Util_1.coalesce(top, 0);
            this.right = Util_1.coalesce(right, this.top);
            this.bottom = Util_1.coalesce(bottom, this.top);
            this.left = Util_1.coalesce(left, this.right);
        }
        Object.defineProperty(Padding.prototype, "horizontal", {
            get: function () {
                return this.left + this.right;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Padding.prototype, "vertical", {
            get: function () {
                return this.top + this.bottom;
            },
            enumerable: true,
            configurable: true
        });
        Padding.prototype.inflate = function (by) {
            return new Padding(this.top + by, this.right + by, this.bottom + by, this.left + by);
        };
        return Padding;
    }());
    Padding.empty = new Padding(0, 0, 0, 0);
    exports.Padding = Padding;
});
//# sourceMappingURL=Padding.js.map