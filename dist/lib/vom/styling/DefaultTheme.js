"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Theme_1 = require("./Theme");
var DefaultTheme = /** @class */ (function (_super) {
    __extends(DefaultTheme, _super);
    function DefaultTheme() {
        var _this = _super.call(this, 'Default') || this;
        _this.extend(default_rules());
        return _this;
    }
    return DefaultTheme;
}(Theme_1.Theme));
exports.DefaultTheme = DefaultTheme;
function default_rules() {
    return {};
}
//# sourceMappingURL=DefaultTheme.js.map