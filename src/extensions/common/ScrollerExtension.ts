import { coalesce } from '../../misc/Util';
import { Padding } from '../../geom/Padding';
import { Point } from '../../geom/Point';
import { GridElement, GridMouseEvent } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import * as Tether from 'tether';
import * as Dom from '../../misc/Dom';


export class ScrollerExtension
{
    private grid:GridElement;
    private wedge:HTMLDivElement;

    constructor(private scrollerWidth?:number) 
    {
        this.scrollerWidth = coalesce(scrollerWidth, detect_native_scroller_width());
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements(grid.root);

        //Set padding right and bottom to scroller width to prevent overlap
        grid.padding = new Padding(
            grid.padding.top,
            grid.padding.right + this.scrollerWidth,
            grid.padding.bottom + this.scrollerWidth,
            grid.padding.left);

        grid.on('invalidate', () => this.alignElements());
        grid.on('scroll', () => this.alignElements());
    }

    private createElements(target:HTMLElement):void
    {
        //ScrollerExtension is a special case, we need to modify the grid container element in order
        //to reliability enable all scroll interaction without logs of emulation and buggy crap.  We
        //inject a wedge element that simulates the overflow for the container scroll bars and then
        //hold the grid in place while mirroring the scroll property against the container scorll 
        //position. Vuala!

        let container = this.grid.container;
        container.addEventListener('scroll', this.onContainerScroll.bind(this));
        Dom.css(container, {
            overflow: 'auto',
        });

        let wedge = this.wedge = document.createElement('div');
        Dom.css(wedge, { pointerEvents: 'none', });
        container.appendChild(wedge);

        this.alignElements();
    }

    private alignElements():void
    {
        let grid = this.grid;
        let conatiner = grid.container;

        Dom.css(grid.root, {
            position: 'absolute',
            left: (grid.scrollLeft) + 'px',
            top: (grid.scrollTop) + 'px',
        });

        Dom.css(this.wedge, {
            width: `${grid.virtualWidth - this.scrollerWidth}px`,
            height: `${grid.virtualHeight - this.scrollerWidth}px`,
        });

        if (conatiner.scrollLeft != grid.scrollLeft)
        {
            conatiner.scrollLeft = grid.scrollLeft;
        }

        if (conatiner.scrollTop != grid.scrollTop)
        {
            conatiner.scrollTop = grid.scrollTop;
        }
    }

    private onContainerScroll():void
    {
        let grid = this.grid;
        let maxScroll = new Point(
            grid.virtualWidth - grid.width,
            grid.virtualHeight - grid.height,
        );

        grid.scroll = new Point(grid.container.scrollLeft, grid.container.scrollTop)
            .clamp(Point.empty, maxScroll);
    }
}

function detect_native_scroller_width() 
{
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