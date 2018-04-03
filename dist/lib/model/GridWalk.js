"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../geom/Point");
var GridWalk = /** @class */ (function () {
    function GridWalk() {
    }
    GridWalk.toDataPoint = function (model, fromRef, vector, strategy) {
        strategy = strategy || defaultDataPointDetectStrategy;
        return GridWalk.until(model, fromRef, vector, function (c, v, m) { return strategy(c, v, m); });
    };
    GridWalk.toEdge = function (model, fromRef, vector) {
        var dir = Point_1.Point.create(vector).round();
        var cell = model.findCell(fromRef);
        if (!cell) {
            throw "Invalid walk starting from: " + fromRef;
        }
        var col = cell.colRef;
        var row = cell.rowRef;
        while (col >= 0 && col < model.width && row >= 0 && row < model.height) {
            var c = model.locateCell(col, row);
            if (c) {
                cell = c;
            }
            col += dir.x;
            row += dir.y;
        }
        return cell;
    };
    GridWalk.toNext = function (model, fromRef, vector) {
        return this.until(model, fromRef, vector, function (c, v, m) { return c.ref != fromRef; });
    };
    GridWalk.until = function (model, fromRef, vector, callback) {
        var dir = Point_1.Point.create(vector).round();
        var cell = model.findCell(fromRef);
        if (!cell) {
            throw "Invalid walk starting from: " + fromRef;
        }
        var col = cell.colRef;
        var row = cell.rowRef;
        while (col >= 0 && col < model.width && row >= 0 && row < model.height) {
            cell = model.locateCell(col, row);
            if (cell && callback(cell, dir, model) === true) {
                return cell;
            }
            col += dir.x;
            row += dir.y;
        }
        return null;
    };
    return GridWalk;
}());
exports.GridWalk = GridWalk;
function defaultDataPointDetectStrategy(cell, vector, model) {
    var empty = function (cell) { return !!(cell.value === '' || cell.value === '0' || cell.value === undefined || cell.value === null); };
    if (!!cell.dataPoint) {
        return true;
    }
    var next = model.locateCell(cell.colRef + vector.x, cell.rowRef + vector.y);
    var prev = model.locateCell(cell.colRef - vector.x, cell.rowRef - vector.y);
    if (!next) {
        return true;
    }
    if (!empty(cell) && (empty(next) || empty(prev))) {
        return true;
    }
    return false;
}
exports.defaultDataPointDetectStrategy = defaultDataPointDetectStrategy;
//# sourceMappingURL=GridWalk.js.map