"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer = /** @class */ (function () {
    function Buffer(id) {
        this.id = id;
        this.canvas = document.createElement('canvas');
    }
    Object.defineProperty(Buffer.prototype, "valid", {
        get: function () {
            return !!this.canvas;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "context", {
        get: function () {
            return this.canvas.getContext('2d');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        set: function (val) {
            this.canvas.width = val;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Buffer.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        set: function (val) {
            this.canvas.height = val;
        },
        enumerable: true,
        configurable: true
    });
    Buffer.prototype.drawTo = function (gfx) {
        gfx.drawImage(this.canvas, 0, 0);
    };
    Buffer.prototype.invalidate = function (width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        var gfx = this.canvas.getContext('2d');
        gfx.setTransform(1, 0, 0, 1, 0, 0);
        gfx.clearRect(0, 0, width, height);
    };
    Buffer.prototype.update = function (callback) {
        callback(this.canvas.getContext('2d'));
    };
    return Buffer;
}());
exports.Buffer = Buffer;
//# sourceMappingURL=Buffer.js.map