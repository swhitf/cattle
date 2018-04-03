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
var Observable_1 = require("../base/Observable");
var Padding_1 = require("../geom/Padding");
var Border_1 = require("../vom/styling/Border");
var Font_1 = require("../vom/styling/Font");
var Styleable_1 = require("../vom/styling/Styleable");
var Visual_1 = require("../vom/Visual");
var CellVisual = /** @class */ (function (_super) {
    __extends(CellVisual, _super);
    function CellVisual() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.cellStyles = [];
        _this.canHost = true;
        _this.type = 'cell';
        return _this;
    }
    CellVisual.prototype.update = function (cell) {
        this.ref = cell.ref;
        this.text = cell.formattedValue();
        for (var _i = 0, _a = this.cellStyles; _i < _a.length; _i++) {
            var cs = _a[_i];
            this.classes.remove(cs);
        }
        this.cellStyles = [cell.type].concat(cell.style.toArray());
        for (var _b = 0, _c = this.cellStyles; _b < _c.length; _b++) {
            var cs = _c[_b];
            this.classes.add(cs);
        }
    };
    CellVisual.prototype.render = function (gfx) {
        //Paint background
        gfx.fillStyle = this.background;
        gfx.fillRect(0, 0, this.width, this.height);
        //Paint border
        gfx.lineWidth = this.border.width;
        gfx.strokeStyle = this.border.color;
        gfx.setLineDash(this.border.dash);
        gfx.lineDashOffset = this.border.offset;
        gfx.strokeRect((gfx.lineWidth % 2) / 2, (gfx.lineWidth % 2) / 2, this.width, this.height);
        //Paint text
        gfx.strokeStyle = null;
        gfx.fillStyle = this.color;
        gfx.font = this.font.toString();
        gfx.textBaseline = 'middle';
        gfx.fillText(this.text, this.padding.left, ((this.height - this.padding.vertical) / 2) + this.padding.top, this.textMode == 'fit' ? this.width - this.padding.horizontal : undefined);
    };
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", String)
    ], CellVisual.prototype, "ref", void 0);
    __decorate([
        Styleable_1.Styleable('#fff'),
        __metadata("design:type", String)
    ], CellVisual.prototype, "background", void 0);
    __decorate([
        Styleable_1.Styleable(Border_1.Border.default),
        __metadata("design:type", Border_1.Border)
    ], CellVisual.prototype, "border", void 0);
    __decorate([
        Styleable_1.Styleable('#111'),
        __metadata("design:type", String)
    ], CellVisual.prototype, "color", void 0);
    __decorate([
        Styleable_1.Styleable(Font_1.Font.default),
        __metadata("design:type", Font_1.Font)
    ], CellVisual.prototype, "font", void 0);
    __decorate([
        Styleable_1.Styleable(Padding_1.Padding.hv(5, 0)),
        __metadata("design:type", Padding_1.Padding)
    ], CellVisual.prototype, "padding", void 0);
    __decorate([
        Styleable_1.Styleable('crop'),
        __metadata("design:type", String)
    ], CellVisual.prototype, "textMode", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", String)
    ], CellVisual.prototype, "text", void 0);
    return CellVisual;
}(Visual_1.Visual));
exports.CellVisual = CellVisual;
//# sourceMappingURL=CellVisual.js.map