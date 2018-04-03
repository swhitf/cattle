"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Padding = /** @class */ (function () {
    function Padding(top, right, bottom, left) {
        this.top = top || 0;
        this.right = right || 0;
        this.bottom = bottom || 0;
        this.left = left || 0;
    }
    Padding.hv = function (h, v) {
        return new Padding(v, h, v, h);
    };
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
    Padding.prototype.copy = function (changes) {
        var c = function (a, b) { return a !== undefined ? a : b; };
        return new Padding(c(changes.top, this.top), c(changes.right, this.right), c(changes.bottom, this.bottom), c(changes.left, this.left));
    };
    Padding.empty = new Padding(0, 0, 0, 0);
    return Padding;
}());
exports.Padding = Padding;
//# sourceMappingURL=Padding.js.map