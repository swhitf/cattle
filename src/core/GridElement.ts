import * as ResizeObserver from 'resize-observer-polyfill';

import { AbstractDestroyable } from '../base/AbstractDestroyable';
import { Observable } from '../base/Observable';
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { ObjectMap } from '../common';
import { ClipboardExtension } from '../extensions/clipboard/ClipboardExtension';
import { EditingExtension } from '../extensions/editing/EditingExtension';
import { NetExtension } from '../extensions/nets/NetExtension';
import { ScrollerExtension } from '../extensions/scrolling/ScrollingExtension';
import { SelectorExtension } from '../extensions/selector/SelectorExtension';
import { Padding } from '../geom/Padding';
import { Point } from '../geom/Point';
import { Rect, RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridModel } from '../model/GridModel';
import { GoogleSheetsTheme } from '../themes/GoogleSheetsTheme';
import { Camera } from '../vom/Camera';
import { CameraEvent } from '../vom/events/CameraEvent';
import { Theme } from '../vom/styling/Theme';
import { Surface } from '../vom/Surface';
import { CellVisual } from './CellVisual';
import { GridChangeEvent } from './events/GridChangeEvent';
import { GridExtension, Routine } from './Extensibility';
import { GridKernel } from './GridKernel';
import { GridLayout } from './GridLayout';
import { GridView } from './GridView';


export class GridElement extends SimpleEventEmitter
{
    private cameraBuffers:ObjectMap<CameraBuffer> = {};
    private autoBufferUpdateEnabled:boolean = true;
    
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
        enableAutoResize(container, surface);

        let grid = new GridElement(container, surface, initialModel || GridModel.dim(26, 100));
        return grid;
    }

    public static createDefault(container:HTMLElement, initialModel?:GridModel):GridElement
    {
        return this.create(container, initialModel)
            .extend(new NetExtension())
            .extend(new SelectorExtension())
            .extend(new EditingExtension())
            .extend(new ScrollerExtension())
            .extend(new ClipboardExtension())
            .useTheme(GoogleSheetsTheme)
        ;
    }

    private constructor(container:HTMLElement, surface:Surface, model:GridModel)
    {
        super();

        this.internal.container = container;
        this.internal.kernel = new GridKernel(this.emit.bind(this));
        this.internal.layout = GridLayout.empty;
        this.internal.surface = surface;
        this.internal.view = new GridView(this.layout, this.surface);

        this.initCameras();        
        this.initSurface();

        //Do this last to kick everything in...
        this.model = model;
    }

    @Observable(GridModel.empty)
    public model:GridModel;
    
    @Observable(Point.empty)
    public freezeMargin:Point;
    
    @Observable(Padding.empty)
    public padding:Padding;
    
    @Observable(Point.empty)
    public scroll:Point;

    public get container():HTMLElement
    {
        return this.internal.container;
    }
    
    public get kernel():GridKernel
    {
        return this.internal.kernel;
    }

    public get layout():GridLayout
    {
        return this.internal.layout;
    }

    public get surface():Surface
    {
        return this.internal.surface;
    }

    public get view():GridView
    {
        return this.internal.view;
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

    public useTheme(theme:Theme):GridElement 
    {
        this.surface.theme = theme;
        return this;        
    }

    public exec(command:string, ...args:any[]):void
    {
        this.kernel.commands.exec(command, ...args);
    }

    public get(variable:string):any
    {
        return this.kernel.variables.get(variable);
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
        this.surface.view.focus();
    }

    public forceUpdate():void
    {
        this.updateSurface();
        this.surface.render();
    }

    private initCameras():void
    {
        let { surface } = this;

        //Setup events to auto-reflect camera changes
        
        surface.cameras.on('create', (e:CameraEvent) => this.allocateBuffer(e.target));
        surface.cameras.on('destroy', (e:CameraEvent) => this.destroyBuffer(e.target));
        surface.cameras.on('change', (e:CameraEvent) => 
        {
            if (this.autoBufferUpdateEnabled) 
            {
                this.cameraBuffers[e.target.id].update(this.layout);
            }
        });
        
        //Camera "main" already exists, so we need to allocate buffer
        this.allocateBuffer(surface.cameras.item('main'));

        let camTop = surface.cameras.create('gm-top');
        let camLeft = surface.cameras.create('gm-left');
        let camTopLeft = surface.cameras.create('gm-topleft');
    }

    private initSurface():void
    {
        let { surface } = this;
        
        surface.on('resize', () => this.updateCameras());
        surface.on('resize', () => this.updateSurface());
        surface.ticker.add('updateSurface', () => this.updateSurface());
    }
    
    private updateCameras():void
    {
        let { freezeMargin, layout, surface } = this;
        this.autoBufferUpdateEnabled = false;

        let camMain = surface.cameras.item('main');
        let camTop = surface.cameras.item('gm-top');
        let camLeft = surface.cameras.item('gm-left');
        let camTopLeft = surface.cameras.item('gm-topleft');

        if (freezeMargin.equals(Point.empty))
        {   
            let camMain = surface.cameras.item('main');
            camMain.vector = this.scroll;   
            camMain.bounds = new Rect(0, 0, this.surface.width, this.surface.height);

            //Setting bounds to nothing will disable cameras
            camTop.bounds = camLeft.bounds = camTopLeft.bounds = Rect.empty;
        }
        else
        {
            let margin = new Point(
                layout.measureColumnRange(0, freezeMargin.x).width, 
                layout.measureRowRange(0, freezeMargin.y).height);

            camMain.vector = margin.add(this.scroll);
            camMain.bounds = new Rect(margin.x, margin.y, surface.width - margin.x, surface.height - margin.y);

            camTop.vector = new Point(margin.x + this.scroll.x, 0);
            camTop.bounds = new Rect(margin.x, 0, surface.width - margin.x, margin.y);
            
            camLeft.vector = new Point(0, margin.y + this.scroll.y);
            camLeft.bounds = new Rect(0, margin.y, margin.x, surface.height - margin.y );
            
            camTopLeft.vector = new Point(0, 0);
            camTopLeft.bounds = new Rect(0, 0, margin.x, margin.y);
        }

        this.autoBufferUpdateEnabled = true;
    }

    private updateSurface():void
    {
        let layout = this.layout;
        let cameras = this.surface.cameras;

        for (let i = 0; i < cameras.count; i++)
        {
            let camera = cameras.item(i);
            let buffer = this.cameraBuffers[camera.id];

            buffer.update(layout);
        }
    }
    
    private allocateBuffer(camera:Camera):CameraBuffer
    {
        return this.cameraBuffers[camera.id] = new CameraBuffer(camera, {
            create: this.doCreateVisual.bind(this),
            update: this.doUpdateVisual.bind(this),
            destroy: this.doDestroyVisual.bind(this),
        });
    }

    private destroyBuffer(camera:Camera):void
    {
        let buffer = this.cameraBuffers[camera.id];
        buffer.destroy();
        delete this.cameraBuffers[camera.id];
    }

    private updateLayout():void
    {
        this.internal.layout = GridLayout.compute(this.model, this.padding);
        this.internal.view = new GridView(this.layout, this.surface);
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
                this.updateCameras();
                break;
            case 'scroll':
                this.updateCameras();
                break;
        }   

        this.emit(new GridChangeEvent(this, property));
    }
}

