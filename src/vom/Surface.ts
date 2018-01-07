import { DragHelper } from './input/DragHelper';
import { Event } from '../base/Event';
import { Observable } from '../base/Observable';
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { BufferManager } from './BufferManager';
import { CameraManager } from './CameraManager';
import { VisualChangeEvent } from './events/VisualChangeEvent';
import { VisualEvent } from './events/VisualEvent';
import { VisualKeyboardEvent, VisualKeyboardEventTypes } from './events/VisualKeyboardEvent';
import { VisualMouseDragEvent } from './events/VisualMouseDragEvent';
import { VisualMouseEvent, VisualMouseEventTypes } from './events/VisualMouseEvent';
import { InternalCameraManager } from './InternalCameraManager';
import { RefreshLoop } from './RefreshLoop';
import { RootVisual } from './RootVisual';
import { DefaultTheme } from './styling/DefaultTheme';
import { Theme } from './styling/Theme';
import { Visual, VisualPredicate } from './Visual';
import { VisualSequence } from './VisualSequence';
import { VisualTracker } from './VisualTracker';
import * as u from '../misc/Util';
import * as vq from './VisualQuery';
import { Modifiers } from './input/Modifiers';
import { perf } from '../perf';


/**
 * Event List:
 * 
 * keydown
 * keymove
 * keyup
 * mousedown
 * mousemove
 * mouseup
 * change
 * compose
 * scroll
 * render
 * 
 */

export class Surface extends SimpleEventEmitter
{
    public readonly cameras:CameraManager;
    public readonly root:Visual;
    public readonly ticker:RefreshLoop;
    public readonly view:HTMLCanvasElement;

    @Observable()
    public width:number;

    @Observable()
    public height:number;

    @Observable(new DefaultTheme())
    public theme:Theme;

    private readonly sequence:VisualSequence;
    private readonly buffers:BufferManager;

    private dirtyRender:boolean;
    private dirtySequence:boolean;
    private tracker:VisualTracker;

    constructor(width:number = 800, height:number = 800)
    {
        super();
        
        this.width = width;
        this.height = height;

        this.root = this.createRoot();
        this.view = this.createView();
        this.cameras = this.createCameraManager();        
        this.buffers = this.createBufferManager();

        this.sequence = new VisualSequence(this.root);
        this.tracker = new VisualTracker();
        this.theme = new DefaultTheme();
 
        this.ticker = new RefreshLoop(60);
        this.ticker.add(() => this.render());
        this.ticker.start();
    }

    public get renderRequired():boolean
    {
        return this.dirtyRender || this.dirtySequence;
    }

    public render():void
    {
        let didRender = false;

        if (this.dirtySequence)
        {
            this.sequence.update();
            this.dirtyRender = true;
        }   

        if (this.dirtyRender)
        {
            this.performRender();
            didRender = true;
        }

        this.dirtyRender = this.dirtySequence = false;

        if (didRender)
        {
            this.propagateEvent(new Event('render'), []);
        }
    }

    public query(selector:string):Visual[]
    {
        return vq.select(this.sequence.all, selector);
    }

    public test(surfacePt:Point, filter?:VisualPredicate):Visual[]
    {
        filter = filter || (x => true);
        
        let collected = [];

        this.sequence.dive(visual =>
        {
            if (visual.absoluteBounds.contains(surfacePt))
            {
                if (filter(visual))
                {
                    collected.push(visual);
                }
            }

            return true;
        });

        return collected;
    }

