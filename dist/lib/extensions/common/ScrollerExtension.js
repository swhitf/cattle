"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("../../misc/Util");
var Padding_1 = require("../../geom/Padding");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var ScrollerExtension = (function () {
    function ScrollerExtension(scrollerWidth) {
        this.scrollerWidth = scrollerWidth;
        this.scrollerWidth = Util_1.coalesce(scrollerWidth, detect_native_scroller_width());
    }
    ScrollerExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        //Set padding right and bottom to scroller width to prevent overlap
        grid.padding = new Padding_1.Padding(grid.padding.top, grid.padding.right + this.scrollerWidth, grid.padding.bottom + this.scrollerWidth, grid.padding.left);
        grid.on('invalidate', function () { return _this.alignElements(); });
        grid.on('scroll', function () { return _this.alignElements(); });
    };
    ScrollerExtension.prototype.createElements = function (target) {
        //ScrollerExtension is a special case, we need to modify the grid container element in order
        //to reliability enable all scroll interaction without logs of emulation and buggy crap.  We
        //inject a wedge element that simulates the overflow for the container scroll bars and then
        //hold the grid in place while mirroring the scroll property against the container scorll 
        //position. Vuala!
        var container = this.grid.container;
        container.addEventListener('scroll', this.onContainerScroll.bind(this));
        Dom.css(container, {
            overflow: 'auto',
        });
        var wedge = this.wedge = document.createElement('div');
        Dom.css(wedge, { pointerEvents: 'none', });
        container.appendChild(wedge);
        this.alignElements();
    };
    ScrollerExtension.prototype.alignElements = function () {
        var grid = this.grid;
        var conatiner = grid.container;
        Dom.css(grid.root, {
            position: 'absolute',
            left: (grid.scrollLeft) + 'px',
            top: (grid.scrollTop) + 'px',
        });
        Dom.css(this.wedge, {
            width: grid.virtualWidth - this.scrollerWidth + "px",
            height: grid.virtualHeight - this.scrollerWidth + "px",
        });
        if (conatiner.scrollLeft != grid.scrollLeft) {
            conatiner.scrollLeft = grid.scrollLeft;
        }
        if (conatiner.scrollTop != grid.scrollTop) {
            conatiner.scrollTop = grid.scrollTop;
        }
    };
    ScrollerExtension.prototype.onContainerScroll = function () {
        var grid = this.grid;
        var maxScroll = new Point_1.Point(grid.virtualWidth - grid.width, grid.virtualHeight - grid.height);
        grid.scroll = new Point_1.Point(grid.container.scrollLeft, grid.container.scrollTop)
            .clamp(Point_1.Point.empty, maxScroll);
    };
    return ScrollerExtension;
}());
exports.ScrollerExtension = ScrollerExtension;
function detect_native_scroller_width() {
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
//# sourceMappingURL=ScrollerExtension.js.map