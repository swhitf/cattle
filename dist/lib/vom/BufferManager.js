"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BufferManager = /** @class */ (function () {
    function BufferManager() {
        this.configs = {};
        this.backMap = {};
        this.frontMap = {};
    }
    BufferManager.prototype.configure = function (type, config) {
        this.configs[type] = config;
        return this;
    };
    BufferManager.prototype.getFor = function (type, object) {
        var cfg = this.configs[type];
        if (!cfg)
            throw "Unsupported buffer type: " + type;
        var id = type + ":" + cfg.identify(object);
        var buffer = this.resolve(id);
        var size = cfg.measure(object);
        if (buffer.width != size.x)
            buffer.width = size.x;
        if (buffer.height != size.y)
            buffer.height = size.y;
        return buffer;
    };
    BufferManager.prototype.retainFor = function (type, object) {
        var cfg = this.configs[type];
        if (!cfg)
            throw "Unsupported buffer type: " + type;
        var id = type + ":" + cfg.identify(object);
        if (this.backMap[id]) {
            this.frontMap[id] = this.backMap[id];
        }
    };
    BufferManager.prototype.beginRender = function () {
        for (var key in this.backMap) {
            var buffer = this.backMap[key];
            var gfx = buffer.getContext('2d');
            gfx.setTransform(1, 0, 0, 1, 0, 0);
            gfx.clearRect(0, 0, buffer.width, buffer.height);
        }
    };
    BufferManager.prototype.endRender = function () {
        this.backMap = this.frontMap;
        this.frontMap = {};
    };
    BufferManager.prototype.resolve = function (id) {
        if (this.frontMap[id]) {
            return this.frontMap[id];
        }
        if (this.backMap[id]) {
            return (this.frontMap[id] = this.backMap[id]);
        }
        return (this.frontMap[id] = document.createElement('canvas'));
    };
    return BufferManager;
}());
exports.BufferManager = BufferManager;
//# sourceMappingURL=BufferManager.js.map