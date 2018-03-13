"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../../geom/Point");
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var DragHelper = /** @class */ (function (_super) {
    __extends(DragHelper, _super);
    function DragHelper(view, handler) {
        var _this = _super.call(this) || this;
        _this.handler = handler;
        _this.handles = [
            listen(view, 'mousedown', _this.dragStart.bind(_this)),
            listen(window, 'mousemove', _this.drag.bind(_this)),
            listen(window, 'mouseup', _this.dragEnd.bind(_this)),
        ];
        return _this;
    }
    DragHelper.prototype.dragStart = function (me) {
        this.dragging = true;
        this.previous = new Point_1.Point(me.screenX, me.screenY);
    };
    DragHelper.prototype.drag = function (me) {
        if (this.dragging) {
            var screenPt = new Point_1.Point(me.screenX, me.screenY);
            var distance = screenPt.subtract(this.previous);
            this.handler(me, distance);
            this.previous = screenPt;
        }
    };
    DragHelper.prototype.dragEnd = function (me) {
        this.dragging = false;
        this.previous = null;
    };
    return DragHelper;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.DragHelper = DragHelper;
function listen(target, name, callback) {
    target.addEventListener(name, callback);
    return function () { return target.removeEventListener(name, callback); };
}
//# sourceMappingURL=DragHelper.js.map