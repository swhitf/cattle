"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("../../misc/Util");
var DefaultGridCell_1 = require("./DefaultGridCell");
/**
 * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
 */
var DefaultGridModel = (function () {
    /**
     * Initializes a new instance of DefaultGridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    function DefaultGridModel(cells, columns, rows) {
        this.cells = cells;
        this.columns = columns;
        this.rows = rows;
        this.refresh();
    }
    /**
     * Creates an grid model with the specified number of columns and rows populated with default cells.
     *
     * @param cols
     * @param rows
     */
    DefaultGridModel.dim = function (cols, rows) {
        var cells = [];
        for (var c = 0; c < cols; c++) {
            for (var r = 0; r < rows; r++) {
                cells.push(new DefaultGridCell_1.DefaultGridCell({
                    colRef: c,
                    rowRef: r,
                    value: '',
                }));
            }
        }
        return new DefaultGridModel(cells, [], []);
    };
    /**
     * Creates an empty grid model.
     *
     * @returns {DefaultGridModel}
     */
    DefaultGridModel.empty = function () {
        return new DefaultGridModel([], [], []);
    };
    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    DefaultGridModel.prototype.findCell = function (ref) {
        return this.cellRefLookup[ref] || null;
    };
    /**
     * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
     * vector (direction) object, or null if no neighbor could be found.
     * @param ref
     * @param vector
     */
    DefaultGridModel.prototype.findCellNeighbor = function (ref, vector) {
        var cell = this.findCell(ref);
        var col = cell.colRef + vector.x;
        var row = cell.rowRef + vector.y;
        return this.locateCell(col, row);
    };
    /**
     * Given a column ref, returns the GridColumn object that represents the column, or null if the column did not exist
     * within the model.
     * @param ref
     */
    DefaultGridModel.prototype.findColumn = function (ref) {
        return this.colRefLookup[ref] || null;
    };
    /**
     * Given a row ref, returns the GridRow object that represents the row, or null if the row did not exist
     * within the model.
     * @param ref
     */
    DefaultGridModel.prototype.findRow = function (ref) {
        return this.rowRefLookup[ref] || null;
    };
    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    DefaultGridModel.prototype.locateCell = function (col, row) {
        return (this.cellCoordLookup[col] || {})[row] || null;
    };
    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    DefaultGridModel.prototype.refresh = function () {
        var _a = this, cells = _a.cells, columns = _a.columns, rows = _a.rows;
        this.cellRefLookup = _.index(cells, function (x) { return x.ref; });
        this.cellCoordLookup = {};
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var cell = cells_1[_i];
            for (var co = 0; co < cell.colSpan; co++) {
                for (var ro = 0; ro < cell.rowSpan; ro++) {
                    var c = cell.colRef + co;
                    var r = cell.rowRef + ro;
                    var cix = this.cellCoordLookup[c] || (this.cellCoordLookup[c] = {});
                    if (cix[r]) {
                        console.warn('Two cells appear to occupy', c, 'x', r);
                    }
                    cix[r] = cell;
                }
            }
        }
        this.colRefLookup = _.index(columns, function (x) { return x.ref; });
        this.rowRefLookup = _.index(rows, function (x) { return x.ref; });
    };
    return DefaultGridModel;
}());
exports.DefaultGridModel = DefaultGridModel;
//# sourceMappingURL=DefaultGridModel.js.map