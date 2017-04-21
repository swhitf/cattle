import { PointInput } from '../';
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
import { ie_safe_create_mouse_event } from '../misc/Polyfill';
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

export type GridViewScrollBehavior = 'none'|'x'|'y'|'xy';

export interface GridView extends RectLike
{
    readonly id:string;
    readonly offsetLeft:number;
    readonly offsetTop:number;
    readonly left:number;
    readonly top:number;
    readonly width:number;
    readonly height:number;
    readonly scrolling:GridViewScrollBehavior;
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

    @property(new Point(0, 0), t => t.dimension())
    public freezeMargin:Point;

    @property(Padding.empty, t => t.invalidate())
    public padding:Padding;

    @property(Point.empty, t => { t.dimension(); t.emit('scroll'); })
    public scroll:Point;

    public readonly root:HTMLCanvasElement;
    public readonly container:HTMLElement;
    public readonly kernel:GridKernel;

    private hotCell:GridCell;
    private dirty:boolean = false;
    private layout:GridLayout;    
    private buffers:ObjectMap<Buffer> = {};
    private visuals:ObjectMap<Visual> = {};
    private views_:GridView[];
    private frame:GridViewAspect[];

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

    public get views():GridView[]
    {
        return this.views_;
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

    /**
     * Gets the GridCell that occupies the specified point, relative to the virtual surface of 
     * the grid.  If there is no cell at the specified point, null is returned.
     * 
     * @param pt 
     */
    public getCellAtGridPoint(pt:PointLike):GridCell
    {
        let refs = this.layout.captureCells(new Rect(pt.x, pt.y, 1, 1));
        if (refs.length)
        {
            return this.model.findCell(refs[0]);
        }

        return null;
    }

    /**
     * Gets the GridCell that occupies the specified point, relative to the current view.  This
     * method takes into account the freezeMargin that may be causing multiple view fragments to
     * exist.  If there is no cell at the specified point, null is returned.
     * 
     * @param pt 
     */
    public getCellAtViewPoint(pti:PointInput):GridCell
    {
        //Convert the point to a grid point (catering for fragments) then use grid point method
        let pt = this.convertViewPointToGridPoint(pti);
        return this.getCellAtGridPoint(pt);
    }

    /**
     * Gets the GridCells that occupy the specified rectangle, relative to the virtual surface 
     * of the grid.  If there are no cells at the specified point, an empty array is returned.
     * 
     * @param rect 
     */
    public getCellsInGridRect(rect:RectLike):GridCell[]
    {
        let refs = this.layout.captureCells(rect);
        return refs.map(x => this.model.findCell(x));
    }

    /**
     * Gets the GridCells that occupy the specified rectangle, relative to the current view.  
     * This method takes into account the freezeMargin that may be causing multiple view 
     * fragments to exist.  The input rectangle may span more than one view fragment, in which
     * case the points will be resolved to their respective locations on the grid virtual surface
     * as per their fragments and the range of cells returned will be those falling between 
     * these points.
     * 
     * @param rect 
     */
    public getCellsInViewRect(rect:RectLike):GridCell[]
    {
        //Take the top/left and bottom/right and convert these to grid points
        let tl = this.convertViewPointToGridPoint([rect.left, rect.top]);
        let br = this.convertViewPointToGridPoint([rect.left + rect.width, rect.top + rect.height]);

        //Make this into a rect and use grid capture method
        return this.getCellsInGridRect(Rect.fromPoints(tl, br));
    }

    /**
     * Gets the rectangle, relative to the virtual surface of the grid, that the cell with the
     * specified id occupies.  If the cell does not exist in the model, null is returned.
     * 
     * @param ref 
     */
    public getCellGridRect(ref:string):Rect
    {
        let region = this.layout.queryCell(ref);
        return !!region ? Rect.fromLike(region) : null;
    }

    /**
     * Gets the rectangle, relative to the viewport, that the cell with the cell with the specified 
     * id occupies.  This method takes into account freezeMargin when computing the rectangle.  If
     * clip is specified, only the visible area is returned.
     * @param ref 
     */
    public getCellViewRect(ref:string, clip:boolean = false):Rect
    {
        let gridRect = this.getCellGridRect(ref);
        if (gridRect)
        {
            let view = this.getViewForGridPoint(gridRect.topLeft());
            let viewRelPt = this.convertGridPointToViewPoint(gridRect.topLeft(), view);
            let viewRelRect = new Rect(viewRelPt.x, viewRelPt.y, gridRect.width, gridRect.height);

            if (clip)
            {
                let viewRect = new Rect(view.offsetLeft, view.offsetTop, view.width, view.height);
                viewRelRect = viewRect.intersect(viewRelRect);
            }

            return viewRelRect;
        }

        return null;
    }

    public scrollToCell(ref:string):void
    {
        let rect = this.getCellGridRect(ref);
        if (rect)
        {
            this.scrollToGridRect(rect);
        }
    }

    public scrollToGridPoint(pti:PointInput):void
    {
        let pt = Point.create(pti);
        return this.scrollToGridRect(new Rect(pt.x, pt.y, 1, 1));
    }

    public scrollToGridRect(rl:RectLike):void
    {
        if (rl.width > this.width || rl.height > this.height)
        {
            return this.scrollToGridPoint([rl.left, rl.top]);
        }

        let rect = Rect.fromLike(rl);
        let viewport = this.computeViewport();
        let newScroll = this.scroll.clone() as PointLike;

        if (rect.left < viewport.left)
        {
            newScroll.x = rect.left;
        }
        if (rect.right > viewport.right)
        {
            newScroll.x = rect.right - this.width;
        }
        if (rect.top < viewport.top)
        {
            newScroll.y = rect.top;
        }
        if (rect.bottom > viewport.bottom)
        {
            newScroll.y = rect.bottom - this.height;
        }

        if (!this.scroll.equals(newScroll))
        {
            this.scroll = Point.create(newScroll);
        }
    }

    public scrollToViewPoint(pti:PointInput):void
    {
        this.scrollToGridPoint(this.convertViewPointToGridPoint(pti));
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
        this.views_ = this.computeViews();
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
            console.time(`GridElement.redraw(force=${forceImmediate})`);

            if (forceImmediate)
            {
                this.draw(forceImmediate);
            }
            else
            {
                requestAnimationFrame(this.draw.bind(this, forceImmediate));
            }
        }
    }

