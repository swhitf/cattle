"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Key_1 = require("./Key");
var Region_1 = require("./Region");
var Composition = /** @class */ (function () {
    function Composition() {
        this.rootRegion = new Region_1.Region(new Key_1.Key('root'));
    }
    Object.defineProperty(Composition.prototype, "root", {
        get: function () {
            return this.rootRegion;
        },
        enumerable: true,
        configurable: true
    });
    Composition.prototype.beginUpdate = function () {
        this.rootRegion.beginUpdate();
    };
    Composition.prototype.endUpdate = function () {
        this.rootRegion.endUpdate();
    };
    Composition.prototype.reset = function () {
        this.rootRegion = new Region_1.Region(new Key_1.Key('root'));
    };
    Composition.prototype.render = function (to) {
        var gfx = to.getContext('2d');
        gfx.clearRect(0, 0, to.width, to.height);
        this.rootRegion.render(gfx);
    };
    return Composition;
}());
exports.Composition = Composition;
//# sourceMappingURL=Composition.js.map