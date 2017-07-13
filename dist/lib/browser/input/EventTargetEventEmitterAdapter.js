define(["require", "exports", "../misc/Util"], function (require, exports, _) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var EventTargetEventEmitterAdapter = (function () {
        function EventTargetEventEmitterAdapter(target) {
            this.target = target;
        }
        EventTargetEventEmitterAdapter.wrap = function (target) {
            if (!!target['addEventListener']) {
                return new EventTargetEventEmitterAdapter(target);
            }
            return target;
        };
        EventTargetEventEmitterAdapter.prototype.on = function (event, callback) {
            var _this = this;
            this.target.addEventListener(event, callback);
            return {
                cancel: function () { return _this.off(event, callback); },
            };
        };
        EventTargetEventEmitterAdapter.prototype.off = function (event, callback) {
            this.target.removeEventListener(event, callback);
        };
        EventTargetEventEmitterAdapter.prototype.emit = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            this.target.dispatchEvent(_.extend(new Event(event), { args: args }));
        };
        return EventTargetEventEmitterAdapter;
    }());
    exports.EventTargetEventEmitterAdapter = EventTargetEventEmitterAdapter;
});
//# sourceMappingURL=EventTargetEventEmitterAdapter.js.map