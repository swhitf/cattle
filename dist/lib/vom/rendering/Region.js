"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
//@no-export
var Matrix_1 = require("../../geom/Matrix");
var Element_1 = require("./Element");
var Key_1 = require("./Key");
var Node_1 = require("./Node");
var Region = /** @class */ (function (_super) {
    __extends(Region, _super);
    function Region() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'region';
        return _this;
        // private checkDirty(cycle:number):boolean 
        // {
        //     if (this.changed)
        //         return true;
        //     for (let node of this.children.array) 
        //     {
        //         if (node.changed)
        //             return true;
        //         if (node.cycle != cycle)
        //             return true;
        //     }
        //     return false;
        // }
    }
    Region.prototype.arrange = function (leftOrRect, top, width, height) {
        if ((typeof leftOrRect) === 'object') {
            var r = leftOrRect;
            return this.arrange(r.left, r.top, r.width, r.height);
        }
        if (this.left != leftOrRect) {
            this.left = leftOrRect;
            this.dirty = true;
        }
        if (this.top != top) {
            this.top = top;
            this.dirty = true;
        }
        if (this.width != width) {
            this.width = width;
            this.dirty = true;
        }
        if (this.height != height) {
            this.height = height;
            this.dirty = true;
        }
    };
    Region.prototype.getElement = function (id, z) {
        var _this = this;
        return this.getNode(new Key_1.Key(id, z), function (key) { return new Element_1.Element(key, _this); });
    };
    Region.prototype.getRegion = function (id, z) {
        var _this = this;
        return this.getNode(new Key_1.Key(id, z), function (key) { return new Region(key, _this); });
    };
    Region.prototype.endUpdate = function () {
        //When an update has finished, we must prune any nodes that were not "accessed" 
        //during the update.
        var count = this.children.removeWhere(function (x) { return !x.accessed; });
        if (count > 0) {
            this.dirty = true;
        }
        this.children.forEach(function (x) { return x.endUpdate(); });
    };
    Region.prototype.invalidate = function () {
    };
    Region.prototype.render = function (gfx) {
        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.  If we are "dirty" then we need to regenerate the buffer.  
        var _this = this;
        if (this.dirty) {
            //Clear and resize our buffer
            this.buffer.invalidate(this.width, this.height);
            this.children.forEach(function (node) {
                node.render(_this.buffer.context);
            });
        }
        //Apply transform so we draw in the right spot on parent
        var mt = Matrix_1.Matrix.identity.translate(this.left, this.top);
        gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
        //Draw...
        this.buffer.drawTo(gfx);
        this.dirty = false;
    };
    Region.prototype.getNode = function (key, factory) {
        var node = this.children.get(key);
        if (!node) {
            this.children.add(node = factory(key));
            node.dirty = true;
        }
        node.accessed = true;
        return node;
    };
    return Region;
}(Node_1.Node));
exports.Region = Region;
//# sourceMappingURL=Region.js.map