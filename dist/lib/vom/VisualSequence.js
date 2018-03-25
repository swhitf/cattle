"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VisualSequence = /** @class */ (function () {
    function VisualSequence(root) {
        this.root = root;
        this.lookup = {};
        this.head = this.create(root, 0);
        this.update();
    }
    Object.defineProperty(VisualSequence.prototype, "all", {
        get: function () {
            return this.list || (this.list = this.head.visual.toArray(true));
        },
        enumerable: true,
        configurable: true
    });
    VisualSequence.prototype.dive = function (callback) {
        var node = this.tail;
        while (node && callback(node.visual)) {
            node = node.prev;
        }
    };
    VisualSequence.prototype.climb = function (callback) {
        var node = this.head;
        while (node && callback(node.visual)) {
            node = node.next;
        }
    };
    VisualSequence.prototype.invalidate = function (visual) {
        delete this.list;
        var node = this.lookup[visual.id];
        if (node) {
            this.truncate(node);
        }
    };
    VisualSequence.prototype.update = function () {
        var node = this.head;
        while (true) {
            //If the node is dirty, it represents a visual who's composition has changed, so we to (re)expand the
            //node.  This will almost always alter the `next` property of the node.
            if (node.dirty) {
                node = this.expand(node);
            }
            if (node.next) {
                node = node.next;
            }
            else {
                this.tail = node;
                break;
            }
        }
    };
    VisualSequence.prototype.create = function (visual, depth) {
        var node = new Node(visual, depth);
        this.lookup[visual.id] = node;
        return node;
    };
    VisualSequence.prototype.expand = function (node) {
        var _this = this;
        node.dirty = false;
        var visuals = node.visual.toArray();
        var subSeq = visuals
            .sort(create_z_sorter(visuals))
            .map(function (x) { return _this.create(x, node.depth + 1); });
        var p = node;
        var pn = p.next;
        for (var _i = 0, subSeq_1 = subSeq; _i < subSeq_1.length; _i++) {
            var n = subSeq_1[_i];
            p.next = n;
            n.prev = p;
            p = this.expand(n);
        }
        p.next = pn;
        if (pn) {
            pn.prev = p;
        }
        return p;
    };
    VisualSequence.prototype.truncate = function (node) {
        node.dirty = true;
        var n = node.next;
        while (!!n && n.depth > node.depth) {
            delete this.lookup[n.visual.id];
            n = n.next;
        }
        if (n) {
            node.next = n;
            n.prev = node;
        }
        else {
            node.next = null;
            this.tail = node;
        }
    };
    return VisualSequence;
}());
exports.VisualSequence = VisualSequence;
var Node = /** @class */ (function () {
    function Node(visual, depth, next, prev, dirty) {
        if (next === void 0) { next = null; }
        if (prev === void 0) { prev = null; }
        if (dirty === void 0) { dirty = true; }
        this.visual = visual;
        this.depth = depth;
        this.next = next;
        this.prev = prev;
        this.dirty = dirty;
    }
    return Node;
}());
function create_z_sorter(array) {
    //Create an index of the implicit orders
    var ii = {};
    array.forEach(function (v, i) { return ii[v.id] = i; });
    return function (a, b) {
        var r = a.zIndex - b.zIndex;
        if (r === 0) {
            r = ii[a.id] - ii[b.id];
        }
        return r;
    };
}
//# sourceMappingURL=VisualSequence.js.map