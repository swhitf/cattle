"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var libstl_1 = require("libstl");
var ResizeObserver = require("resize-observer-polyfill");
var observe = function (entries, observer) {
    var ro = ResizeObserver;
    return new ro(entries, observer);
};
var Surface = (function () {
    function Surface(container, canvas) {
        this.container = container;
        this.canvas = canvas;
        this.sequence = new libstl_1.DoublyLinkedList();
        observe(this.onContainerResize.bind(this));
    }
    Surface.create = function (container) {
        var canvas = container.ownerDocument.createElement('canvas');
        container.appendChild(canvas);
        return new Surface(container, canvas);
    };
    Object.defineProperty(Surface.prototype, "width", {
        get: function () {
            return this.canvas.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Surface.prototype, "height", {
        get: function () {
            return this.canvas.height;
        },
        enumerable: true,
        configurable: true
    });
    Surface.prototype.onContainerResize = function (entries) {
        for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
            var entry = entries_1[_i];
            var _a = entry.contentRect, left = _a.left, top_1 = _a.top, width = _a.width, height = _a.height;
            console.log('Element:', entry.target);
            console.log("Element's size: " + width + "px x " + height + "px");
            console.log("Element's paddings: " + top_1 + "px ; " + left + "px");
        }
    };
    return Surface;
}());
exports.Surface = Surface;
//# sourceMappingURL=Surface.js.map