define(["require", "exports", "./KeyExpression", "./EventTargetEventEmitterAdapter"], function (require, exports, KeyExpression_1, EventTargetEventEmitterAdapter_1) {
    "use strict";
    var KeyInput = (function () {
        function KeyInput(emitters) {
            this.emitters = emitters;
            this.subs = [];
        }
        KeyInput.for = function () {
            var elmts = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                elmts[_i] = arguments[_i];
            }
            return new KeyInput(normalize(elmts));
        };
        KeyInput.prototype.on = function (exprs, callback) {
            var _this = this;
            if (!Array.isArray(exprs)) {
                return this.on([exprs], callback);
            }
            var _loop_1 = function (re) {
                var ss = this_1.emitters.map(function (ee) { return _this.createListener(ee, KeyExpression_1.KeyExpression.parse(re), callback); });
                this_1.subs = this_1.subs.concat(ss);
            };
            var this_1 = this;
            for (var _i = 0, exprs_1 = exprs; _i < exprs_1.length; _i++) {
                var re = exprs_1[_i];
                _loop_1(re);
            }
            return this;
        };
        KeyInput.prototype.createListener = function (ee, ke, callback) {
            return ee.on('keydown', function (evt) {
                if (ke.matches(evt)) {
                    if (ke.exclusive) {
                        evt.preventDefault();
                        evt.stopPropagation();
                    }
                    callback();
                }
            });
        };
        return KeyInput;
    }());
    exports.KeyInput = KeyInput;
    function normalize(kms) {
        return kms
            .map(function (x) { return (!!x['addEventListener'])
            ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
            : x; });
    }
});
//# sourceMappingURL=KeyInput.js.map