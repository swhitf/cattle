"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var u = require("../misc/Util");
var GridRef_1 = require("./GridRef");
/**
 * Provides a method of selecting and representing a range of cells from a `GridModel`.  GridRanges
 * will always be rectangular and contain no gaps unless there are cells missing.
 */
var GridRange = /** @class */ (function () {
    function GridRange(values) {
        u.extend(this, values);
    }
    /**
     * Creates a new GridRange object from the specified cellRefs by expanding the list to
     * include those that fall within the rectangle of the upper left most and lower right
     * most two cells in the list.  In the example below C2, D2, D3 and E3 will be expanded
     * to also include E2 and C3.
     *
     * A B C D E F
     * 1
     * 2   X X ^
     * 3   ^ X X
     * 4
     * 5
     *
     * @param model
     * @param cellRefs
     * @returns {Range}
     */
    GridRange.fromRefs = function (model, cellRefs) {
        if (!cellRefs.length)
            return GridRange.empty();
        var _a = GridRef_1.GridRef.unmakeToArray(cellRefs[0]), loCol = _a[0], loRow = _a[1];
        var _b = [loCol, loRow], hiCol = _b[0], hiRow = _b[1];
        for (var _i = 0, cellRefs_1 = cellRefs; _i < cellRefs_1.length; _i++) {
            var cr = cellRefs_1[_i];
            var _c = GridRef_1.GridRef.unmakeToArray(cr), col = _c[0], row = _c[1];
            if (loCol > col)
                loCol = col;
            if (hiCol < col)
                hiCol = col;
            if (loRow > row)
                loRow = row;
            if (hiRow < row)
                hiRow = row;
        }
        var cells = [];
        var tracker = {}; //Track to prevent dupes when row/col span > 1
        for (var col = loCol; col < (hiCol + 1); col++) {
            for (var row = loRow; row < (hiRow + 1); row++) {
                var cell = model.locateCell(col, row);
                if (tracker[cell.ref])
                    continue;
                cells.push(cell);
                tracker[cell.ref] = true;
            }
        }
        return this.createInternal(model, cells);
    };
    /**
     * Returns a GridRange that includes all cells captured by computing a rectangle around the
     * specified cell coordinates.
     *
     * @param model
     * @param points
     */
    GridRange.fromPoints = function (model, points) {
        var refs = points.map(function (p) { return GridRef_1.GridRef.make(p.x, p.y); });
        return GridRange.fromRefs(model, refs);
    };
    /**
     * Selects a range of cells using an Excel-like range expression. For example:
     * - A1 selects a 1x1 range of the first cell
     * - A1:A5 selects a 1x5 range from the first cell horizontally.
     * - A1:E5 selects a 5x5 range from the first cell evenly.
     *
     * @param model
     * @param query
     */
    GridRange.fromQuery = function (model, query) {
        var _a = query.split(':'), from = _a[0], to = _a[1];
        to = to || from;
        return GridRange.fromRefs(model, [to, from]);
    };
    /**
     * Creates an empty GridRange object.
     *
     * @returns {Range}
     */
    GridRange.empty = function () {
        return new GridRange({
            ltr: [],
            ttb: [],
            width: 0,
            height: 0,
            length: 0,
        });
    };
    GridRange.createInternal = function (model, cells) {
        if (!cells.length) {
            return GridRange.empty();
        }
        cells = cells.sort(function (a, b) { return GridRef_1.GridRef.compare(a.ref, b.ref); });
        var _a = GridRef_1.GridRef.unmakeToArray(cells[0].ref), lc = _a[0], lr = _a[1];
        var _b = GridRef_1.GridRef.unmakeToArray(u.last(cells).ref), hc = _b[0], hr = _b[1];
        return new GridRange({
            ltr: cells,
            width: (hc - lc) + 1,
            height: (hr - lr) + 1,
            length: ((hc - lc) + 1) * ((hr - lr) + 1),
        });
    };
    /**
     * Indicates whether or not a cell is included in the range.
     */
    GridRange.prototype.contains = function (cellRef) {
        if (!this.index) {
            this.index = u.index(this.ltr, function (x) { return x.ref; });
        }
        return !!this.index[cellRef];
    };
    /**
     * Returns an array of the references for all the cells in the range.
     */
    GridRange.prototype.refs = function () {
        return this.ltr.map(function (x) { return x.ref; });
    };
    /**
     * Returns the first cell in the range.
     */
    GridRange.prototype.first = function () {
        return this.ltr[0] || null;
    };
    /**
     * Returns the last cell in the range.
     */
    GridRange.prototype.last = function () {
        return this.ltr[this.ltr.length - 1] || null;
    };
    return GridRange;
}());
exports.GridRange = GridRange;
//# sourceMappingURL=GridRange.js.map