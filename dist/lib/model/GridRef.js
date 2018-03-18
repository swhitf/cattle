"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../geom/Point");
var Base26_1 = require("../misc/Base26");
var GridRef = /** @class */ (function () {
    function GridRef() {
    }
    /**
     * Compares two cell refs and returns -1 if a is less than b, 1 if a is greater than b, otherwise 0.
     *
     * @param a
     * @param b
     */
    GridRef.compare = function (a, b) {
        var _a = this.unmakeToArray(a), ax = _a[0], ay = _a[1];
        var _b = this.unmakeToArray(b), bx = _b[0], by = _b[1];
        var yd = ay - by;
        if (yd == 0)
            return ax - bx;
        else
            return yd;
    };
    /**
     * Determines whether or not the specified string is a valid cell reference.
     *
     * @param str
     */
    GridRef.valid = function (str) {
        return !!(str || '').match(/[A-Za-z]+\d+/);
    };
    /**
     * Creates a cell reference string from the specified column and row references.
     *
     * @param col
     * @param row
     */
    GridRef.make = function (col, row) {
        return Base26_1.Base26.num(col).str + (row + 1).toString();
    };
    /**
     * Reads a cell reference string and returns the column and row reference values.
     *
     * @param cellRef
     */
    GridRef.unmake = function (cellRef) {
        var b26cr = '';
        var b10rr = '';
        for (var i = 0; i < cellRef.length; i++) {
            var c = cellRef.charAt(i);
            if (!isNaN(+c)) {
                b26cr = cellRef.slice(0, i);
                b10rr = cellRef.slice(i, cellRef.length);
                break;
            }
        }
        return { col: Base26_1.Base26.str(b26cr).num, row: parseInt(b10rr) - 1, };
    };
    /**
     * Reads a cell reference string and returns the column and row as the first and
     * second values in an array.
     *
     * @param cellRef
     */
    GridRef.unmakeToArray = function (cellRef) {
        var parts = this.unmake(cellRef);
        return [parts.col, parts.row];
    };
    /**
     * Creates a Point from a cell reference with the x as the column and y as the row.
     *
     * @param cellRef
     */
    GridRef.toPoint = function (cellRef) {
        return Point_1.Point.create(this.unmakeToArray(cellRef));
    };
    return GridRef;
}());
exports.GridRef = GridRef;
//# sourceMappingURL=GridRef.js.map