    private performRender()
    {
        let { buffers, sequence, view } = this;
        
        //Only render to cameras with valid bounds
        let cameras = this.cameras.toArray()
            .filter(x => !!x.bounds.width && !!x.bounds.height)

        buffers.beginRender();

        sequence.climb(visual =>
        {
            let visBuf = buffers.getFor('visual', visual);
            let visGfx = visBuf.getContext('2d');

            visGfx.clearRect(0, 0, visBuf.width, visBuf.height);
            set_transform(visGfx, Matrix.identity.translate(5, 5));
            visual.render(visGfx);

            for (let cam of cameras) 
            {
                if (!cam.bounds.width || !cam.bounds.height)
                    continue;

                let camBuf = buffers.getFor('camera', cam);
                let camGfx = camBuf.getContext('2d');
                let camMat = Matrix.identity.translate(cam.vector.x, cam.vector.y).inverse()
                let cvt = visual.transform.translate(-5, -5).multiply(camMat); //camera+visual transform

                camGfx.setTransform(cvt.a, cvt.b, cvt.c, cvt.d, cvt.e, cvt.f);
                camGfx.drawImage(visBuf, 0, 0, visBuf.width, visBuf.height, 0, 0, visBuf.width, visBuf.height);
            }

            return true;
        });

        let viewGfx = view.getContext('2d');
        set_transform(viewGfx, Matrix.identity);
        viewGfx.clearRect(0, 0, view.width, view.height);

        for (let cam of cameras)  
        {
            let camBuf = buffers.getFor('camera', cam);
            let camGfx = camBuf.getContext('2d');
            set_transform(camGfx, Matrix.identity);
            camGfx.fillStyle = 'red';
            camGfx.fillText('Cam ' + cam.id, 3, 12);
            
            set_transform(viewGfx, Matrix.identity.translate(cam.bounds.left, cam.bounds.top));
            viewGfx.drawImage(camBuf, 0, 0, camBuf.width, camBuf.height, 0, 0, camBuf.width, camBuf.height);
        }

        buffers.endRender();
    }

    private createCameraManager():InternalCameraManager
    {
        let cm = new InternalCameraManager();
        cm.create('main', 1, new Rect(0, 0, this.width, this.height), Point.empty);
        // cm.create('main2', 2, new Rect(this.width / 2, 0, this.width / 2, this.height / 2), Point.empty);
        // cm.create('main3', 3, new Rect(0, this.height / 2, this.width / 2, this.height / 2), Point.empty);
        // cm.create('main4', 4, new Rect(this.width / 2, this.height / 2, this.width / 2, this.height / 2), Point.empty);

        let callback = () => this.dirtyRender = true;
        cm.on('create', callback);
        cm.on('destroy', callback);
        cm.on('change', callback);

        return cm;
    }
    
    private createBufferManager():BufferManager
    {
        let bm = new BufferManager();
        bm.configure('visual', {
            identify: v => v.id,
            measure: v => v.size.add(10),
        });
        bm.configure('camera', {
            identify: c => c.id,
            measure: c => new Point(c.bounds.width, c.bounds.height),
        });

        return bm;
    }

    private createRoot():RootVisual
    {
        let root = new RootVisual(this);        
        root.on('compose', this.onVisualCompose.bind(this));
        root.on('change', this.onVisualChange.bind(this));
        return root;
    }

    private createView():HTMLCanvasElement
    {
        let view = document.createElement('canvas');
        view.width = this.width;
        view.height = this.height;
        view.tabIndex = -1;
        
        view.addEventListener('mousedown', this.onViewMouseEvent.bind(this, 'mousedown'));
        view.addEventListener('mousemove', this.onViewMouseEvent.bind(this, 'mousemove'));
        view.addEventListener('mouseup', this.onViewMouseEvent.bind(this, 'mouseup'));
        view.addEventListener('click', this.onViewMouseEvent.bind(this, 'click'));
        view.addEventListener('dblclick', this.onViewMouseEvent.bind(this, 'dblclick'));
        view.addEventListener('keydown', this.onViewKeyEvent.bind(this, 'keydown'));
        view.addEventListener('keypress', this.onViewKeyEvent.bind(this, 'keypress'));
        view.addEventListener('keyup', this.onViewKeyEvent.bind(this, 'keyup'));

        let dragSupport = new DragHelper(
            view, (me:MouseEvent, distance:Point) => this.onViewMouseDragEvent(me, distance));

        return view;
    }
    
    private applyTheme(theme:Theme, visuals:Visual[] = null):void
    {
        visuals = visuals || this.sequence.all;

        for (let v of visuals)
        {
            delete v['__style'];
        }

        for (let style of theme.styles)
        {
            let results = vq.select(visuals, style.selector);
            for (let v of results)
            {
                let visualStyle = v['__style'] || (v['__style'] = {});

                for (let key in style.props)
                {
                    if (!Reflect.getMetadata(`cattle:styleable:${key}`, v))
                    {
                        throw `${key} is not styleable on visual type ${v.type}.`;
                    }

                    visualStyle[key] = style.props[key];
                }

                visualStyle = u.extend(visualStyle, style.props);
            }
        }
    }

