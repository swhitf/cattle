"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridColumn_1 = require("./GridColumn");
var GridCell_1 = require("./GridCell");
var GridRow_1 = require("./GridRow");
var u = require("../misc/Util");
/**
 * Represents the logical composition of a grid.  It hosts the collections of the various entity model
 * objects as well as methods for access and inspection.  All inspection methods use O(1) implementations.
 */
var GridModel = /** @class */ (function () {
    /**
     * Initializes a new instance of GridModel.
     *
     * @param cells
     * @param columns
     * @param rows
     */
    function GridModel(cells, columns, rows) {
        this.dims = { width: 0, height: 0 };
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
    GridModel.dim = function (width, height) {
        var cells = [];
        var columns = [];
        var rows = [];
        for (var c = 0; c < width; c++) {
            columns.push(new GridColumn_1.GridColumn(c));
            for (var r = 0; r < height; r++) {
                if (r == 0) {
                    rows.push(new GridRow_1.GridRow(r));
                }
                cells.push(new GridCell_1.GridCell({
                    colRef: c,
                    rowRef: r,
                    value: '',
                }));
            }
        }
        return new GridModel(cells, columns, rows);
    };
    /**
     * Creates an empty grid model.
     *
     * @returns {GridModel}
     */
    GridModel.empty = function () {
        return new GridModel([], [], []);
    };
    Object.defineProperty(GridModel.prototype, "width", {
        /**
         * Gets the width of the model in columns.
         */
        get: function () {
            return this.dims.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridModel.prototype, "height", {
        /**
         * Gets the height of the model in rows.
         */
        get: function () {
            return this.dims.height;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
     * within the model.
     * @param ref
     */
    GridModel.prototype.findCell = function (ref) {
        return this.byId[ref] || null;
    };
    /**
     * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
     * vector (direction) object, or null if no neighbor could be found.
     * @param ref
     * @param vector
     */
    GridModel.prototype.findCellNeighbor = function (ref, vector) {
        var cell = this.findCell(ref);
        var col = cell.colRef + vector.x;
        var row = cell.rowRef + vector.y;
        return this.locateCell(col, row);
    };
    /**
     * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
     * or null if no cell could be found.
     * @param colRef
     * @param rowRef
     */
    GridModel.prototype.locateCell = function (col, row) {
        return (this.byCoord[col] || {})[row] || null;
    };
    /**
     * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
     */
    GridModel.prototype.refresh = function () {
        var cells = this.cells;
        this.byId = u.index(cells, function (x) { return x.ref; });
        this.byCoord = {};
        this.dims = { width: 0, height: 0 };
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var cell = cells_1[_i];
            if (this.dims.width < cell.colRef + cell.colSpan) {
                this.dims.width = cell.colRef + cell.colSpan;
            }
            if (this.dims.height < cell.rowRef + cell.rowSpan) {
                this.dims.height = cell.rowRef + cell.rowSpan;
            }
            for (var co = 0; co < cell.colSpan; co++) {
                for (var ro = 0; ro < cell.rowSpan; ro++) {
                    var c = cell.colRef + co;
                    var r = cell.rowRef + ro;
                    var cix = this.byCoord[c] || (this.byCoord[c] = {});
                    if (cix[r]) {
                        console.warn('Two cells appear to occupy', c, 'x', r);
                    }
                    cix[r] = cell;
                }
            }
        }
    };
    return GridModel;
}());
exports.GridModel = GridModel;
//# sourceMappingURL=GridModel.js.map