interface VisualDelegate
{
    create(cell:GridCell, rect:RectLike):CellVisual;

    update(visual:CellVisual, cell:GridCell, rect:RectLike):void;

    destroy(visual:CellVisual):void;
}

class CameraBuffer extends AbstractDestroyable
{
    private cycle:number = 0;
    private index:ObjectMap<CameraBufferEntry> = {};
    private list:CameraBufferEntry[] = [];

    constructor(public camera:Camera, private visuals:VisualDelegate)
    {
        super();
    }

    public destroy():void
    {
        let { visuals } = this;

        super.destroy();

        for (let entry of this.list)
        {
            visuals.destroy(entry.visual);
        }

        this.index = null;
        this.list = null;
    }

    public update(layout:GridLayout):void
    {
        let { camera, visuals } = this;

        let cells = layout.captureCells(camera.area);
        let newList = new Array<CameraBufferEntry>(cells.length);

        this.cycle++;

        for (let i = 0; i < cells.length; i++)
        {
            let cell = cells[i];
            let entry = this.index[cell.ref];

            if (!entry)
            {
                let rect = layout.measureCell(cell.ref);
                let visual = visuals.create(cell, rect);
                entry = this.index[cell.ref] = new CameraBufferEntry(cell.ref, visual);
            }

            if (entry.nonce != cell.nonce)
            {
                let rect = layout.measureCell(cell.ref);
                visuals.update(entry.visual, cell, rect);
                entry.nonce = cell.nonce;
            }

            entry.cycle = this.cycle;
            newList[i] = entry;
        }

        for (let entry of this.list)
        {
            if (entry.cycle < this.cycle)
            {
                delete this.index[entry.cellId];
                visuals.destroy(entry.visual);
            }
        }

        this.list = newList;
    }
}

export class CameraBufferEntry
{
    constructor(public cellId:string, 
                public visual:CellVisual, 
                public nonce?:number, 
                public cycle?:number)
    {
    }
}

function enableAutoResize(container:HTMLElement, surface:Surface) {

    //TypeScript not liking this for some reason...
    const RO = ResizeObserver as any;

    let t = { id: null as any };

    (new RO((entries, observer) => {
        const {left, top, width, height} = entries[0].contentRect;
        
        const apply = () => {
            if (surface.width != width || surface.height != height) {
                console.log('apply-size');
                surface.width = width;
                surface.height = height;
            }
        };

        clearTimeout(t.id);
        t.id = setTimeout(apply, 100);
    }))
    .observe(container);
}