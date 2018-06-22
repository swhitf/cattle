import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Observable } from '../../base/Observable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { Point } from '../../geom/Point';
import * as dom from '../../misc/Dom';
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
        user-select: none;
    }
    
    .scroll-lane .scroll-bar {
        position: absolute;
        background: #9c9c9c;
        user-select: none;
        border-radius: 2px;
    }
    
    .scroll-lane.scroll-v {
        top: 0px;
        bottom: 12px;
        width: 12px;
        outline-top: solid 2px red;
        outline-bottom: solid 2px red;
    }
    
    .scroll-lane.scroll-v .scroll-bar {
        left: 2px;
        right: 2px;
    }
    
    .scroll-lane.scroll-h {
        left: 0;
        right: 12px;
        height: 12px;
    }
    
    .scroll-lane.scroll-h .scroll-bar {
        top: 2px;
        bottom: 2px;
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

    private vScroll:ScrollController;
    private hScroll:ScrollController;

    constructor() 
    {
        super();
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements();

        //Set padding right and bottom to scroller width to prevent overlap
        // grid.padding = new Padding(
        //     grid.padding.top,
        //     grid.padding.right - 12,
        //     grid.padding.bottom + 12,
        //     grid.padding.left
        // );

        grid.surface.on('resize', () => this.alignElements());
        grid.on('change', () => this.alignElements());
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

        this.vScroll = new ScrollController(
            'y',
            container.children.item(0) as HTMLElement,
            this.applyScroll.bind(this),
        );

        this.hScroll = new ScrollController(
            'x',
            container.children.item(1) as HTMLElement,
            this.applyScroll.bind(this),
        );

        root.addEventListener('wheel', e => {
            this.applyScrollStep('y', wheelStep(e.deltaY));
        });

        this.alignElements();
    }

    private alignElements():void
    {
        const { grid, vScroll, hScroll } = this;

        if (vScroll.total != grid.layout.height)
            vScroll.total = grid.layout.height;
        if (vScroll.view != grid.surface.height)
            vScroll.view = grid.surface.height;
        if (vScroll.position != grid.scroll.y)
            vScroll.position = grid.scroll.y;

        if (hScroll.total != grid.layout.width)
            hScroll.total = grid.layout.width;
        if (hScroll.view != grid.surface.width)
            hScroll.view = grid.surface.width;
        if (hScroll.position != grid.scroll.x)
            hScroll.position = grid.scroll.x;
    }

    private applyScroll(dim:ScrollDim, val:number):void
    {   
        const { grid } = this;

        const step = dimVec(dim, val);
        grid.scroll = Point.create(step);
    }

    private applyScrollStep(dim:ScrollDim, val:number):void
    {   
        const { grid } = this;
        const { model, layout } = grid;
        
        const step = dimVec(dim, val + 1);
        
        const from = layout.pickCell(grid.scroll);
        const to = model.findCellNeighbor(from.ref, step);
        
        const a = Point.create(layout.measureCell(from.ref));
        const b = Point.create(layout.measureCell(to.ref));

        grid.scroll = grid.scroll.add(b.subtract(a));
    }
}

type ScrollDim = 'x'|'y';

class ScrollController extends AbstractDestroyable 
{
    private lane:HTMLElement;
    private bar:HTMLElement;

    public readonly dim:ScrollDim;

    @Observable(0)
    public total:number;
    
    @Observable(0)
    public view:number;

    @Observable(0)
    public position:number;

    constructor(dim:ScrollDim, lane:HTMLElement, private callback:any) 
    {
        super();
        this.dim = dim;
        this.lane = lane;
        this.bar = lane.firstElementChild as HTMLElement;

        const dh1 = new DragHelper(this.bar, this.onBarDrag.bind(this));
        const dh2 = new DragHelper(this.lane, this.onLaneDrag.bind(this));
        
        this.chain(dh1, dh2);
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

    private onBarDrag(me:MouseEvent, source:HTMLElement, dist:Point):void 
    {
        if (source != this.bar) return;

        let np = this.position + (dist[this.dim] / this.ratio);
        this.callback(this.dim, np);
    }
    
    private onLaneDrag(me:MouseEvent, source:HTMLElement, dist:Point):void 
    {
        if (source != this.lane) return;
        
        const mpt = new Point(me.clientX, me.clientY)
        const rpt = mpt.subtract(dom.cumulativeOffset(this.lane));

        let np = (rpt[this.dim] / this.ratio) - (this.view / 2);
        this.callback(this.dim, np);
    }

    private notifyChange(prop:string):void
    {
        if (this.dim === 'x') 
        {
            dom.css(this.bar, { 
                left: (this.position * this.ratio) + 'px',
                width: (this.lane.clientWidth * this.ratio) + 'px',
            });
        }
        else 
        {
            dom.css(this.bar, { 
                top: (this.position * this.ratio) + 'px',
                height: (this.lane.clientHeight * this.ratio) + 'px',
            });
        }
    }
}

function dimVec(dim:ScrollDim, val:number):Point
{
    const xy = { x: 0, y: 0 };
    xy[dim] = val;
    return Point.create(xy);
}

function wheelStep(x) {
    var s = Math.round(Math.abs(x) / 40);
    if (s < 0) s = 1;
    if (s > 2) s = 2;
    return s * (x / Math.abs(x));
}