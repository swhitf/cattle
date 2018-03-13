"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rect_1 = require("../geom/Rect");
var GridView = /** @class */ (function () {
    function GridView(layout, surface) {
        this.layout = layout;
        this.surface = surface;
    }
    GridView.prototype.captureColumns = function (region) {
        throw 'Not implemented';
    };
    GridView.prototype.captureRows = function (region) {
        throw 'Not implemented';
    };
    GridView.prototype.captureCells = function (region) {
        throw 'Not implemented';
    };
    GridView.prototype.measureColumn = function (ref) {
        throw 'Not implemented';
    };
    GridView.prototype.measureColumnRange = function (fromRef, toRefEx) {
        throw 'Not implemented';
    };
    GridView.prototype.measureRow = function (ref) {
        throw 'Not implemented';
    };
    GridView.prototype.measureRowRange = function (fromRef, toRefEx) {
        throw 'Not implemented';
    };
    GridView.prototype.measureCell = function (ref) {
        var _a = this, layout = _a.layout, surface = _a.surface;
        var rect = Rect_1.Rect.fromLike(layout.measureCell(ref));
        for (var i = 0; i < surface.cameras.count; i++) {
            var cam = surface.cameras.item(i);
            if (rect.intersects(cam.area)) {
                var viewPt = cam.toViewPoint('surface', rect.topLeft());
                return new Rect_1.Rect(viewPt.x, viewPt.y, rect.width, rect.height);
            }
        }
        return null;
    };
    GridView.prototype.pickColumn = function (at) {
        throw 'Not implemented';
    };
    GridView.prototype.pickRow = function (at) {
        throw 'Not implemented';
    };
    GridView.prototype.pickCell = function (at) {
        throw 'Not implemented';
    };
    return GridView;
}());
exports.GridView = GridView;
var GridViewletImpl = /** @class */ (function () {
    function GridViewletImpl(key, rect, offset) {
        this.key = key;
        this.left = rect.left;
        this.top = rect.top;
        this.width = rect.width;
        this.height = rect.height;
        this.offsetLeft = offset.y;
        this.offsetTop = offset.y;
    }
    return GridViewletImpl;
}());
//# sourceMappingURL=GridView.js.map