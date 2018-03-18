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
var SimpleEventEmitter = /** @class */ (function () {
    function SimpleEventEmitter() {
        this.buckets = {};
    }
    SimpleEventEmitter.prototype.on = function (event, callback) {
        var _this = this;
        this.getCallbackList(event).push(callback);
        return new CallbackDestroyable(function () { return _this.off(event, callback); });
    };
    SimpleEventEmitter.prototype.off = function (event, callback) {
        var list = this.getCallbackList(event);
        if (callback) {
            var idx = list.indexOf(callback);
            if (idx >= 0) {
                list.splice(idx, 1);
            }
        }
        else {
            list.splice(0, list.length);
        }
    };
    SimpleEventEmitter.prototype.emit = function (evt) {
        var list = this.getCallbackList(evt.type);
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var callback = list_1[_i];
            callback.call(null, evt);
        }
    };
    SimpleEventEmitter.prototype.getCallbackList = function (event) {
        return this.buckets[event] || (this.buckets[event] = []);
    };
    return SimpleEventEmitter;
}());
exports.SimpleEventEmitter = SimpleEventEmitter;
var CallbackDestroyable = /** @class */ (function (_super) {
    __extends(CallbackDestroyable, _super);
    function CallbackDestroyable(callback) {
        var _this = _super.call(this) || this;
        _this.callback = callback;
        return _this;
    }
    CallbackDestroyable.prototype.destroy = function () {
        this.destroy();
        this.callback();
    };
    return CallbackDestroyable;
}(AbstractDestroyable_1.AbstractDestroyable));
//# sourceMappingURL=SimpleEventEmitter.js.map