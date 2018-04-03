"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CallbackDestroyable_1 = require("./CallbackDestroyable");
var SimpleEventEmitter = /** @class */ (function () {
    function SimpleEventEmitter() {
        this.buckets = {};
    }
    SimpleEventEmitter.prototype.on = function (event, callback) {
        var _this = this;
        this.getCallbackList(event).push(callback);
        return new CallbackDestroyable_1.CallbackDestroyable(function () { return _this.off(event, callback); });
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
//# sourceMappingURL=SimpleEventEmitter.js.map