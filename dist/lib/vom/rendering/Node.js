"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@no-export
var Buffer_1 = require("./Buffer");
var NodeList_1 = require("./NodeList");
var Node = /** @class */ (function () {
    function Node(key, parent) {
        this.children = new NodeList_1.NodeList();
        this.key = key;
        this.buffer = new Buffer_1.Buffer(key.id);
        this.parent = parent;
    }
    Object.defineProperty(Node.prototype, "dirty", {
        get: function () {
            return this.dirtyVal;
        },
        set: function (value) {
            if (!!value && this.parent && !this.parent.dirty) {
                this.parent.dirty = value;
            }
            this.dirtyVal = value;
        },
        enumerable: true,
        configurable: true
    });
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