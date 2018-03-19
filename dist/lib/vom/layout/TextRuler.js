"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../../geom/Point");
var canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;
var TextRuler = /** @class */ (function () {
    function TextRuler() {
    }
    TextRuler.measure = function (font, text) {
        var gfx = canvas.getContext('2d');
        var tm = gfx.measureText(text);
        return new Point_1.Point(tm.width, font.size);
    };
    return TextRuler;
}());
exports.TextRuler = TextRuler;
//# sourceMappingURL=TextRuler.js.map