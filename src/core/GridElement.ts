import { ObjectMap } from '../common';
import { Observable } from '../eventing/Observable';
import { SimpleEventEmitter } from '../eventing/SimpleEventEmitter';
import { Padding } from '../geom/Padding';
import { Point } from '../geom/Point';
import { Rect, RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridModel } from '../model/GridModel';
import { Surface } from '../vom/Surface';
import { CellVisual } from './CellVisual';
import { GridExtension, Routine } from './Extensibility';
import { GridKernel } from './GridKernel';
import { GridLayout } from './GridLayout';
import { GridView } from './GridView';


export class GridElement extends SimpleEventEmitter
{
    private viewBuffers:ObjectMap<ViewBuffer> = {};

    private readonly internal = {
        container: null as HTMLElement,
        layout: null as GridLayout,
        surface: null as Surface,
        kernel: null as GridKernel,
        view: null as GridView,
    } 

    public static create(container:HTMLElement, initialModel?:GridModel):GridElement
    {
        let surface = new Surface(container.clientWidth, container.clientHeight);
        container.appendChild(surface.view);

        let grid = new GridElement(container, surface, initialModel || GridModel.dim(26, 100));
        return grid;
    }

    private constructor(container:HTMLElement, surface:Surface, model:GridModel)
    {
        super();

        this.internal.container = container;
        this.internal.surface = surface;
        this.internal.kernel = new GridKernel(this.emit.bind(this));
        this.model = model;

        surface.ticker.add(() => this.updateSurface());

        surface.on('resize', () => this.notifyChange('surface'));
        surface.on('scroll', () => this.notifyChange('surface'));
    }

    @Observable()
    public model:GridModel;
    
    @Observable(Point.empty)
    public freezeMargin:Point;
    
    @Observable(Padding.empty)
    public padding:Padding;

    public get container():HTMLElement
    {
        return this.internal.container;
    }

    public get layout():GridLayout
    {
        return this.internal.layout;
    }

    public get surface():Surface
    {
        return this.internal.surface;
    }

    public get kernel():GridKernel
    {
        return this.internal.kernel;
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

    private updateSurface():void
    {
        let { layout, view } = this.internal;

        for (let vlt of view.viewlets)
        {
            let buffer = this.viewBuffers[vlt.key];
            let cells = layout.captureCells(vlt);

            this.updateBuffer(buffer, cells);
        }
    }

    private updateBuffer(buffer:ViewBuffer, cells:GridCell[]):void
    {
        let { layout } = this;
        let newList = new Array<ViewBufferEntry>(cells.length);

        buffer.cycle++;

        for (let i = 0; i < cells.length; i++)
        {
            let cell = cells[i];
            let entry = buffer.index[cell.id];

            if (!entry)
            {
                let rect = layout.measureCell(cell.id);
                let visual = this.doCreateVisual(cell, rect);
                entry = buffer.index[cell.id] = new ViewBufferEntry(cell.id, visual);
            }

            if (entry.nonce != cell.nonce)
            {
                let rect = layout.measureCell(cell.id);
                this.doUpdateVisual(entry.visual, cell, rect);
                entry.nonce = cell.nonce;
            }

            entry.cycle = buffer.cycle;
            newList[i] = entry;
        }

        for (let entry of buffer.list)
        {
            if (entry.cycle < buffer.cycle)
            {
                delete buffer.index[entry.cellId];
                this.doDestroyVisual(entry.visual);
            }
        }

        buffer.list = newList;
    }

    private destroyBuffer(buffer:ViewBuffer):void
    {
        for (let entry of buffer.list)
        {
            this.doDestroyVisual(entry.visual);
        }

        buffer.index = null;
        buffer.list = null;
    }

    private updateLayout():void
    {
        this.internal.layout = GridLayout.compute(this.model, this.padding);
    }

    private updateView():void
    {
        let { surface } = this;

        let viewport = new Rect(surface.scrollLeft, surface.scrollTop, surface.width, surface.height);
        this.internal.view = GridView.compute(viewport, this.freezeMargin, this.internal.layout);

        let buffers = this.viewBuffers;
        let keys = this.internal.view.viewlets.map(x => x.key);

        this.viewBuffers = {};

        for (let k of keys)
        {
            if (buffers[k])
            {
                this.viewBuffers[k] = buffers[k];
                delete buffers[k];
            }
            else
            {
                this.viewBuffers[k] = new ViewBuffer();
            }
        }

        for (let k in buffers)
        {
            if (buffers[k])
            {
                this.destroyBuffer(buffers[k]);
            }
        }
    }

    @Routine()
    private doCreateVisual(cell:GridCell, rect:RectLike):CellVisual
    {   
        let visual = new CellVisual();
        visual.topLeft = new Point(rect.left, rect.top);
        visual.width = rect.width;
        visual.height = rect.height;
        visual.update(cell);
        visual.mountTo(this.surface.root);
        return visual;
    }

    @Routine()
    private doUpdateVisual(visual:CellVisual, cell:GridCell, rect:RectLike):void
    {
        visual.topLeft = new Point(rect.left, rect.top);
        visual.width = rect.width;
        visual.height = rect.height;
        visual.update(cell);
    }

    @Routine()
    private doDestroyVisual(visual:CellVisual):void
    {
        visual.unmountSelf();
    }

    private notifyChange(property:string):void
    {
        switch (property)
        {
            case 'model':
            case 'freezeMargin':
            case 'padding':
                this.updateLayout();
                this.updateView();
                this.updateSurface();
                break;
            case 'surface':
                this.updateView();
                this.updateSurface();
                break;
        }   
    }
}

export class ViewBuffer
{
    public cycle:number = 0;
    public index:ObjectMap<ViewBufferEntry> = {};
    public list:ViewBufferEntry[] = [];
}

export class ViewBufferEntry
{
    constructor(public cellId:string, 
                public visual:CellVisual, 
                public nonce?:number, 
                public cycle?:number)
    {
    }
}