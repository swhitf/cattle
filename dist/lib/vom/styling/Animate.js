"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Animate = /** @class */ (function () {
    function Animate() {
    }
    Animate.visual = function (visual) {
        return new AnimationBuilderImpl(visual);
    };
    return Animate;
}());
exports.Animate = Animate;
var AnimationBuilderImpl = /** @class */ (function () {
    function AnimationBuilderImpl(visual) {
        var _this = this;
        this.visual = visual;
        if (!visual.isMounted()) {
            throw 'Visual must be mounted before being animated.';
        }
        this.animation = new Animation(visual);
        setTimeout(function () { return visual.surface.ticker.add(_this.animation); }, 0);
    }
    AnimationBuilderImpl.prototype.every = function (intervalTime, callback) {
        var factory = (function (visual) {
            var ellapsed = 0;
            return function (dt) {
                ellapsed += (1000 * dt);
                if (ellapsed > intervalTime) {
                    ellapsed -= intervalTime;
                    return callback(visual) !== false;
                }
            };
        });
        this.animation.functions.push(factory(this.visual));
        return this;
    };
    AnimationBuilderImpl.prototype.over = function (tweenTime) {
        throw 'Not implemented';
    };
    return AnimationBuilderImpl;
}());
var Animation = /** @class */ (function () {
    function Animation(visual) {
        var _this = this;
        this.visual = visual;
        this.functions = [];
        this.stop = false;
        var es = visual.parent.on('compose', function () {
            if (!visual.isMounted()) {
                es.destroy();
                _this.stop = true;
            }
        });
    }
    Animation.prototype.tick = function (dt) {
        if (this.stop || this.functions.length == 0) {
            return false;
        }
        for (var _i = 0, _a = this.functions; _i < _a.length; _i++) {
            var f = _a[_i];
            if (f(dt) === false) {
                return false;
            }
        }
    };
    return Animation;
}());
//# sourceMappingURL=Animate.js.map