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
var Observable_1 = require("../../base/Observable");
var Padding_1 = require("../../geom/Padding");
var Styleable_1 = require("../../vom/styling/Styleable");
var Visual_1 = require("../../vom/Visual");
var TextRuler_1 = require("../layout/TextRuler");
var Font_1 = require("../styling/Font");
var LabelVisual = /** @class */ (function (_super) {
    __extends(LabelVisual, _super);
    function LabelVisual() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.canHost = false;
        _this.type = 'label';
        return _this;
    }
    LabelVisual.prototype.autoSize = function () {
        this.size = TextRuler_1.TextRuler
            .measure(this.font, this.text)
            .add([this.padding.horizontal, this.padding.vertical]);
    };
    LabelVisual.prototype.render = function (gfx) {
        //Background
        gfx.fillStyle = this.background;
        gfx.fillRect(0, 0, this.width, this.height);
        //Paint text
        gfx.strokeStyle = null;
        gfx.fillStyle = this.foreground;
        gfx.font = this.font.toString();
        gfx.textBaseline = 'middle';
        gfx.fillText(this.text, this.padding.left, ((this.height - this.padding.vertical) / 2) + this.padding.top, undefined);
    };
    __decorate([
        Styleable_1.Styleable('transparent'),
        __metadata("design:type", String)
    ], LabelVisual.prototype, "background", void 0);
    __decorate([
        Styleable_1.Styleable('black'),
        __metadata("design:type", String)
    ], LabelVisual.prototype, "foreground", void 0);
    __decorate([
        Styleable_1.Styleable(Font_1.Font.default),
        __metadata("design:type", Font_1.Font)
    ], LabelVisual.prototype, "font", void 0);
    __decorate([
        Styleable_1.Styleable(new Padding_1.Padding(3, 3, 3, 3)),
        __metadata("design:type", Padding_1.Padding)
    ], LabelVisual.prototype, "padding", void 0);
    __decorate([
        Observable_1.Observable(''),
        __metadata("design:type", String)
    ], LabelVisual.prototype, "text", void 0);
    return LabelVisual;
}(Visual_1.Visual));
exports.LabelVisual = LabelVisual;
//# sourceMappingURL=LabelVisual.js.map