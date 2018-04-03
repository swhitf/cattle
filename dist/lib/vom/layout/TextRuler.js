"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../../geom/Point");
var TextRuler = /** @class */ (function () {
    function TextRuler() {
    }
    TextRuler.measure = function (font, text) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.canvas.height = 1;
        }
        var gfx = this.canvas.getContext('2d');
        gfx.font = font.toString();
        var tm = gfx.measureText(text);
        return new Point_1.Point(tm.width, font.size);
    };
    return TextRuler;
}());
exports.TextRuler = TextRuler;
//# sourceMappingURL=TextRuler.js.map