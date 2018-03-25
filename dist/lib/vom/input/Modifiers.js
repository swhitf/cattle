"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Keys_1 = require("./Keys");
var Modifiers = /** @class */ (function () {
    function Modifiers(alt, ctrl, shift) {
        this.alt = alt;
        this.ctrl = ctrl;
        this.shift = shift;
    }
    Modifiers.create = function (e) {
        return new Modifiers(e.altKey, e.ctrlKey, e.shiftKey);
    };
    Modifiers.parse = function (input) {
        var keys = (input || '')
            .split(/[\s\-\+]+/)
            .filter(function (x) { return !!x; })
            .map(function (x) { return Keys_1.Keys.parse(x); });
        return new Modifiers(keys.some(function (x) { return x === Keys_1.Keys.ALT; }), keys.some(function (x) { return x === Keys_1.Keys.CTRL; }), keys.some(function (x) { return x === Keys_1.Keys.SHIFT; }));
    };
    Object.defineProperty(Modifiers.prototype, "any", {
        get: function () {
            return this.alt || this.ctrl || this.shift;
        },
        enumerable: true,
        configurable: true
    });
    Modifiers.prototype.matches = function (other) {
        if (!!this.ctrl && !other.ctrl)
            return false;
        if (!!this.alt && !other.alt)
            return false;
        if (!!this.shift && !other.shift)
            return false;
        return true;
    };
    Modifiers.prototype.matchesExact = function (other) {
        if (this.ctrl != other.ctrl)
            return false;
        if (this.alt != other.alt)
            return false;
        if (this.shift != other.shift)
            return false;
        return true;
    };
    return Modifiers;
}());
exports.Modifiers = Modifiers;
//# sourceMappingURL=Modifiers.js.map