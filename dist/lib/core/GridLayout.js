"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../geom/Rect");
var GridColumn_1 = require("../model/GridColumn");
var GridRow_1 = require("../model/GridRow");
var u = require("../misc/Util");
var GridLayout = /** @class */ (function () {
    function GridLayout(width, height, columns, rows, cells, cellLookup) {
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.rows = rows;
        this.cells = cells;
        this.cellLookup = cellLookup;
        this.columnIndex = u.index(columns, function (x) { return x.object.ref; });
        this.rowIndex = u.index(rows, function (x) { return x.object.ref; });
        this.cellIndex = u.index(cells, function (x) { return x.object.ref; });
    }
    GridLayout.compute = function (model, padding) {
        var colLookup = model.columns.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var rowLookup = model.rows.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var cellLookup = buildCellLookup(model.cells); //by col then row
        // Compute all expected columns and rows
        var maxCol = model.cells.map(function (x) { return x.colRef + (x.colSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        var maxRow = model.cells.map(function (x) { return x.rowRef + (x.rowSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        // Generate missing columns and rows
        for (var i = 0; i <= maxCol; i++) {
            (colLookup[i] || (colLookup[i] = new GridColumn_1.GridColumn(i)));
        }
        for (var i = 0; i <= maxRow; i++) {
            (rowLookup[i] || (rowLookup[i] = new GridRow_1.GridRow(i)));
        }
        // Compute width and height of whole grid
        var width = u.values(colLookup).reduce(function (t, x) { return t + x.width; }, 0) + padding.horizontal;
        var height = u.values(rowLookup).reduce(function (t, x) { return t + x.height; }, 0) + padding.vertical;
        // Compute the layout regions for the various bits
        var colRegs = [];
        var rowRegs = [];
        var cellRegs = [];
        var loadTracker = {};
        var accLeft = padding.left;
        for (var ci = 0; ci <= maxCol; ci++) {
            var col = colLookup[ci];
            colRegs.push({
                object: col,
                left: accLeft,
                top: 0,
                width: col.width,
                height: height,
            });
            var accTop = padding.top;
            for (var ri = 0; ri <= maxRow; ri++) {
                var row = rowLookup[ri];
                if (ci === 0) {
                    rowRegs.push({
                        object: row,
                        left: 0,
                        top: accTop,
                        width: width,
                        height: row.height,
                    });
                }
                if (cellLookup[ci] !== undefined && cellLookup[ci][ri] !== undefined) {
                    var cell = cellLookup[ci][ri];
                    if (cell && !loadTracker[cell.ref]) {
                        var width_1 = 0, height_1 = 0;
                        //Take colSpan and rowSpan into account
                        for (var cix = ci; cix <= maxCol && cix < (ci + cell.colSpan); cix++) {
                            width_1 += colLookup[cix].width;
                        }
                        for (var rix = ri; rix <= maxRow && rix < (ri + cell.rowSpan); rix++) {
                            height_1 += rowLookup[rix].height;
                        }
                        cellRegs.push({
                            object: cell,
                            left: accLeft,
                            top: accTop,
                            width: width_1,
                            height: height_1,
                        });
                        loadTracker[cell.ref] = true;
                    }
                }
                accTop += row.height;
            }
            accLeft += col.width;
        }
        return new GridLayout(width, height, colRegs, rowRegs, cellRegs, cellLookup);
    };
    GridLayout.prototype.captureColumns = function (region) {
        return this.columns
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.object; });
    };
    GridLayout.prototype.captureRows = function (region) {
        return this.rows
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.object; });
    };
    GridLayout.prototype.captureCells = function (region) {
        var lookup = this.cellLookup;
        var cols = this.captureColumns(region);
        var rows = this.captureRows(region);
        var cells = [];
        for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
            var c = cols_1[_i];
            if (!lookup[c.ref])
                continue;
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var r = rows_1[_a];
                if (!lookup[c.ref][r.ref])
                    continue;
                cells.push(lookup[c.ref][r.ref]);
            }
        }
        return cells;
    };
    GridLayout.prototype.measureColumn = function (ref) {
        return this.columnIndex[ref] || null;
    };
    GridLayout.prototype.measureColumnRange = function (fromRef, toRefEx) {
        var likes = [];
        for (var i = fromRef; i < toRefEx; i++) {
            likes.push(this.measureColumn(i));
        }
        return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
    };
    GridLayout.prototype.measureRow = function (ref) {
        return this.rowIndex[ref] || null;
    };
    GridLayout.prototype.measureRowRange = function (fromRef, toRefEx) {
        var likes = [];
        for (var i = fromRef; i < toRefEx; i++) {
            likes.push(this.measureRow(i));
        }
        return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
    };
    GridLayout.prototype.measureCell = function (ref) {
        return this.cellIndex[ref] || null;
    };
    GridLayout.prototype.pickColumn = function (at) {
        for (var _i = 0, _a = this.columns; _i < _a.length; _i++) {
            var c = _a[_i];
            if (Rect_1.Rect.prototype.contains.call(c, at)) {
                return c.object;
            }
        }
        return null;
    };
    GridLayout.prototype.pickRow = function (at) {
        for (var _i = 0, _a = this.rows; _i < _a.length; _i++) {
            var r = _a[_i];
            if (Rect_1.Rect.prototype.contains.call(r, at)) {
                return r.object;
            }
        }
        return null;
    };
    GridLayout.prototype.pickCell = function (at) {
        var c = this.pickColumn(at);
        var r = this.pickRow(at);
        if (!!c && !!r) {
            return this.cellLookup[c.ref][r.ref];
        }
        return null;
    };
    GridLayout.empty = new GridLayout(0, 0, [], [], [], {});
    return GridLayout;
}());
exports.GridLayout = GridLayout;
function buildCellLookup(cells) {
    var ix = {};
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var cell = cells_1[_i];
        for (var co = 0; co < cell.colSpan; co++) {
            for (var ro = 0; ro < cell.rowSpan; ro++) {
                var c = cell.colRef + co;
                var r = cell.rowRef + ro;
                var cix = ix[c] || (ix[c] = {});
                if (cix[r]) {
                    console.warn('Two cells appear to occupy', c, 'x', r);
                }
                cix[r] = cell;
            }
        }
    }
    return ix;
}
//# sourceMappingURL=GridLayout.js.map