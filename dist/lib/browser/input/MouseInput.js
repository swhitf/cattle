define(["require", "exports", "./EventTargetEventEmitterAdapter", "./MouseExpression", "./KeyCheck"], function (require, exports, EventTargetEventEmitterAdapter_1, MouseExpression_1, KeyCheck_1) {
    "use strict";
    var MouseInput = (function () {
        function MouseInput(emitters) {
            this.emitters = emitters;
            this.subs = [];
        }
        MouseInput.for = function () {
            var elmts = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                elmts[_i] = arguments[_i];
            }
            KeyCheck_1.KeyCheck.init();
            return new MouseInput(normalize(elmts));
        };
        MouseInput.prototype.on = function (expr, callback) {
            var _this = this;
            var ss = this.emitters.map(function (ee) { return _this.createListener(ee, MouseExpression_1.MouseExpression.parse(expr), callback); });
            this.subs = this.subs.concat(ss);
            return this;
        };
        MouseInput.prototype.createListener = function (target, expr, callback) {
            return target.on(expr.event, function (evt) {
                if (expr.matches(evt)) {
                    if (expr.exclusive) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                    callback(evt);
                }
            });
        };
        return MouseInput;
    }());
    exports.MouseInput = MouseInput;
    function normalize(kms) {
        return kms
            .map(function (x) { return (!!x['addEventListener'])
            ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
            : x; });
    }
});
//# sourceMappingURL=MouseInput.js.map