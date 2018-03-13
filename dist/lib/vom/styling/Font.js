"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Font = /** @class */ (function () {
    function Font(family, size, weight, styling, variant) {
        this.family = family || 'sans-serif';
        this.size = size || 14;
        this.weight = weight || 400;
        this.styling = styling || 'normal';
        this.variant = variant || 'normal';
    }
    Font.prototype.copy = function (changes) {
        return new Font(changes.family || this.family, changes.size || this.size, changes.weight || this.weight, changes.styling || this.styling, changes.variant || this.variant);
    };
    Font.prototype.toString = function () {
        return this.styling + " " + this.variant + " " + this.weight + " " + this.size + "px " + this.family;
    };
    Font.default = new Font();
    return Font;
}());
exports.Font = Font;
//# sourceMappingURL=Font.js.map