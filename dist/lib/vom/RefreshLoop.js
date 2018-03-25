"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RefreshLoop = /** @class */ (function () {
    function RefreshLoop(fps) {
        if (fps === void 0) { fps = 60; }
        this.fps = fps;
        this.destroyed = false;
        this.tickers = [];
    }
    RefreshLoop.prototype.destroy = function () {
        this.destroyed = true;
    };
    RefreshLoop.prototype.add = function (name, ticker) {
        this.tickers.push({
            name: name,
            tick: ticker.tick ? ticker.tick.bind(ticker) : ticker
        });
        return this;
    };
    RefreshLoop.prototype.remove = function (ticker) {
        this.tickers = this.tickers.filter(function (x) { return x.tick != ticker; });
        return this;
    };
    RefreshLoop.prototype.start = function () {
        var _this = this;
        var now;
        var then = Date.now();
        var interval = 1000 / this.fps;
        var delta;
        var remove = [];
        var meter = window['fps'];
        var tick = function () {
            if (_this.destroyed) {
                return;
            }
            if (meter) {
                meter.tickStart();
            }
            requestAnimationFrame(tick);
            now = Date.now();
            delta = now - then;
            if (delta > interval) {
                var dt_1 = delta / 1000;
                _this.tickers.forEach(function (x) {
                    //console.time(`tick/${x.name}`);
                    if (x.tick(dt_1) === false) {
                        remove.push(x);
                    }
                    //console.timeEnd(`tick/${x.name}`);
                });
                // Just `then = now` is not enough.
                // Lets say we set fps at 10 which means
                // each frame must take 100ms
                // Now frame executes in 16ms (60fps) so
                // the loop iterates 7 times (16*7 = 112ms) until
                // delta > interval === true
                // Eventually this lowers down the FPS as
                // 112*10 = 1120ms (NOT 1000ms).
                // So we have to get rid of that extra 12ms
                // by subtracting delta (112) % interval (100).
                // Hope that makes sense.
                then = now - (delta % interval);
            }
            if (meter) {
                meter.tick();
            }
            if (remove.length) {
                remove.forEach(function (x) { return _this.remove(x); });
                remove = [];
            }
        };
        tick();
    };
    return RefreshLoop;
}());
exports.RefreshLoop = RefreshLoop;
//# sourceMappingURL=RefreshLoop.js.map