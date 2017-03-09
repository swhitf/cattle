"use strict";
var MouseInput_1 = require("../../input/MouseInput");
var Point_1 = require("../../geom/Point");
var Keys_1 = require("../../input/Keys");
var PanExtension = (function () {
    function PanExtension() {
    }
    PanExtension.prototype.init = function (grid, kernel) {
        var panning = false;
        var last = null;
        grid.on('keydown', function (e) {
            if (e.keyCode === Keys_1.Keys.SPACE) {
                panning = true;
                last = null;
            }
        });
        grid.on('keyup', function (e) {
            if (e.keyCode === Keys_1.Keys.SPACE) {
                panning = false;
                last = null;
            }
        });
        MouseInput_1.MouseInput.for(grid.root)
            .on('DRAG:PRIMARY', function (e) {
            if (!panning)
                return;
            if (last) {
                var next = new Point_1.Point(e.gridX, e.gridY);
                var delta = next.subtract(last);
                grid.scrollLeft -= delta.x;
                grid.scrollTop -= delta.y;
            }
            last = new Point_1.Point(e.gridX, e.gridY);
        });
        //grid.kernel.routines.override('beginEdit', (override:string, impl:any) =>
        //{
        //    if (panning)
        //        return false;
        //
        //    return impl(override);
        //});
        //grid.kernel.routines.override('doSelect', (cells:string[] = [], autoScroll:boolean, impl:any) =>
        //{
        //    if (panning)
        //        return false;
        //
        //    return impl(cells, autoScroll);
        //});
    };
    return PanExtension;
}());
exports.PanExtension = PanExtension;
//# sourceMappingURL=PanExtension.js.map