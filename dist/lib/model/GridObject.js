"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var next = (function () {
    var val = Number.MIN_SAFE_INTEGER;
    return function () {
        return val++;
    };
})();
/**
 * Represents an object within a grid model.
 */
var GridObject = /** @class */ (function () {
    function GridObject() {
        this.nval = next();
    }
    Object.defineProperty(GridObject.prototype, "nonce", {
        /**
         * Gets a numerical value that represents the unique state of the element.  When an Observable()
         * property on the element changes, the nonce will change.  It will never change back to the
         * same value.  This is used for dirty tracking.
         */
        get: function () {
            return this.nval;
        },
        enumerable: true,
        configurable: true
    });
    GridObject.prototype.notifyChange = function (property) {
        this.nval = next();
    };
    return GridObject;
}());
exports.GridObject = GridObject;
//# sourceMappingURL=GridObject.js.map