"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var NodeList = /** @class */ (function () {
    function NodeList() {
        this.array = [];
        this.index = {};
    }
    NodeList.prototype.add = function (node) {
        var _a = this, array = _a.array, index = _a.index;
        if (index[node.key.id]) {
            throw new Error("Node " + node.key.id + " already added to list.");
        }
        index[node.key.id] = node;
        for (var i = 0; i < array.length; i++) {
            if (array[i].key.sort <= node.key.sort) {
                continue;
            }
            else {
                array.splice(i, 0, node);
                return;
            }
        }
        array.push(node);
    };
    NodeList.prototype.remove = function (node) {
        this.delete(node.key);
    };
    NodeList.prototype.removeWhere = function (predicate) {
        var _this = this;
        var output = [];
        this.array = this.array.filter(function (node, i) {
            if (predicate(node, i)) {
                output.push(node);
                delete _this.index[node.key.id];
                return false;
            }
            return true;
        });
        return output;
    };
    NodeList.prototype.get = function (key) {
        return this.index[key.id] || null;
    };
    NodeList.prototype.delete = function (key) {
        var _a = this, array = _a.array, index = _a.index;
        var node = index[key.id];
        if (node) {
            array.splice(array.indexOf(node), 1);
            delete index[key.id];
        }
        return node;
    };
    NodeList.prototype.forEach = function (callback) {
        this.array.forEach(callback);
    };
    return NodeList;
}());
exports.NodeList = NodeList;
//# sourceMappingURL=NodeList.js.map