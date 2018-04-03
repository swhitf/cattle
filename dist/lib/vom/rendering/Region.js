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
var Rect_1 = require("../../geom/Rect");
var Element_1 = require("./Element");
var Key_1 = require("./Key");
var Node_1 = require("./Node");
var Report_1 = require("./Report");
var Region = /** @class */ (function (_super) {
    __extends(Region, _super);
    function Region() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.type = 'region';
        _this.dirtyAreas = [];
        return _this;
    }
    Region.prototype.getElement = function (id, z) {
        var _this = this;
        return this.getNode(new Key_1.Key(id, z), function (key) { return new Element_1.Element(key, _this); });
    };
    Region.prototype.getRegion = function (id, z) {
        var _this = this;
        return this.getNode(new Key_1.Key(id, z), function (key) { return new Region(key, _this); });
    };
    Region.prototype.endUpdate = function () {
        var _this = this;
        //When an update has finished, we must prune any nodes that were not "accessed" 
        //during the update.
        var nodes = this.children.removeWhere(function (x) { return !x.accessed; });
        //For each pruned node, mark it's area as invalid
        nodes.forEach(function (x) { return _this.invalidate(x.area); });
        this.children.forEach(function (x) { return x.endUpdate(); });
    };
    Region.prototype.invalidate = function (area) {
        if (area.equals(this.dirtyAreas[this.dirtyAreas.length - 1]))
            return;
        this.dirtyAreas.push(area);
        this.dirty = true;
        if (this.parent) {
            this.parent.invalidate(this.area);
        }
    };
    Region.prototype.render = function (gfx) {
        var _this = this;
        var _a = this, area = _a.area, buffer = _a.buffer;
        //Here we need to figure out if the buffer we have is reusable and if it is
        //we should just render the buffer to the gfx using the region info to set
        //the transform.  If we are "dirty" then we need to update our buffer with
        //all required changes.
        if (this.dirty) {
            this.updateBuffer();
        }
        //Apply transform so we draw in the right spot on parent
        gfx.setTransform(1, 0, 0, 1, area.left, area.top);
        //Draw...
        Report_1.Report.time('Region.Draw', function () { return _this.buffer.drawTo(gfx); });
        this.dirty = false;
    };
    Region.prototype.getNode = function (key, factory) {
        var node = this.children.get(key);
        if (!node) {
            this.children.add(node = factory(key));
            this.dirty = true;
            node.dirty = true;
        }
        else {
            node.age++;
        }
        node.accessed = true;
        return node;
    };
    Region.prototype.updateBuffer = function () {
        var _a = this, area = _a.area, buffer = _a.buffer, children = _a.children, dirtyAreas = _a.dirtyAreas;
        //Updating the buffer involves drawing child elements to the buffer in the least
        //steps possible.  Sometimes, our buffer may need to be reshaped due to a change
        //in the region bounds.  If this is the case we must "prepare" the buffer which
        //will cause it to be wiped.  In this scenario, we do a full redraw of all children.
        //Normally, the buffer size will match the bounds, in which case we can do a quick
        //draw.  When children are arranged they "invalidate" their parent region with a
        //specified rectangle.  We use this list of "dirtyAreas" to know what we need to
        //redraw first.  Once these are satisified, we draw any dirty children to complete
        //the update.
        //Check to see if we need to do a full draw
        var canQuickDraw = buffer.width == area.width && buffer.height == area.height;
        if (canQuickDraw) {
            //First, consolidate any overlapping dirty areas
            dirtyAreas = consolidate(dirtyAreas);
            //Clear the dirty areas of the buffer
            dirtyAreas.forEach(function (x) { return buffer.clear(x); });
            //Render any children that appear in these areas
            children.forEach(function (node) {
                //If child is dirty, we need to render anyway...
                if (node.dirty) {
                    node.render(buffer.context);
                }
                else {
                    for (var _i = 0, dirtyAreas_1 = dirtyAreas; _i < dirtyAreas_1.length; _i++) {
                        var da = dirtyAreas_1[_i];
                        if (da.intersects(node.area)) {
                            node.render(buffer.context, da);
                            break;
                        }
                    }
                }
            });
        }
        else {
            //Prepare (size & clear) our buffer 
            buffer.prepare(area.width, area.height);
            //Render each child, even if not dirty
            children.forEach(function (node) { return node.render(buffer.context); });
        }
        this.dirty = false;
        this.dirtyAreas = [];
    };
    return Region;
}(Node_1.Node));
exports.Region = Region;
function consolidate(rects) {
    if (rects.length < 2) {
        return rects;
    }
    var wasChangeMade = true;
    while (wasChangeMade) {
        wasChangeMade = false;
        for (var a = 0; a < rects.length; a++) {
            if (!rects[a])
                continue;
            for (var b = 0; b < rects.length; b++) {
                if (!rects[b] || a == b)
                    continue;
                if (rects[a].intersects(rects[b])) {
                    rects[a] = Rect_1.Rect.fromMany([rects[a], rects[b]]);
                    rects[b] = null;
                    wasChangeMade = true;
                    break;
                }
            }
            if (wasChangeMade) {
                break;
            }
        }
    }
    return rects.filter(function (x) { return !!x; });
}
//# sourceMappingURL=Region.js.map