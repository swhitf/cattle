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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Border_1 = require("../../vom/styling/Border");
var Color_1 = require("../../vom/styling/Color");
var Styleable_1 = require("../../vom/styling/Styleable");
var Visual_1 = require("../../vom/Visual");
var NetVisual = /** @class */ (function (_super) {
    __extends(NetVisual, _super);
    function NetVisual() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.canHost = false;
        _this.type = 'net';
        return _this;
    }
    NetVisual.prototype.render = function (gfx) {
        var border = this.border;
        var offset = (border.width % 2) / 2;
        var deflate = Math.floor(border.width / 2);
        gfx.lineWidth = border.width;
        gfx.strokeStyle = border.color;
        if (border.dash.length >= 2) {
            gfx.setLineDash(border.dash.slice(0, 2));
        }
        if (border.dash.length >= 3) {
            gfx.lineDashOffset = border.dash[2];
        }
        if (this.background) {
            gfx.fillStyle = this.background;
        }
        else {
            var bc = Color_1.Color.parse(this.border.color);
            var fc = Color_1.Color.rgba(bc.r, bc.g, bc.b, 0.1);
            gfx.fillStyle = fc.toString();
        }
        gfx.beginPath();
        if (deflate)
            gfx.rect(offset + deflate, offset + deflate, this.width - (deflate * 2) + 1, this.height - (deflate * 2) + 1);
        else
            gfx.rect(offset + deflate, offset + deflate, this.width, this.height);
        gfx.fill();
        gfx.stroke();
    };
    __decorate([
        Styleable_1.Styleable('transparent'),
        __metadata("design:type", String)
    ], NetVisual.prototype, "background", void 0);
    __decorate([
        Styleable_1.Styleable(new Border_1.Border(1, '#4285f4')),
        __metadata("design:type", Border_1.Border)
    ], NetVisual.prototype, "border", void 0);
    return NetVisual;
}(Visual_1.Visual));
exports.NetVisual = NetVisual;
//# sourceMappingURL=NetVisual.js.map