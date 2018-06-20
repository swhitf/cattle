import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Observable } from '../../base/Observable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { Padding } from '../../geom/Padding';
import { Point } from '../../geom/Point';
import * as dom from '../../misc/Dom';
import { coalesce } from '../../misc/Util';
import { DragHelper } from '../../vom/input/DragHelper';


const Template = `
    <div class="scroll-container">
        <div class="scroll-lane scroll-v">
            <div class="scroll-bar"></div>
        </div>
        <div class="scroll-lane scroll-h">
            <div class="scroll-bar"></div>
        </div>
    </div>
`;

const Style = `
    .scroll-lane {
        position: absolute;
        right: 0;
        bottom: 0;
        background: gainsboro;
    }
    
    .scroll-lane .scroll-bar {
        position: absolute;
        top: 0;
        left: 0;
        background: gray;
        user-select: none;
    }
    
    .scroll-lane.scroll-v {
        top: 0;
        bottom: 12px;
        width: 12px;
    }
    
    .scroll-lane.scroll-v .scroll-bar {
        right: 0;
        height: 50px;
    }
    
    .scroll-lane.scroll-h {
        left: 0;
        right: 12px;
        height: 12px;
    }
    
    .scroll-lane.scroll-h .scroll-bar {
        bottom: 0;
        width: 50px;
    }
`;

if (document) {
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = Style;
    document.head.appendChild(style);
}

export class ScrollerExtension2 extends AbstractDestroyable
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
            grid.padding.left
        );

        // grid.on('change', () => this.alignElements());
        // grid.on('scroll', () => this.alignElements());
    }

    public destroy():void
    {
        super.destroy();
        const { wedge } = this;
        
        if (wedge && wedge.parentElement)
        {
            wedge.parentElement.removeChild(wedge);
            this.wedge = null;
        }        
    }

    private createElements():void
    {
        const { grid } = this;

        const root = grid.container;        
        dom.css(root, { overflow: 'hidden' });

        const container = dom.parse(Template);
        root.appendChild(container);

        const sv = new ScrollController(
            container.children.item(0) as HTMLElement,
            this.applyScroll.bind(this),
        );
        sv.total = grid.layout.height;
        sv.view = grid.surface.height;
        sv.position = 0;

        // this.chain(dom.on(root, 'scroll', this.onContainerScroll.bind(this)));

        // const wedge = this.wedge = dom.create('div', { pointerEvents: 'none', });
        // root.appendChild(wedge);

        // this.alignElements();
    }

    private alignElements():void
    {
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

    private applyScroll(dim:'x'|'y', val:number):void
    {   
        const { grid } = this;

        const i = dim === 'x' ? 0 : 1;
        const spi = [grid.scroll.x, grid.scroll.y];

        spi[i] = val;

        let maxScroll = new Point(
            Math.max(0, grid.layout.width - grid.surface.width),
            Math.max(0, grid.layout.height - grid.surface.height),
        );

        grid.scroll = Point.create(spi).clamp(Point.empty, maxScroll);
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

class ScrollController extends AbstractDestroyable 
{
    private lane:HTMLElement;
    private bar:HTMLElement;

    @Observable(0)
    public total:number;
    
    @Observable(0)
    public view:number;

    @Observable(0)
    public position:number;

    constructor(lane:HTMLElement, private callback:any) 
    {
        super();
        this.lane = lane;
        this.bar = lane.firstElementChild as HTMLElement;

        const dh = new DragHelper(this.bar, this.onBarDrag.bind(this));
        this.chain(dh);
    }

    public get min():number
    {
        return 0;
    }

    public get max():number
    {
        return this.total - this.view;
    }

    public get ratio():number
    {
        return this.view / (this.total || 1);
    }

    private onBarDrag(me:MouseEvent, dist:Point):void 
    {
        let np = this.position + (dist.y / this.ratio);
        if (np < this.min) np = this.min;
        if (np > this.max) np = this.max;
        this.position = np;
    }

    private notifyChange(prop:string):void
    {
        dom.css(this.bar, { 
            top: (this.position * this.ratio) + 'px',
            height: (this.lane.clientHeight * this.ratio) + 'px',
        });

        if (prop === 'position')
        {
            this.callback('y', this.position);
        }
    }
}

function clamp(val:number, min:number, max:number)
{
    if (val < min) return min;
    if (val > max) return max;
    return val;
}