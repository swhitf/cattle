"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Buffer_1 = require("./Buffer");
var NodeList_1 = require("./NodeList");
var Node = /** @class */ (function () {
    function Node(key, parent) {
        this.children = new NodeList_1.NodeList();
        this.age = 0;
        this.key = key;
        this.buffer = new Buffer_1.Buffer(key.id);
        this.parent = parent;
    }
    Object.defineProperty(Node.prototype, "id", {
        get: function () {
            return this.key.id;
        },
        enumerable: true,
        configurable: true
    });
    Node.prototype.arrange = function (rect) {
        if (!!this.area && this.area.equals(rect))
            return;
        if (this.parent && this.area) {
            this.parent.invalidate(this.area);
        }
        this.area = rect;
        this.dirty = true;
    };
    Node.prototype.beginUpdate = function () {
        this.accessed = false;
        this.dirty = false;
        this.children.forEach(function (x) { return x.beginUpdate(); });
    };
    Node.prototype.endUpdate = function () {
        this.children.forEach(function (x) { return x.beginUpdate(); });
    };
    return Node;
}());
exports.Node = Node;
//# sourceMappingURL=Node.js.map