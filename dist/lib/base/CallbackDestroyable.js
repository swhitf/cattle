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
var AbstractDestroyable_1 = require("./AbstractDestroyable");
/**
 * Implements a Destroyable that accepts the destroy routine as a callback.
 */
var CallbackDestroyable = /** @class */ (function (_super) {
    __extends(CallbackDestroyable, _super);
    /**
     * Initializes a new instance of CallbackDestroyable.
     *
     * @param callback The callback to invoke on destroy.
     */
    function CallbackDestroyable(callback) {
        var _this = _super.call(this) || this;
        _this.callback = callback;
        return _this;
    }
    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    CallbackDestroyable.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.callback();
    };
    return CallbackDestroyable;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.CallbackDestroyable = CallbackDestroyable;
//# sourceMappingURL=CallbackDestroyable.js.map