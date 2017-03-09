"use strict";
var WatchManager = (function () {
    function WatchManager() {
        this.observing = {};
        this.observed = {};
    }
    WatchManager.prototype.clear = function () {
        this.observing = {};
        this.observed = {};
    };
    WatchManager.prototype.getObserversOf = function (cellRef) {
        return this.observed[cellRef] || [];
    };
    WatchManager.prototype.getObservedBy = function (cellRef) {
        return this.observing[cellRef] || [];
    };
    WatchManager.prototype.watch = function (observer, subjects) {
        if (!subjects || !subjects.length)
            return;
        this.observing[observer] = subjects;
        for (var _i = 0, subjects_1 = subjects; _i < subjects_1.length; _i++) {
            var s = subjects_1[_i];
            var list = this.observed[s] || (this.observed[s] = []);
            list.push(observer);
        }
    };
    WatchManager.prototype.unwatch = function (observer) {
        var subjects = this.getObservedBy(observer);
        delete this.observing[observer];
        for (var _i = 0, subjects_2 = subjects; _i < subjects_2.length; _i++) {
            var s = subjects_2[_i];
            var list = this.observed[s] || [];
            var ix = list.indexOf(observer);
            if (ix >= 0) {
                list.splice(ix, 1);
            }
        }
    };
    return WatchManager;
}());
exports.WatchManager = WatchManager;
//# sourceMappingURL=WatchManager.js.map