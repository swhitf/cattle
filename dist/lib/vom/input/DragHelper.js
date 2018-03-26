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
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var Point_1 = require("../../geom/Point");
var dom = require("../../misc/Dom");
var DragHelper = /** @class */ (function (_super) {
    __extends(DragHelper, _super);
    function DragHelper(view, handler) {
        var _this = _super.call(this) || this;
        _this.handler = handler;
        _this.handles = [
            dom.on(view, 'mousedown', _this.dragStart.bind(_this)),
            dom.on(window, 'mousemove', _this.drag.bind(_this)),
            dom.on(window, 'mouseup', _this.dragEnd.bind(_this)),
        ];
        return _this;
    }
    DragHelper.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.handles.forEach(function (x) { return x(); });
        this.handles = null;
    };
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
//# sourceMappingURL=DragHelper.js.map