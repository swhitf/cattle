import { Padding } from '../geom/Padding';
import { MouseInput } from '../input/MouseInput';
import { GridRow } from '../model/GridRow';
import { DefaultGridModel } from '../model/default/DefaultGridModel';
import { EventEmitterBase } from './internal/EventEmitter';
import { GridKernel } from './GridKernel';
import { GridCell } from '../model/GridCell';
import { GridModel } from '../model/GridModel';
import { GridRange } from '../model/GridRange';
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

export interface GridExtender
{
    (grid:GridElement, kernel:GridKernel):void;
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
        let parent = target.parentElement;

        let canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className;
        canvas.tabIndex = target.tabIndex || 0;

        target.id = null;
        parent.insertBefore(canvas, target);
        parent.removeChild(target);

        if (!parent.style.position || parent.style.position === 'static') 
        {
            parent.style.position = 'relative';
        }

        let grid = new GridElement(canvas);
        grid.model = initialModel || DefaultGridModel.dim(26, 100);
        grid.bash();

        return grid;
    }

    @property(DefaultGridModel.empty(), t => { t.emit('load', t.model); t.invalidate(); })
    public model:GridModel;

    @property(new Point(0, 0), t => t.invalidate())
    public freezeMargin:Point;

    @property(Padding.empty, t => t.invalidate())
    public padding:Padding;

    @property(Point.empty, t => { t.redraw(); t.emit('scroll'); })
    public scroll:Point;

    public readonly root:HTMLCanvasElement;
    public readonly container:HTMLElement;
    public readonly kernel:GridKernel;

    private hotCell:GridCell;
    private dirty:boolean = false;
    private layout:GridLayout;    
    private buffers:ObjectMap<Buffer> = {};
    private visuals:ObjectMap<Visual> = {};
    private frame:ViewAspect[];

    private constructor(private canvas:HTMLCanvasElement)
    {
        super();

        this.root = canvas;
        this.container = canvas.parentElement;

        let kernel = this.kernel = new GridKernel(this.emit.bind(this));

        ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave', 'mousewheel', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(x => this.forwardMouseEvent(x));
        ['keydown', 'keypress', 'keyup']
            .forEach(x => this.forwardKeyEvent(x));

        this.enableEnterExitEvents();
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

    public get scrollLeft():number
    {
        return this.scroll.x;
    }

    public get scrollTop():number
    {
        return this.scroll.y;
    }

    public extend(ext:GridExtension|GridExtender):GridElement
    {
        if (typeof(ext) === 'function')
        {
            ext(this, this.kernel);
        }
        else
        {
            this.kernel.install(ext);

            if (ext.init)
            {
                ext.init(this, this.kernel);
            }
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
        let fragment = this.computeViewFragments()
            .filter(x => Rect.prototype.contains.call(x, pt))[0];

        let viewport = this.computeViewport();
        let gpt = Point.create(pt).add([fragment.left, fragment.top]);

        return this.getCellAtGridPoint(gpt);
    }

    public getCellsInGridRect(rect:RectLike):GridCell[]
    {
        let refs = this.layout.captureCells(rect);
        return refs.map(x => this.model.findCell(x));
    }

    public getCellsInViewRect(rect:RectLike):GridCell[]
    {
        let fragment = this.computeViewFragments()
            .filter(x => Rect.prototype.contains.call(x, new Point(rect.left, rect.top)))[0];
        let grt = Rect.fromLike(rect).offset([fragment.left, fragment.top]);

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
        let dest:Rect;

        if (ptOrRect['width'] === undefined && ptOrRect['height'] === undefined)
        {
            dest = new Rect(ptOrRect['x'], ptOrRect['y'], 1, 1);
        }
        else
        {
            dest = Rect.fromLike(ptOrRect as RectLike);
        }

        let newScroll = {
            x: this.scroll.x,
            y: this.scroll.y,
        };

        if (dest.left < 0)
        {
            newScroll.x += dest.left;
        }
        if (dest.right > this.width)
        {
            newScroll.x += dest.right - this.width;
        }
        if (dest.top < 0)
        {
            newScroll.y += dest.top;
        }
        if (dest.bottom > this.height)
        {
            newScroll.y += dest.bottom - this.height;
        }

        if (!this.scroll.equals(newScroll))
        {
            this.scroll = Point.create(newScroll);
        }
    }

    public bash():void
    {
        this.root.width = this.root.parentElement.clientWidth;
        this.root.height = this.root.parentElement.clientHeight;
        this.emit('bash');

        this.invalidate();
    }

    public invalidate(query:string = null):void
    {
        console.time('GridElement.invalidate');
        this.layout = GridLayout.compute(this.model, this.padding);
        
        if (!!query)
        {
            let range = GridRange.select(this.model, query);
            for (let cell of range.ltr) {
                delete cell['__dirty'];
                delete this.buffers[cell.ref];
            }
        }
        else
        {
            this.buffers = {};
            this.model.cells.forEach(x => delete x['__dirty']);
        }

        console.timeEnd('GridElement.invalidate');
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
                requestAnimationFrame(this.draw.bind(this));
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

    private computeViewFragments():ViewFragment[]
    {
        let { freezeMargin, layout } = this;

        let make = (l:number, t:number, w:number, h:number, ol:number, ot:number) => ({
            left: l,
            top: t,
            width: w,
            height: h,
            offsetLeft: ol,
            offsetTop: ot,
        });

        let viewport = this.computeViewport();

        if (freezeMargin.equals(Point.empty))
        {
            return [ make(viewport.left, viewport.top, viewport.width, viewport.height, 0, 0) ];
        }
        else
        {
            let marginLeft = layout.queryColumnRange(0, freezeMargin.x).width;
            let marginTop = layout.queryRowRange(0, freezeMargin.y).height;
            let margin = new Point(marginLeft, marginTop);

            //Aliases to prevent massive lines;
            let vp = viewport;
            let mg = margin;

            return [ 
                make(vp.left + mg.x, vp.top + mg.y, vp.width - mg.x, vp.height - mg.y, mg.x, mg.y), //Main
                make(0, vp.top + mg.y, mg.x, vp.height - mg.y, 0, mg.y), //Left
                make(vp.left + mg.x, 0, vp.width - mg.x, mg.y, mg.x, 0), //Top
                make(0, 0, mg.x, mg.y, 0, 0), //LeftTop
            ];
        }
    }

    private computeViewport():Rect
    {
        return new Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    }

    private updateVisuals():void
    {
        console.time('GridElement.drawVisuals');
        
        let { model, layout } = this;
        let fragments = this.computeViewFragments();

        console.log(fragments);
        
        let prevFrame = this.frame;
        let nextFrame = [] as ViewAspect[];

        //If the fragments have changed, nerf the prevFrame since we don't want to recycle anything.
        if (!prevFrame || prevFrame.length != fragments.length)
        {
            prevFrame = [];
        }

        for (let i = 0; i < fragments.length; i++)
        {
            let prevAspect = prevFrame[i];
            let aspect = <ViewAspect>{
                view: fragments[i],
                visuals: {},
            };

            let viewCells = layout.captureCells(aspect.view)
                .map(ref => model.findCell(ref));

            for (let cell of viewCells)
            {
                let region = layout.queryCell(cell.ref);
                let visual = !!prevAspect ? prevAspect.visuals[cell.ref] : null;

                // If we didn't have a previous visual or if the cell was dirty, create new visual
                if (!visual || cell.value !== visual.value || cell['__dirty'] !== false)
                {
                    aspect.visuals[cell.ref] = this.createVisual(cell, region);
                    delete this.buffers[cell.ref];

                    cell['__dirty'] = false;
                }
                // Otherwise just use the previous
                else
                {
                    aspect.visuals[cell.ref] = visual;
                }
            }

            nextFrame.push(aspect);
        }

        this.frame = nextFrame;


        // setTimeout(() =>
        // {
        //     let gfx = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
        //     gfx.save();
            
        //     for (let f of fragments) 
        //     {
        //         //gfx.translate(f.left * -1, f.top * -1);
        //         gfx.strokeStyle = 'red';
        //         gfx.strokeRect(f.offsetLeft, f.offsetTop, f.width, f.height);            
        //     }

        //     gfx.restore();

        // }, 50);
    }

    private updateVisuals2():void
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

        //let frozenCells = layout.captureCells(viewport.inflate)
        let fm = this.freezeMargin;
        
        let fragments = [] as Rect[];
        fragments.push(viewport);
        fragments.push(new Rect(0, 0, layout.queryColumnRange(0, fm.x).width, layout.queryRowRange(0, fm.y).height));
        fragments.push(new Rect(0, viewport.top + fragments[1].height, fragments[1].width, (viewport.height - fragments[1].height)));
        fragments.push(new Rect(viewport.left + fragments[1].width, 0, viewport.width - fragments[1].width, fragments[1].height));

        setTimeout(() =>
        {
            let gfx = this.canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
            gfx.save();
            gfx.translate(viewport.left * -1, viewport.top * -1);
            
            for (let f of fragments) 
            {
                gfx.strokeStyle = 'red';
                gfx.strokeRect(f.left, f.top, f.width, f.height);            
            }

            gfx.restore();

        }, 50);

        fragments.splice(0, 1);
        fragments[0]['m'] = (r:Rect, v:Visual) => { v.left = r.left + viewport.left; v.top = r.top + viewport.top }
        fragments[1]['m'] = (r:Rect, v:Visual) => v.left = r.left + viewport.left;
        fragments[2]['m'] = (r:Rect, v:Visual) => v.top = r.top + viewport.top;

        nextFrame = <ObjectMap<Visual>>{};

        for (let f of fragments.reverse()) 
        {
            let fragmentCells = layout.captureCells(f)
                .map(ref => model.findCell(ref));

            let prevFrame = this.visuals;

            for (let cell of fragmentCells)
            {
                let region = layout.queryCell(cell.ref);
                let visual = prevFrame[cell.ref] || nextFrame[cell.ref];

                // If we didn't have a previous visual or if the cell was dirty, create new visual
                if (!visual || cell.value !== visual.value || cell['__dirty'] !== false)
                {
                    nextFrame[cell.ref] = visual = this.createVisual(cell, region);
                    delete this.buffers[cell.ref];
                    
                    cell['__dirty'] = false;
                }
                // Otherwise just use the previous
                else
                {
                    nextFrame[cell.ref] = visual;
                }

                f['m'](region, visual);
            }
        }

        console.log(fragments);

        this.visuals = nextFrame;

        console.timeEnd('GridElement.updateVisuals');
    }

    private drawVisuals():void
    {
        let { canvas, model, frame } = this;
        
        console.time('GridElement.drawVisuals');

        let gfx = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
        gfx.clearRect(0, 0, canvas.width, canvas.height);

        for (let aspect of frame)
        {
            let view = Rect.fromLike(aspect.view);

            gfx.save();
            gfx.translate(aspect.view.offsetLeft, aspect.view.offsetTop);
            gfx.translate(aspect.view.left * -1, aspect.view.top * -1);

            for (let cr in aspect.visuals)
            {
                let cell = model.findCell(cr);
                let visual = aspect.visuals[cr];

                if (visual.width == 0 || visual.height == 0)
                {
                    continue;
                }

                if (!view.intersects(visual))
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
        }

        console.timeEnd('GridElement.drawVisuals');
    }

    private drawVisuals2():void
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

            if (visual.width == 0 || visual.height == 0)
            {
                continue;
            }

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
                visual[p] = clone(cell[p]);
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

    private enableEnterExitEvents():void
    {
        this.on('mousemove', (e:GridMouseEvent) =>
        {
            if (e.cell != this.hotCell)
            {
                if (this.hotCell)
                {
                    let newEvt = this.createGridMouseEvent('cellexit', e) as any;
                    newEvt.cell = this.hotCell;
                    this.emit('cellexit', newEvt);
                }

                this.hotCell = e.cell;

                if (this.hotCell)
                {
                    let newEvt = this.createGridMouseEvent('cellenter', e) as any;
                    newEvt.cell = this.hotCell;
                    this.emit('cellenter', newEvt);
                }
            }
        });
    }

    private createGridMouseEvent(type:string, source:GridMouseEvent):GridMouseEvent
    {
        let event = <any>(new MouseEvent(type, source));
        event.cell = source.cell;
        event.gridX = source.gridX;
        event.gridY = source.gridY;
        return event;
    }
}

interface ViewFragment extends RectLike
{
    offsetLeft:number;
    offsetTop:number;
}

interface ViewAspect
{
    view:ViewFragment;
    visuals:ObjectMap<Visual>;
}

function clone(x:any):any
{
    if (Array.isArray(x))
    {
        return x.map(clone);
    }
    else
    {
        return _.shadowClone(x);
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