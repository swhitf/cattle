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
    Element.prototype.dim = function (width, height) {
        if (this.width != width) {
            this.width = width;
            this.dirty = true;
        }
        if (this.height != height) {
            this.height = height;
            this.dirty = true;
        }
        return this;
    };
    Element.prototype.draw = function (callback) {
        var buffer = this.buffer;
        buffer.invalidate(this.width, this.height);
        buffer.update(callback);
        this.dirty = true;
        return this;
    };
    Element.prototype.transform = function (mt) {
        if (!this.mt || !this.mt.equals(mt)) {
            this.mt = mt;
            this.parent.dirty = true;
        }
        return this;
    };
    Element.prototype.render = function (gfx) {
        var _a = this, buffer = _a.buffer, mt = _a.mt;
        //Elements should always have an up-to-date buffer by the time render is called
        //from consumers calling the draw method.  We just need to paint the buffer
        //to the gfx with the transform provided.
        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
        //Draw...
        this.buffer.drawTo(gfx);
        this.dirty = false;
    };
    return Element;
}(Node_1.Node));
exports.Element = Element;
//# sourceMappingURL=Element.js.map