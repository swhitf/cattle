"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var data = {
    start: 0,
    counters: {},
    timers: {},
};
var Timer = function () {
    var _this = this;
    this.start = performance.now();
    this.stop = function () {
        _this.end = performance.now();
    };
    this.val = function () {
        return _this.end - _this.start;
    };
};
var Report = /** @class */ (function () {
    function Report() {
    }
    Report.begin = function () {
        if (!this.enabled)
            return;
        data.counters = {};
        data.start = performance.now();
        data.timers = {};
    };
    Report.time = function (what, callback) {
        if (!this.enabled) {
            if (callback)
                callback();
            else
                return function () { };
        }
        ;
        var list = (data.timers[what] || (data.timers[what] = []));
        var t = new Timer();
        list.push(t);
        if (callback) {
            callback();
            t.stop();
        }
        else {
            return t.stop;
        }
    };
    Report.count = function (what, value) {
        if (!this.enabled)
            return;
        if (data.counters[what] === undefined) {
            data.counters[what] = 0;
        }
        if (value === undefined) {
            data.counters[what]++;
        }
        else {
            data.counters[what] = value;
        }
    };
    Report.complete = function (print) {
        if (print === void 0) { print = true; }
        if (!this.enabled)
            return;
        if (print) {
            console.clear();
            console.info('Render Report at', new Date().getTime(), 'in', performance.now() - data.start);
            console.info('  Timers:');
            for (var key in data.timers) {
                var list = data.timers[key].map(function (x) { return x.val(); });
                if (list.length > 1) {
                    console.info('   ', list.length, key, 'Avg', list.reduce(function (x, t) { return x + t; }, 0) / list.length, 'Min', Math.min.apply(Math, list), 'Max', Math.max.apply(Math, list), 'Sum', list.reduce(function (x, t) { return x + t; }, 0));
                }
                else {
                    console.info('   ', 1, key, list[0]);
                }
            }
            // console.info('  Messages:')
            // data.logs.forEach(x => console.info('    ' + x));
        }
        return data;
    };
    Report.enabled = true;
    return Report;
}());
exports.Report = Report;
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
//# sourceMappingURL=Report.js.map