"use strict";
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var StyledGridCell_1 = require("../model/styled/StyledGridCell");
var ExampleGridBuilder = (function () {
    function ExampleGridBuilder(lines, cols, style) {
        if (lines === void 0) { lines = 100; }
        if (cols === void 0) { cols = 52; }
        this.lines = lines;
        this.cols = cols;
        this.style = style;
    }
    ExampleGridBuilder.prototype.build = function () {
        var cells = [];
        this.createColumnRow(cells);
        for (var i = 0; i < this.lines; i++) {
            this.createResourceRow(cells, i);
        }
        return new DefaultGridModel_1.DefaultGridModel(cells, [], []);
    };
    ExampleGridBuilder.prototype.createColumnRow = function (cells) {
        cells.push(new StyledGridCell_1.StyledGridCell({
            colRef: 0,
            rowRef: 0,
            value: '+',
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new StyledGridCell_1.StyledGridCell({
                colRef: i + 1,
                rowRef: 0,
                value: 'Vertical #' + (i + 1),
            }));
        }
    };
    ExampleGridBuilder.prototype.createResourceRow = function (cells, line) {
        cells.push(new StyledGridCell_1.StyledGridCell({
            colRef: 0,
            rowRef: line + 1,
            value: "Horizontal #" + line,
        }));
        for (var i = 0; i < this.cols; i++) {
            cells.push(new StyledGridCell_1.StyledGridCell({
                colRef: i + 1,
                rowRef: line + 1,
                value: (line + i).toString(),
                style: this.style,
                placeholder: '-'
            }));
        }
    };
    return ExampleGridBuilder;
}());
exports.ExampleGridBuilder = ExampleGridBuilder;
//# sourceMappingURL=ExampleGridBuilder.js.map