    private notifyChange(property:string):void
    {
        switch (property) {
            case 'width':
            case 'height':
                if (this.view) 
                {
                    this.view.width = this.width;
                    this.view.height = this.height;
                    this.dirtyRender = true;
                    this.propagateEvent(new Event('resize'), []);
                }
                break;
            case 'theme':
                this.applyTheme(this.theme);
                this.dirtyRender = true;
                break;
        }
    }

    private onViewMouseEvent(type:VisualMouseEventTypes, me:MouseEvent):void
    {
        let viewPt = new Point(me.clientX, me.clientY).subtract(cumulative_offset(this.view));
        
        let camera = this.cameras.test(viewPt);
        if (!camera) return;

        let modifiers = Modifiers.create(me);
        let surfacePt = camera.toSurfacePoint('view', viewPt);        
        let stack = this.test(surfacePt);
        let hoverVisual = this.tracker.get('hover');

        if (stack[0] != hoverVisual)
        {
            if (hoverVisual)
            {
                let evt = new VisualMouseEvent('mouseleave', hoverVisual, camera, surfacePt, me.button, modifiers);    
                this.propagateEvent(evt, [ hoverVisual ]);
            }

            this.tracker.set('hover', hoverVisual = stack[0] || null);

            if (hoverVisual)
            {
                let evt = new VisualMouseEvent('mouseenter', hoverVisual, camera, surfacePt, me.button, modifiers);    
                this.propagateEvent(evt, [ hoverVisual ]);
            }
        }

        let evt = new VisualMouseEvent(type, stack[0] || null, camera, surfacePt, me.button, modifiers);
        this.propagateEvent(evt, stack);
    }

    private onViewMouseDragEvent(me:MouseEvent, distance:Point):void
    {
        let viewPt = new Point(me.clientX, me.clientY).subtract(cumulative_offset(this.view));
        
        let camera = this.cameras.test(viewPt);
        if (!camera) return;

        let modifiers = Modifiers.create(me);
        let surfacePt = camera.toSurfacePoint('view', viewPt);        
        let stack = this.test(surfacePt);

        let evt = new VisualMouseDragEvent(stack[0] || null, camera, surfacePt, me.button, modifiers, distance);
        this.propagateEvent(evt, stack);
    }

    private onViewKeyEvent(type:VisualKeyboardEventTypes, ke:KeyboardEvent):void
    {
        ke.preventDefault();

        let key = ke.keyCode;
        let char = !!ke.which ? String.fromCharCode(ke.which) : null;
        let modifiers = Modifiers.create(ke);
        let stack = [] as Visual[];
        let hoverVisual = this.tracker.get('hover');

        let x = hoverVisual;
        while (!!x)
        {
            stack.push(x);
            x = x.parent;
        }

        let evt = new VisualKeyboardEvent(type, hoverVisual || null, key, char, modifiers);
        this.propagateEvent(evt, stack);
    }

    private onVisualCompose(e:VisualEvent)
    {
        this.dirtyRender = true;
        this.dirtySequence = true;
        this.sequence.invalidate(e.target);

        let visuals = [ e.target ].concat(e.target.toArray(true));
        this.applyTheme(this.theme, visuals);
    }

    private onVisualChange(e:VisualChangeEvent)
    {
        this.dirtyRender = true;

        if (e.property == 'classes' || e.property == 'traits')
        {
            let visuals = [ e.target ].concat(e.target.toArray(true));
            this.applyTheme(this.theme, visuals);
        }
    }

    private propagateEvent(se:Event, stack:Visual[]):void
    {
        this.emit(se);

        for (let i = 0; i < stack.length; i++)
        {
            if (se.canceled)
                break;

            let visual = stack[i];

            if (se.canceled)
                break;

            visual.emit( se);
        }
    }
}

function clamp(value:number):number
{
    return Math.round(value * 100) / 100;
}

function cumulative_offset(element:HTMLElement):Point
{
    let top = 0, left = 0;
    do 
    {
        left += element.offsetLeft || 0;
        top += element.offsetTop  || 0;
        element = element.offsetParent as HTMLElement;
    } 
    while(element);

    return new Point(left, top);
};

function set_transform(gfx:CanvasRenderingContext2D, mt:Matrix)
{
    gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
}