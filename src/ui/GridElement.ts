import { GridKernel } from './GridKernel';
import { DefaultGrid } from './../model/default/DefaultGrid';
import { ObjectIndex } from './../global.d';
import { ObjectMap } from '../global';
import { CellModel } from '../model/CellModel';
import { GridModel } from '../model/GridModel';
import { GridModelIndex } from './../model/GridModelIndex';
import { DefaultCellVisual } from './internal/DefaultCellVisual';
import { EventEmitterBase } from './internal/EventEmitter';
import { GridLayout } from './internal/GridLayout';
import { Visual } from './internal/Visual';
import { Renderer } from './Renderer';
import { property } from '../misc/Property';
import { Rect, RectLike } from '../geom/Rect';
import { Point, PointLike } from '../geom/Point';
import * as util from '../misc/Util'
import { MouseDragEvent } from '../input/MouseDragEvent';


export interface GridExtension
{
    new(grid:GridElement, kernel:GridKernel):any;
}

export interface GridMouseEvent extends MouseEvent
{
    readonly cell:CellModel;
    readonly gridX:number;
    readonly gridY:number;
}

export interface GridMouseDragEvent extends MouseDragEvent
{
    readonly cell:CellModel;
    readonly gridX:number;
    readonly gridY:number;
}

export interface GridKeyboardEvent extends KeyboardEvent
{

}

export class GridElement extends EventEmitterBase
{
    public static create(target:HTMLElement):GridElement
    {
        let canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className;
        canvas.tabIndex = 0;
        canvas.width = target.clientWidth;
        canvas.height = target.clientHeight;

        target.parentNode.insertBefore(canvas, target);
        target.remove();

        return new GridElement(canvas);
    }

    @property(new DefaultGrid(), t => t.invalidate())
    public model:GridModel;

    @property(0, t => { t.redraw(); t.emit('scroll'); })
    public scrollLeft:number;

    @property(0, t => { t.redraw(); t.emit('scroll'); })
    public scrollTop:number;

    public readonly root:HTMLElement;

    public readonly kernel:GridKernel;

    private layout:GridLayout;
    private dirty:boolean = false;
    private buffers:ObjectMap<Buffer> = {};
    private visuals:ObjectMap<Visual> = {};
    private modelIndex:GridModelIndex;

    private constructor(private canvas:HTMLCanvasElement)
    {
        super();

        this.root = canvas;
        let kernel = this.kernel = new GridKernel(this.emit.bind(this));

        ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(x => this.forwardMouseEvent(x));
        ['keydown', 'keypress', 'keyup']
            .forEach(x => this.forwardKeyEvent(x));

        kernel.variables.define('width', { get: () => this.width });
        kernel.variables.define('height', { get: () => this.height });
        kernel.variables.define('modelIndex', { get: () => this.modelIndex });
    }

    public get width():number
    {
        return this.root.clientWidth;
    }

    public get height():number
    {
        return this.root.clientHeight;
    }

    public get virtualWidth():number
    {
        return this.layout.width;
    }

    public get virtualHeight():number
    {
        return this.layout.height;
    }

    public get scroll():Point
    {
        return new Point(this.scrollLeft, this.scrollTop);
    }

    public extend(ext:GridExtension):GridElement
    {
        let inst = new ext(this, this.kernel);
        return this;
    }

    public focus():void
    {
        this.root.focus();
    }

    public scrollTo(ptOrRect:PointLike|RectLike):void
    {
        let dest = <any>ptOrRect;

        if (dest.width === undefined && dest.height === undefined)
        {
            dest = new Rect(dest.x, dest.y, 1, 1);
        }

        if (dest.left < 0)
        {
            this.scrollLeft += dest.left;
        }
        if (dest.right > this.width)
        {
            this.scrollLeft += dest.right - this.width;
        }
        if (dest.top < 0)
        {
            this.scrollTop += dest.top;
        }
        if (dest.bottom > this.height)
        {
            this.scrollTop += dest.bottom - this.height;
        }
    }

    public getCellAtGridPoint(pt:PointLike):CellModel
    {
        let refs = this.layout.captureCells(new Rect(pt.x, pt.y, 1, 1));
        if (refs.length)
        {
            return this.modelIndex.findCell(refs[0]);
        }

        return null;
    }

    public getCellAtViewPoint(pt:PointLike):CellModel
    {
        let viewport = this.computeViewport();
        let gpt = Point.create(pt).add(viewport.topLeft());

        return this.getCellAtGridPoint(gpt);
    }

