"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parse = require("parse-color");
var Color = /** @class */ (function () {
    function Color(data) {
        this.data = data;
    }
    Color.rgba = function (r, g, b, a) {
        if (a === void 0) { a = 1; }
        return Color.parse("rgba(" + r + "," + g + "," + b + "," + a + ")");
    };
    Color.parse = function (cs) {
        return new Color(parse(cs));
    };
    Object.defineProperty(Color.prototype, "name", {
        get: function () { return this.data.keyword || null; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "r", {
        get: function () { return this.data.rgba[0]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "g", {
        get: function () { return this.data.rgba[1]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "b", {
        get: function () { return this.data.rgba[2]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "a", {
        get: function () { return this.data.rgba[3]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "h", {
        get: function () { return this.data.hsl[0]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "s", {
        get: function () { return this.data.hsl[1]; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Color.prototype, "l", {
        get: function () { return this.data.hsl[2]; },
        enumerable: true,
        configurable: true
    });
    Color.prototype.toString = function () {
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    };
    return Color;
}());
exports.Color = Color;
//# sourceMappingURL=Color.js.map