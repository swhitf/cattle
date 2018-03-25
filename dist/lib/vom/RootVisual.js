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
var Visual_1 = require("./Visual");
var RootVisual = /** @class */ (function (_super) {
    __extends(RootVisual, _super);
    function RootVisual(owner) {
        var _this = _super.call(this) || this;
        _this.owner = owner;
        _this.canHost = true;
        _this.type = 'root';
        return _this;
    }
    Object.defineProperty(RootVisual.prototype, "surface", {
        get: function () {
            return this.owner;
        },
        enumerable: true,
        configurable: true
    });
    RootVisual.prototype.isMounted = function () {
        //Root is always mounted!
        return true;
    };
    RootVisual.prototype.render = function (gfx) {
        //Root never renders anything!
    };
    return RootVisual;
}(Visual_1.Visual));
exports.RootVisual = RootVisual;
//# sourceMappingURL=RootVisual.js.map