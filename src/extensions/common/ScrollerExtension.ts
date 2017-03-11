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

    private scrollCaptureEnabled:boolean;

    private layer:HTMLDivElement;
    private scroller:HTMLDivElement;
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

        grid.on('mousedown', this.onGridMouseDown.bind(this));
        grid.on('mousemove', this.onGridAreaMouseMove.bind(this));
        grid.on('mousewheel', this.onGridMouseWheel.bind(this));
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

        let scroller = this.scroller = document.createElement('div');
        scroller.className = 'grid-scroller';
        scroller.addEventListener('scroll', this.onScrollerScroll.bind(this));
        scroller.addEventListener('mousemove', this.onGridAreaMouseMove.bind(this));
        layer.appendChild(scroller);

        let wedge = this.wedge = document.createElement('div');
        Dom.css(wedge, { pointerEvents: 'none', });
        scroller.appendChild(wedge);

        Dom.css(this.scroller, {
            position: 'absolute',
            overflow: 'scroll',
            left: '0px',
            top: '0px',
        });

        this.alignElements();
    }

    private alignElements():void
    {
        Dom.css(this.scroller, {
            pointerEvents: !!this.scrollCaptureEnabled ? 'auto' : 'auto',
            width: `${this.grid.width}px`,
            height: `${this.grid.height}px`,
        });

        Dom.css(this.wedge, {
            width: `${this.grid.virtualWidth - this.scrollerWidth}px`,
            height: `${this.grid.virtualHeight - this.scrollerWidth}px`,
        });

        if (this.scroller.scrollLeft != this.grid.scrollLeft)
        {
            this.scroller.scrollLeft = this.grid.scrollLeft;
        }

        if (this.scroller.scrollTop != this.grid.scrollTop)
        {
            this.scroller.scrollTop = this.grid.scrollTop;
        }
    }

    private toggleScrollCapture(to:boolean):void
    {
        if (this.scrollCaptureEnabled !== to)
        {
            this.scrollCaptureEnabled = to;
            this.alignElements();
        }   
    }

    private onGridMouseDown(e:MouseEvent):void 
    {
        //Middle click:
        if (e.button == 1)
        {
            this.toggleScrollCapture(true);
            this.scroller.dispatchEvent(new MouseEvent( "click", { "button": 1, }));           
        }
    }

    private onGridMouseWheel(e:MouseWheelEvent):void 
    {
        let grid = this.grid;

        let maxScroll = new Point(
            grid.virtualWidth - grid.width,
            grid.virtualHeight - grid.height,
        );

        grid.scroll = grid.scroll
            .add([e.deltaX, e.deltaY])
            .clamp(Point.empty, maxScroll);
    }

    private onGridAreaMouseMove(e:MouseEvent):void 
    {
        let grid = this.grid;
        
        if (e.offsetX > (grid.width - this.scrollerWidth) ||
            e.offsetY > (grid.height - this.scrollerWidth)) 
        {
            this.toggleScrollCapture(true);    
        }
        else 
        {
            this.toggleScrollCapture(false);
        }
    }

    private onScrollerScroll():void
    {
        this.grid.scroll = new Point(this.scroller.scrollLeft, this.scroller.scrollTop);
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