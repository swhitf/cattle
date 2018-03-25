"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VisualTracker = /** @class */ (function () {
    function VisualTracker() {
        this.values = {};
    }
    VisualTracker.prototype.get = function (key) {
        return this.values[key] || null;
    };
    VisualTracker.prototype.set = function (key, visual) {
        if (this.values[key]) {
            this.values[key].traits.remove(key);
        }
        this.values[key] = visual;
        if (this.values[key]) {
            this.values[key].traits.add(key);
        }
    };
    return VisualTracker;
}());
exports.VisualTracker = VisualTracker;
//# sourceMappingURL=VisualTracker.js.map