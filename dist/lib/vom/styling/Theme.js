"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Theme = /** @class */ (function () {
    function Theme(name, styles) {
        this.dtv = 0;
        this.name = name;
        this.styles = [];
        if (styles) {
            this.extend(styles);
        }
    }
    Theme.prototype.extend = function () {
        var input = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            input[_i] = arguments[_i];
        }
        this.dtv++;
        return input.length > 1
            ? this.extendNew(input[0], input[1])
            : this.extendSet(input[0]);
    };
    Theme.prototype.extendSet = function (set) {
        for (var selector in set) {
            this.extendNew(selector, set[selector]);
        }
        return this;
    };
    Theme.prototype.extendNew = function (selector, props) {
        this.styles.push({
            selector: selector,
            props: props,
        });
        return this;
    };
    return Theme;
}());
exports.Theme = Theme;
//# sourceMappingURL=Theme.js.map