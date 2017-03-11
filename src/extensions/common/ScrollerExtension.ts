import { coalesce } from '../../misc/Util';
import { Padding } from '../../geom/Padding';
import { GridElement, GridMouseEvent } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import * as Tether from 'tether';
import * as Dom from '../../misc/Dom';


export class ScrollerExtension
{
    private grid:GridElement;

    private layer:HTMLDivElement;
    private scrollerX:HTMLDivElement;
    private scrollerY:HTMLDivElement;
    private wedgeX:HTMLDivElement;
    private wedgeY:HTMLDivElement;

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

        grid.on('mousemove', (e:GridMouseEvent) =>
        {
            console.log('grid:', e.gridX);
            console.log('client:', e.clientX);
            console.log('offset:', e.offsetX);
            console.log('page:', e.pageX);
        });

        grid.on('invalidate', () => this.alignElements());
        grid.on('scroll', () => this.alignElements());
    }

    private createElements(target:HTMLElement):void
    {
        const scrollWidth = detect_native_scroller_width();

        let layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', });
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });

        let onBash = () => {
            Dom.fit(layer, target);
            t.position();
        };

        this.grid.on('bash', onBash);
        onBash();

        let scrollerX = this.scrollerX = document.createElement('div');
        scrollerX.className = 'grid-scroller grid-scroller-x';
        scrollerX.addEventListener('scroll', this.onScrollHorizontal.bind(this));
        layer.appendChild(scrollerX);

        let wedgeX = this.wedgeX = document.createElement('div');
        scrollerX.appendChild(wedgeX);

        let scrollerY = this.scrollerY = document.createElement('div');
        scrollerY.className = 'grid-scroller grid-scroller-y';
        scrollerY.addEventListener('scroll', this.onScrollVertical.bind(this));
        layer.appendChild(scrollerY);

        let wedgeY = this.wedgeY = document.createElement('div');
        scrollerY.appendChild(wedgeY);

        Dom.css(this.scrollerX, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: `${this.grid.width - this.scrollerWidth}px`,
            height: this.scrollerWidth + 'px',
            left: '0px',
            bottom: '0px',
        });

        Dom.css(this.scrollerY, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: this.scrollerWidth + 'px',
            height: `${this.grid.height - this.scrollerWidth}px`,
            right: '0px',
            top: '0px',
        });
    }

    private alignElements():void
    {
        Dom.css(this.scrollerX, {
            width: `${this.grid.width - this.scrollerWidth}px`,
        });

        Dom.css(this.wedgeX, {
            width: `${this.grid.virtualWidth - this.scrollerWidth}px`,
            height: '1px',
        });

        if (this.scrollerX.scrollLeft != this.grid.scrollLeft)
        {
            this.scrollerX.scrollLeft = this.grid.scrollLeft;
        }

        Dom.css(this.scrollerY, {
            height: `${this.grid.height - this.scrollerWidth}px`,
        });

        Dom.css(this.wedgeY, {
            width: '1px',
            height: `${this.grid.virtualHeight - this.scrollerWidth}px`,
        });

        if (this.scrollerY.scrollTop != this.grid.scrollTop)
        {
            this.scrollerY.scrollTop = this.grid.scrollTop;
        }
    }

    private onScrollHorizontal():void
    {
        this.grid.scrollLeft = this.scrollerX.scrollLeft;
    }

    private onScrollVertical():void
    {
        this.grid.scrollTop = this.scrollerY.scrollTop;
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