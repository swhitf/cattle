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
var __1 = require("../..");
var Visual_1 = require("./Visual");
var BufferMode = 'bufferMode';
var BufferInflation = 'bufferInflation';
var BufferModes;
(function (BufferModes) {
    BufferModes[BufferModes["Buffered"] = 0] = "Buffered";
})(BufferModes = exports.BufferModes || (exports.BufferModes = {}));
var CanvasVisual = (function (_super) {
    __extends(CanvasVisual, _super);
    function CanvasVisual(useAlpha, bounds, children) {
        if (bounds === void 0) { bounds = __1.Rect.empty; }
        if (children === void 0) { children = []; }
        var _this = _super.call(this, bounds, children) || this;
        _this.useAlpha = useAlpha;
        _this.buffer = null;
        _this.bufferInvalid = true;
        _this.bufferInflation = 10;
        _this.on('invalidated', function () { return _this.bufferInvalid = true; });
        return _this;
    }
    CanvasVisual.prototype.draw = function (gfx) {
        // let m = this.transform();
        // gfx.transform(m.a, m.b, m.c, m.d, m.e, m.f);
        var bi = this.bufferInflation;
        if (!this.buffer) {
            this.buffer = document.createElement('canvas');
            this.buffer.width = this.width + (bi * 2);
            this.buffer.height = this.height + (bi * 2);
            this.bufferInvalid = true;
        }
        if (this.bufferInvalid) {
            var bgfx = this.buffer.getContext('2d');
            bgfx.clearRect(0, 0, this.buffer.width, this.buffer.height);
            bgfx.setTransform(1, 0, 0, 1, 0, 0);
            bgfx.translate(bi, bi);
            this.performDraw(bgfx);
            this.bufferInvalid = false;
        }
        gfx.drawImage(this.buffer, -bi, -bi, this.buffer.width, this.buffer.height);
        //gfx.strokeRect(-bi, -bi, this.buffer.width, this.buffer.height);
    };
    CanvasVisual.prototype.isParentBuffered = function () {
        var parent = this.parentVisual;
        if (!!parent && parent instanceof CanvasVisual) {
            return !!parent.buffer || parent.isParentBuffered();
        }
        return false;
    };
    CanvasVisual.prototype.clearBuffer = function () {
        this.buffer = null;
    };
    return CanvasVisual;
}(Visual_1.Visual));
exports.CanvasVisual = CanvasVisual;
//# sourceMappingURL=BufferedVisual.js.map