    public getCellsInGridRect(rect:RectLike):CellModel[]
    {
        let refs = this.layout.captureCells(rect);
        return refs.map(x => this.modelIndex.findCell(x));
    }

    public getCellsInViewRect(rect:RectLike):CellModel[]
    {
        let viewport = this.computeViewport();
        let grt = Rect.fromLike(rect).offset(viewport.topLeft());

        return this.getCellsInGridRect(grt);
    }

    public getCellGridRect(ref:string):Rect
    {
        let region = this.layout.queryCell(ref);
        return !!region ? Rect.fromLike(region) : null;
    }

    public getCellViewRect(ref:string):Rect
    {
        let rect = this.getCellGridRect(ref);

        if (rect)
        {
            rect = rect.offset(this.scroll.inverse());
        }

        return rect;
    }

    public invalidate():void
    {
        this.buffers = {};
        this.modelIndex = new GridModelIndex(this.model);
        this.layout = GridLayout.compute(this.model);

        this.redraw();

        this.emit('invalidate');
    }

    public redraw():void
    {
        if (!this.dirty)
        {
            this.dirty = true;
            requestAnimationFrame(this.draw.bind(this));
        }
    }

    private draw():void
    {
        this.updateVisuals();
        this.drawVisuals();

        this.dirty = false;
        this.emit('draw');
    }

    private computeViewport():Rect
    {
        return new Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    }

    private updateVisuals():void
    {
        console.time('GridElement.updateVisuals');

        let viewport = this.computeViewport();
        let visibleCells = this.layout.captureCells(viewport);
        let visuals = <ObjectMap<Visual>>{};

        let apply = (visual:Visual, region:RectLike):Visual =>
        {
            visual.left = region.left;
            visual.top = region.top;
            visual.width = region.width
            visual.height = region.height;
            return visual;
        };

        for (let vcr of visibleCells)
        {
            let region = this.layout.queryCell(vcr);

            //If visual already exists, update and add existing
            if (this.visuals[vcr])
            {
                visuals[vcr] = apply(this.visuals[vcr], region);
            }
            //Otherwise create new
            else
            {
                visuals[vcr] = apply(this.createVisual(), region);
            }
        }

        console.timeEnd('GridElement.updateVisuals');

        this.visuals = visuals;
    }

    private drawVisuals():void
    {
        console.time('GridElement.drawVisuals');

        let viewport = this.computeViewport();
        let gfx = this.canvas.getContext('2d');
        gfx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        gfx.save();
        gfx.translate(viewport.left * -1, viewport.top * -1);

        for (let cr in this.visuals)
        {
            let cell = this.modelIndex.findCell(cr);
            let visual = this.visuals[cr];

            if (!viewport.intersects(visual))
            {
                continue;
            }

            let buffer = this.buffers[cell.ref];

            if (!buffer)
            {
                buffer = this.buffers[cell.ref] = this.createBuffer(visual.width, visual.height);
                //noinspection TypeScriptUnresolvedFunction
                let renderer = Reflect.getMetadata('custom:renderer', cell.constructor);

                renderer(buffer.gfx, visual, cell);
            }

            gfx.drawImage(buffer.canvas, visual.left - buffer.inflation, visual.top - buffer.inflation);
        }

        gfx.restore();

        console.timeEnd('GridElement.drawVisuals');
    }

    private createBuffer(width:number, height:number):Buffer
    {
        return new Buffer(width, height, 25);
    }

    private createVisual():Visual
    {
        return new DefaultCellVisual();
    }

    private forwardMouseEvent(event:string):void
    {
        this.canvas.addEventListener(event, (ne:MouseEvent) =>
        {
            let pt = new Point(ne.offsetX, ne.offsetY);
            let cell = this.getCellAtViewPoint(pt);
            
            let ge = <any>ne;
            ge.cell = cell || null;
            ge.gridX = pt.x;
            ge.gridY = pt.y;      

            this.emit(event, ge);
        });
    }

    private forwardKeyEvent(event:string):void
    {
        this.canvas.addEventListener(event, (ne:KeyboardEvent) =>
        {
            this.emit(event, <GridKeyboardEvent>ne);
        });
    }
}

class Buffer
{
    public canvas:HTMLCanvasElement;
    public gfx:CanvasRenderingContext2D;

    constructor(public width:number, public height:number, public inflation:number)
    {
        this.canvas = document.createElement('canvas');
        this.canvas.width = width + (inflation * 2);
        this.canvas.height = height + (inflation * 2);
        this.gfx = this.canvas.getContext('2d');
        this.gfx.translate(inflation, inflation);
    }
}