    private dimension():void
    {
        this.views_ = this.computeViews();
        this.redraw();
    }

    private draw(forced:boolean):void {
        if (!this.dirty)
            return;
            
        this.updateVisuals();
        this.drawVisuals();

        this.dirty = false;
        console.timeEnd(`GridElement.redraw(force=${forced})`);
        this.emit('draw');
    }

    private computeViews():GridView[]
    {
        let { freezeMargin, layout } = this;

        let make = (id:string, s:GridViewScrollBehavior, l:number, t:number, w:number, h:number, ol:number, ot:number) => ({
            id: id,
            scrolling: s,
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
            return [ make('main', 'xy', viewport.left, viewport.top, viewport.width, viewport.height, 0, 0) ];
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
                make('main', 'xy', vp.left + mg.x, vp.top + mg.y, vp.width - mg.x, vp.height - mg.y, mg.x, mg.y), //Main
                make('left', 'y', 0, vp.top + mg.y, mg.x, vp.height - mg.y, 0, mg.y), //Left
                make('top', 'x', vp.left + mg.x, 0, vp.width - mg.x, mg.y, mg.x, 0), //Top
                make('topLeft', 'none', 0, 0, mg.x, mg.y, 0, 0), //LeftTop
            ];
        }
    }

    private computeViewport():Rect
    {
        return new Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    }

    private convertGridPointToViewPoint(pti:PointInput, view:GridView):Point
    {
        let pt = Point.create(pti);

        switch (view.scrolling) {
            case 'x':
                return Point.create(pt).subtract([this.scrollLeft, 0]);
            case 'y':
                return Point.create(pt).subtract([0, this.scrollTop]);
            case 'xy':
                return Point.create(pt).subtract(this.scroll);
            default:
                return Point.create(pt);
        }
    }

    private convertViewPointToGridPoint(pti:PointInput, fallbackToMainFragment:boolean = true):Point
    {
        let pt = Point.create(pti);

        //Find the view the point falls in... or if none fallback to main
        let view = (
            this.views.filter(x => new Rect(x.offsetLeft, x.offsetTop, x.width, x.height).contains(pt))[0] ||
            this.views.filter(x => x.id == 'main')[0]
        );

        if (!view) throw 'Unexpected fatal error: no main view fragment.';

        //Based on scroll behavior, apply offset to point and return
        switch (view.scrolling) {
            case 'x':
                return Point.create(pt).add([this.scrollLeft, 0]);
            case 'y':
                return Point.create(pt).add([0, this.scrollTop]);
            case 'xy':
                return Point.create(pt).add(this.scroll);
            default:
                return Point.create(pt);
        }
    }

    private getViewForGridPoint(pti:PointInput):GridView
    {
        let pt = Point.create(pti);

        let view = this.views.filter(v => {
            let area = new Rect(
                v.offsetLeft, 
                v.offsetTop,
                (v.scrolling == 'x' || v.scrolling == 'xy') 
                    ? this.virtualWidth - v.offsetLeft 
                    : this.width - v.offsetLeft,
                (v.scrolling == 'y' || v.scrolling == 'xy') 
                    ? this.virtualHeight - v.offsetTop 
                    : this.height - v.offsetTop,
            );
            return area.contains(pt);
        });

        if (!view.length) 
        {
            throw 'Unexpected fatal error: no main view fragment.';
        }

        return view[0];
    }

    private updateVisuals():void
    {
        console.time('GridElement.updateVisuals');
        
        let { model, layout, views } = this;

        let prevFrame = this.frame;
        let nextFrame = [] as GridViewAspect[];

        //If the fragments have changed, nerf the prevFrame since we don't want to recycle anything.
        if (!prevFrame || prevFrame.length != views.length)
        {
            prevFrame = [];
        }

        for (let i = 0; i < views.length; i++)
        {
            let prevAspect = prevFrame[i];
            let aspect = <GridViewAspect>{
                view: views[i],
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
        let event = <any>(ie_safe_create_mouse_event(type, source));
        event.cell = source.cell;
        event.gridX = source.gridX;
        event.gridY = source.gridY;
        return event;
    }
}

interface GridViewAspect
{
    view:GridView;
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