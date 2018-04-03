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
var Node_1 = require("./Node");
var Element = /** @class */ (function (_super) {
    __extends(Element, _super);
    function Element() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'element';
        return _this;
    }
    Element.prototype.draw = function (callback) {
        var _a = this, area = _a.area, buffer = _a.buffer, parent = _a.parent;
        buffer.prepare(area.width, area.height);
        buffer.update(callback);
        this.dirty = true;
        this.parent.invalidate(area);
        return this;
    };
    Element.prototype.render = function (gfx) {
        var _a = this, area = _a.area, buffer = _a.buffer;
        //Elements should always have an up-to-date buffer by the time render is called
        //from consumers calling the draw method.  We just need to paint the buffer
        //to the gfx with the transform provided.
        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(1, 0, 0, 1, area.left, area.top);
        //Draw...
        this.buffer.drawTo(gfx);
        this.dirty = false;
    };
    return Element;
}(Node_1.Node));
exports.Element = Element;
//# sourceMappingURL=Element.js.map