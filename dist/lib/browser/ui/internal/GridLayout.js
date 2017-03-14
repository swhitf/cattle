define(["require", "exports", "../../model/default/DefaultGridColumn", "../../model/default/DefaultGridRow", "../../geom/Rect", "../../misc/Util"], function (require, exports, DefaultGridColumn_1, DefaultGridRow_1, Rect_1, _) {
    "use strict";
    var GridLayout = (function () {
        function GridLayout(width, height, columns, rows, cells, cellLookup) {
            this.width = width;
            this.height = height;
            this.columns = columns;
            this.rows = rows;
            this.cells = cells;
            this.cellLookup = cellLookup;
            this.columnIndex = _.index(columns, function (x) { return x.ref; });
            this.rowIndex = _.index(rows, function (x) { return x.ref; });
            this.cellIndex = _.index(cells, function (x) { return x.ref; });
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
                (colLookup[i] || (colLookup[i] = new DefaultGridColumn_1.DefaultGridColumn(i)));
            }
            for (var i = 0; i <= maxRow; i++) {
                (rowLookup[i] || (rowLookup[i] = new DefaultGridRow_1.DefaultGridRow(i)));
            }
            // Compute width and height of whole grid
            var width = _.values(colLookup).reduce(function (t, x) { return t + x.width; }, 0) + padding.horizontal;
            var height = _.values(rowLookup).reduce(function (t, x) { return t + x.height; }, 0) + padding.vertical;
            // Compute the layout regions for the various bits
            var colRegs = [];
            var rowRegs = [];
            var cellRegs = [];
            var accLeft = padding.left;
            for (var ci = 0; ci <= maxCol; ci++) {
                var col = colLookup[ci];
                colRegs.push({
                    ref: col.ref,
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
                            ref: row.ref,
                            left: 0,
                            top: accTop,
                            width: width,
                            height: row.height,
                        });
                    }
                    if (cellLookup[ci] !== undefined && cellLookup[ci][ri] !== undefined) {
                        var cell = cellLookup[ci][ri];
                        cellRegs.push({
                            ref: cell.ref,
                            left: accLeft,
                            top: accTop,
                            width: col.width,
                            height: row.height,
                        });
                    }
                    accTop += row.height;
                }
                accLeft += col.width;
            }
            return new GridLayout(width, height, colRegs, rowRegs, cellRegs, cellLookup);
        };
        GridLayout.prototype.queryColumn = function (ref) {
            return this.columnIndex[ref] || null;
        };
        GridLayout.prototype.queryColumnRange = function (fromRef, toRefEx) {
            var likes = [];
            for (var i = fromRef; i < toRefEx; i++) {
                likes.push(this.queryColumn(i));
            }
            return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
        };
        GridLayout.prototype.queryRow = function (ref) {
            return this.rowIndex[ref] || null;
        };
        GridLayout.prototype.queryRowRange = function (fromRef, toRefEx) {
            var likes = [];
            for (var i = fromRef; i < toRefEx; i++) {
                likes.push(this.queryRow(i));
            }
            return Rect_1.Rect.fromMany(likes.map(Rect_1.Rect.fromLike));
        };
        GridLayout.prototype.queryCell = function (ref) {
            return this.cellIndex[ref] || null;
        };
        GridLayout.prototype.captureColumns = function (region) {
            return this.columns
                .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
                .map(function (x) { return x.ref; });
        };
        GridLayout.prototype.captureRows = function (region) {
            return this.rows
                .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
                .map(function (x) { return x.ref; });
        };
        GridLayout.prototype.captureCells = function (region) {
            var cols = this.captureColumns(region);
            var rows = this.captureRows(region);
            var cells = new Array();
            for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
                var c = cols_1[_i];
                for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                    var r = rows_1[_a];
                    var cell = this.cellLookup[c][r];
                    if (!!cell) {
                        cells.push(cell.ref);
                    }
                }
            }
            return cells;
        };
        return GridLayout;
    }());
    exports.GridLayout = GridLayout;
    function buildCellLookup(cells) {
        var ix = {};
        for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
            var c = cells_1[_i];
            var cix = ix[c.colRef] || (ix[c.colRef] = {});
            cix[c.rowRef] = c;
        }
        return ix;
    }
});
//# sourceMappingURL=GridLayout.js.map