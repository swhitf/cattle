"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Padding_1 = require("../../geom/Padding");
var Point_1 = require("../../geom/Point");
var dom = require("../../misc/Dom");
var Util_1 = require("../../misc/Util");
var ScrollerExtension = /** @class */ (function () {
    function ScrollerExtension(scrollerWidth) {
        this.scrollerWidth = scrollerWidth;
        this.scrollerWidth = Util_1.coalesce(scrollerWidth, detectNativeScrollerWidth());
    }
    ScrollerExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements();
        //Set padding right and bottom to scroller width to prevent overlap
        grid.padding = new Padding_1.Padding(grid.padding.top, grid.padding.right + this.scrollerWidth, grid.padding.bottom + this.scrollerWidth, grid.padding.left);
        grid.on('change', function () { return _this.alignElements(); });
        grid.on('scroll', function () { return _this.alignElements(); });
    };
    ScrollerExtension.prototype.createElements = function () {
        //ScrollerExtension is a special case, we need to modify the grid container element in order
        //to reliability enable all scroll interaction without lots of emulation and buggy crap.  We
        //inject a wedge element that simulates the overflow for the container scroll bars and then
        //hold the grid in place while mirroring the scroll property against the container scorll 
        //position. Vuala!
        var container = this.grid.container;
        dom.on(container, 'scroll', this.onContainerScroll.bind(this));
        dom.css(container, { overflow: 'auto' });
        var wedge = this.wedge = dom.create('div', { pointerEvents: 'none', });
        container.appendChild(wedge);
        this.alignElements();
    };
    ScrollerExtension.prototype.alignElements = function () {
        var grid = this.grid;
        var container = grid.container;
        dom.css(grid.surface.view, {
            position: 'absolute',
            left: (grid.scroll.left) + 'px',
            top: (grid.scroll.top) + 'px',
        });
        dom.css(this.wedge, {
            width: grid.layout.width - this.scrollerWidth + "px",
            height: grid.layout.height - this.scrollerWidth + "px",
        });
        if (container.scrollLeft != grid.scroll.left) {
            container.scrollLeft = grid.scroll.left;
        }
        if (container.scrollTop != grid.scroll.top) {
            container.scrollTop = grid.scroll.top;
        }
    };
    ScrollerExtension.prototype.onContainerScroll = function () {
        console.log('scroll');
        var grid = this.grid;
        var maxScroll = new Point_1.Point(Math.max(0, grid.layout.width - grid.surface.width), Math.max(0, grid.layout.height - grid.surface.height));
        grid.scroll = new Point_1.Point(grid.container.scrollLeft, grid.container.scrollTop)
            .clamp(Point_1.Point.empty, maxScroll);
    };
    return ScrollerExtension;
}());
exports.ScrollerExtension = ScrollerExtension;
function detectNativeScrollerWidth() {
    var outer = document.createElement("div");
    outer.style.visibility = "hidden";
    outer.style.width = "100px";
    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps
    document.body.appendChild(outer);
    var widthNoScroll = outer.offsetWidth;
    // force scrollbars
    outer.style.overflow = "scroll";
    // add innerdiv
    var inner = document.createElement("div");
    inner.style.width = "100%";
    outer.appendChild(inner);
    var widthWithScroll = inner.offsetWidth;
    // remove divs
    outer.parentNode.removeChild(outer);
    return widthNoScroll - widthWithScroll;
}
//# sourceMappingURL=ScrollingExtension.js.map