"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tracker = {};
exports.perf = window['perf'] = {
    time: function (key) {
        var e = entry(key);
        e.t = window.performance.now();
    },
    timeEnd: function (key) {
        var e = entry(key);
        e.r.push(window.performance.now() - e.t);
    },
    report: function (key, reset) {
        if (reset === void 0) { reset = true; }
        var e = entry(key);
        var a = key + ' -> ' + analyze(e.r);
        e.r = [];
        console.log(a);
        return a;
    },
};
function entry(key) {
    return tracker[key] || (tracker[key] = { t: 0, r: [] });
}
function analyze(r) {
    var min, max, total = undefined;
    for (var _i = 0, r_1 = r; _i < r_1.length; _i++) {
        var x = r_1[_i];
        if (min === undefined || min > x)
            min = x;
        if (max === undefined || max < x)
            max = x;
        if (total === undefined)
            total = 0;
        total += x;
    }
    return "Avg: " + total / r.length + "ms, Min: " + min + "ms, Max: " + max + "ms";
}
//# sourceMappingURL=perf.js.map