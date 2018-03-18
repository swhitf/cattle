"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Border = /** @class */ (function () {
    function Border(width, color, dash) {
        this.width = (width !== undefined) ? width : 1;
        this.color = color || 'gainsboro';
        this.dash = dash || [];
    }
    Border.prototype.copy = function (changes) {
        changes = (changes || {});
        return new Border((changes.width !== undefined) ? changes.width : this.width, changes.color || this.color, changes.dash || this.dash);
    };
    Border.default = new Border();
    return Border;
}());
exports.Border = Border;
//# sourceMappingURL=Border.js.map