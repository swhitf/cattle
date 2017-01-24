import { GridRow } from '../model/GridRow';
import { DefaultGridModel } from '../model/default/DefaultGridModel';
import { EventEmitterBase } from './internal/EventEmitter';
import { GridKernel } from './GridKernel';
import { GridCell } from '../model/GridCell';
import { GridModel } from '../model/GridModel';
import { GridLayout } from './internal/GridLayout';
import { MouseDragEvent } from '../input/MouseDragEvent';
import { Rect, RectLike } from '../geom/Rect';
import { Point, PointLike } from '../geom/Point';
import { property } from '../misc/Property';
import { variable } from './Extensibility';
import * as _ from '../misc/Util';


export interface GridExtension
{
    init?(grid:GridElement, kernel:GridKernel):void;
}

export interface GridMouseEvent extends MouseEvent
{
    readonly cell:GridCell;
    readonly gridX:number;
    readonly gridY:number;
}

export interface GridMouseDragEvent extends MouseDragEvent
{
    readonly cell:GridCell;
    readonly gridX:number;
    readonly gridY:number;
}

export interface GridKeyboardEvent extends KeyboardEvent
{

}

export class GridElement extends EventEmitterBase
{
    public static create(target:HTMLElement, initialModel?:GridModel):GridElement
    {
        let canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className;
        canvas.tabIndex = target.tabIndex || 0;

        target.parentNode.insertBefore(canvas, target);
        target.parentNode.removeChild(target);

        let grid = new GridElement(canvas);
        grid.model = initialModel || DefaultGridModel.dim(26, 100);
        grid.bash();

        return grid;
    }

    @property(DefaultGridModel.empty(), t => { t.emit('load', t.model); t.invalidate(); })
    public model:GridModel;

    @property(0, t => { t.redraw(); t.emit('scroll'); })
    public scrollLeft:number;

    @property(0, t => { t.redraw(); t.emit('scroll'); })
    public scrollTop:number;

    public readonly root:HTMLCanvasElement;

    public readonly kernel:GridKernel;

    private layout:GridLayout;
    private dirty:boolean = false;
    private buffers:ObjectMap<Buffer> = {};
    private visuals:ObjectMap<Visual> = {};

    private constructor(private canvas:HTMLCanvasElement)
    {
        super();

        this.root = canvas;
        let kernel = this.kernel = new GridKernel(this.emit.bind(this));

        ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(x => this.forwardMouseEvent(x));
        ['keydown', 'keypress', 'keyup']
            .forEach(x => this.forwardKeyEvent(x));
    }

    public get width():number
    {
        return this.root.clientWidth;
    }

    public get height():number
    {
        return this.root.clientHeight;
    }

    public get modelWidth():number
    {
        return this.layout.columns.length;
    }

    public get modelHeight():number
    {
        return this.layout.rows.length;
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
        this.kernel.install(ext);

        if (ext.init)
        {
            ext.init(this, this.kernel);
        }

        return this;
    }

    public exec(command:string, ...args:any[]):void
    {
        this.kernel.commands.exec(command, ...args);
    }

    public get(variable:string):any
    {
        this.kernel.variables.get(variable);
    }

    public set(variable:string, value:any):void
    {
        this.kernel.variables.set(variable, value);
    }

    public mergeInterface():GridElement
    {
        this.kernel.exportInterface(this);
        return this;
    }

    public focus():void
    {
        this.root.focus();
    }

    public getCellAtGridPoint(pt:PointLike):GridCell
    {
        let refs = this.layout.captureCells(new Rect(pt.x, pt.y, 1, 1));
        if (refs.length)
        {
            return this.model.findCell(refs[0]);
        }

        return null;
    }

    public getCellAtViewPoint(pt:PointLike):GridCell
    {
        let viewport = this.computeViewport();
        let gpt = Point.create(pt).add(viewport.topLeft());

        return this.getCellAtGridPoint(gpt);
    }

    public getCellsInGridRect(rect:RectLike):GridCell[]
    {
        let refs = this.layout.captureCells(rect);
        return refs.map(x => this.model.findCell(x));
    }

    public getCellsInViewRect(rect:RectLike):GridCell[]
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

    public bash():void
    {
        this.root.width = this.root.parentElement.clientWidth;
        this.root.height = this.root.parentElement.clientHeight;
        this.emit('bash');

        this.invalidate();
    }

    public invalidate():void
    {
        this.buffers = {};
        this.layout = GridLayout.compute(this.model);

        this.redraw();

        this.emit('invalidate');
    }

    public redraw(forceImmediate:boolean = false):void
    {
        if (!this.dirty)
        {
            this.dirty = true;
            console.time('GridElement.redraw');

            if (forceImmediate)
            {
                this.draw();
            }
            else
            {
                setTimeout(this.draw.bind(this), 0);
            }
        }
    }

    private draw():void
    {
        if (!this.dirty)
            return;
            
        this.updateVisuals();
        this.drawVisuals();

        this.dirty = false;
        console.timeEnd('GridElement.redraw');
        this.emit('draw');
    }

    private computeViewport():Rect
    {
        return new Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    }

    private updateVisuals():void
    {
        console.time('GridElement.updateVisuals');

        let { model, layout } = this;

        let viewport = this.computeViewport();
        let visibleCells = layout.captureCells(viewport)
            .map(ref => model.findCell(ref));

        let prevFrame = this.visuals;
        let nextFrame = <ObjectMap<Visual>>{};

        for (let cell of visibleCells)
        {
            let region = layout.queryCell(cell.ref);
            let visual = prevFrame[cell.ref];

            // If we didn't have a previous visual or if the cell was dirty, create new visual
            if (!visual || cell.value !== visual.value || cell['__dirty'] !== false)
            {
                nextFrame[cell.ref] = this.createVisual(cell, region);
                delete this.buffers[cell.ref];

                cell['__dirty'] = false;
            }
            // Otherwise just use the previous
            else
            {
                nextFrame[cell.ref] = visual;
            }
        }

        this.visuals = nextFrame;

        console.timeEnd('GridElement.updateVisuals');
    }

    private drawVisuals():void
    {
        console.time('GridElement.drawVisuals');

        let viewport = this.computeViewport();
        let gfx = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
        gfx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        gfx.save();
        gfx.translate(viewport.left * -1, viewport.top * -1);

        for (let cr in this.visuals)
        {
            let cell = this.model.findCell(cr);
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
        return new Buffer(width, height, 0);
    }

    private createVisual(cell:any, region:RectLike):Visual
    {
        let visual = new Visual(cell.ref, cell.value, region.left, region.top, region.width, region.height);

        let props = (Reflect.getMetadata('grid:visualize', cell.constructor.prototype) || []) as string[];
        for (let p of props)
        {
            if (visual[p] === undefined)
            {
                visual[p] = _.shadowClone(cell[p]);
            }
            else
            {
                console.error(`Illegal visualized property name ${p} on type ${cell.constructor.name}.`);
            }
        }

        return visual;
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
        this.gfx = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
        this.gfx.translate(inflation, inflation);
    }
}

class Visual
{
    constructor(public ref:string,
                public value:string,
                public left:number,
                public top:number,
                public width:number,
                public height:number)
    {
    }

    public equals(another:any):boolean
    {
        for (let prop in this)
        {
            if (this[prop] !== another[prop])
            {
                return false;
            }
        }

        return true;
    }
}