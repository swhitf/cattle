import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { Padding } from '../../geom/Padding';
import { Point } from '../../geom/Point';
import * as dom from '../../misc/Dom';
import { coalesce } from '../../misc/Util';


export class ScrollerExtension extends AbstractDestroyable
{
    private grid:GridElement;
    private wedge:HTMLElement;

    constructor(private scrollerWidth?:number) 
    {
        super();

        this.scrollerWidth = coalesce(scrollerWidth, detectNativeScrollerWidth());
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements();

        //Set padding right and bottom to scroller width to prevent overlap
        grid.padding = new Padding(
            grid.padding.top,
            grid.padding.right + this.scrollerWidth,
            grid.padding.bottom + this.scrollerWidth,
            grid.padding.left);

        grid.on('change', () => this.alignElements());
        grid.on('scroll', () => this.alignElements());
    }

    private createElements():void
    {
        console.log('createElements');
        //ScrollerExtension is a special case, we need to modify the grid container element in order
        //to reliability enable all scroll interaction without lots of emulation and buggy crap.  We
        //inject a wedge element that simulates the overflow for the container scroll bars and then
        //hold the grid in place while mirroring the scroll property against the container scorll 
        //position. Vuala!

        const container = this.grid.container;        
        dom.css(container, { overflow: 'auto' });
        this.chain(dom.on(container, 'scroll', this.onContainerScroll.bind(this)));

        const wedge = this.wedge = dom.create('div', { pointerEvents: 'none', });
        container.appendChild(wedge);

        this.alignElements();
    }

    private alignElements():void
    {
        console.log('alignElements');
        let grid = this.grid;
        let container = grid.container;

        dom.css(grid.surface.view, {
            position: 'absolute',
            left: (grid.scroll.left) + 'px',
            top: (grid.scroll.top) + 'px',
        });

        dom.css(this.wedge, {
            width: `${grid.layout.width - this.scrollerWidth}px`,
            height: `${grid.layout.height - this.scrollerWidth}px`,
        });

        if (container.scrollLeft != grid.scroll.left)
        {
            container.scrollLeft = grid.scroll.left;
        }

        if (container.scrollTop != grid.scroll.top)
        {
            container.scrollTop = grid.scroll.top;
        }
    }

    private onContainerScroll():void
    {
        let grid = this.grid;
        let maxScroll = new Point(
            Math.max(0, grid.layout.width - grid.surface.width),
            Math.max(0, grid.layout.height - grid.surface.height),
        );

        grid.scroll = new Point(grid.container.scrollLeft, grid.container.scrollTop)
            .clamp(Point.empty, maxScroll);
    }
}

function detectNativeScrollerWidth() 
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