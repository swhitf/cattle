define(["require", "exports"], function (require, exports) {
    "use strict";
    var DefaultHistoryManager = (function () {
        function DefaultHistoryManager() {
            this.future = [];
            this.past = [];
        }
        Object.defineProperty(DefaultHistoryManager.prototype, "futureCount", {
            get: function () {
                return this.future.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DefaultHistoryManager.prototype, "pastCount", {
            get: function () {
                return this.past.length;
            },
            enumerable: true,
            configurable: true
        });
        DefaultHistoryManager.prototype.clear = function () {
            this.past = [];
            this.future = [];
        };
        DefaultHistoryManager.prototype.push = function (action) {
            this.past.push(action);
            this.future = [];
        };
        DefaultHistoryManager.prototype.redo = function () {
            if (!this.future.length) {
                return false;
            }
            var action = this.future.pop();
            action.apply();
            this.past.push(action);
            return true;
        };
        DefaultHistoryManager.prototype.undo = function () {
            if (!this.past.length) {
                return false;
            }
            var action = this.past.pop();
            action.rollback();
            this.future.push(action);
            return true;
        };
        return DefaultHistoryManager;
    }());
    exports.DefaultHistoryManager = DefaultHistoryManager;
});
//# sourceMappingURL=HistoryManager.js.map