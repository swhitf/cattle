import { Event } from '../base/Event';
import { Observable } from '../base/Observable';
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point, PointInput } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { BufferManager } from './BufferManager';
import { CameraManager } from './CameraManager';
import { VisualChangeEvent } from './events/VisualChangeEvent';
import { VisualEvent } from './events/VisualEvent';
import { VisualKeyboardEvent, VisualKeyboardEventTypes } from './events/VisualKeyboardEvent';
import { VisualMouseEvent, VisualMouseEventTypes } from './events/VisualMouseEvent';
import { KeyTracker } from './input/KeyTracker';
import { InternalCameraManager } from './InternalCameraManager';
import { RefreshLoop, RefreshTicker } from './RefreshLoop';
import { RootVisual } from './RootVisual';
import { DefaultTheme } from './styling/DefaultTheme';
import { Theme } from './styling/Theme';
import { Visual, VisualPredicate } from './Visual';
import { VisualSequence } from './VisualSequence';
import { VisualTracker } from './VisualTracker';
import * as u from '../misc/Util';
import * as vq from './VisualQuery';


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

    @Observable(0)
    public scrollLeft:number;

    @Observable(0)
    public scrollTop:number;

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
    private viewTransform:Matrix = Matrix.identity;

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
        let { buffers, cameras, sequence, view } = this;

        buffers.beginRender();

        sequence.climb(visual =>
        {
            let visBuf = buffers.getFor('visual', visual);
            let visGfx = visBuf.getContext('2d');

            visGfx.clearRect(0, 0, visBuf.width, visBuf.height);
            set_transform(visGfx, Matrix.identity.translate(5, 5));
            visual.render(visGfx);

            for (let i = 0; i < cameras.count; i++) 
            {
                let cam = cameras.item(i);
                let camBuf = buffers.getFor('camera', cam);
                let camGfx = camBuf.getContext('2d');
                let cvt = visual.transform.translate(-5, -5).multiply(cam.transform); //camera+visual transform

                camGfx.setTransform(cvt.a, cvt.b, cvt.c, cvt.d, cvt.e, cvt.f);
                camGfx.drawImage(visBuf, 0, 0, visBuf.width, visBuf.height, 0, 0, visBuf.width, visBuf.height);
            }

            return true;
        });

        let viewGfx = view.getContext('2d');
        set_transform(viewGfx, Matrix.identity);
        viewGfx.clearRect(0, 0, view.width, view.height);

        for (let i = 0; i < cameras.count; i++) 
        {
            let cam = cameras.item(i);
            let camBuf = buffers.getFor('camera', cam);
            
            set_transform(viewGfx, Matrix.identity.translate(cam.bounds.left, cam.bounds.top));
            viewGfx.drawImage(camBuf, 0, 0, camBuf.width, camBuf.height, 0, 0, camBuf.width, camBuf.height);
        }

        buffers.endRender();
    }

    private createCameraManager():InternalCameraManager
    {
        let cm = new InternalCameraManager();
        cm.create('main', 1, new Rect((this.width / 2) / 2, (this.height / 2) / 2, this.width / 2, this.height / 2), Point.empty);

        let callacbk = () => this.dirtyRender = true;
        cm.on('create', callacbk);
        cm.on('destroy', callacbk);
        cm.on('change', callacbk);

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
        
        let keys = new KeyTracker(window);
        view.addEventListener('mousedown', this.onViewMouseEvent.bind(this, 'mousedown', keys));
        view.addEventListener('mousemove', this.onViewMouseEvent.bind(this, 'mousemove', keys));
        view.addEventListener('mouseup', this.onViewMouseEvent.bind(this, 'mouseup', keys));
        view.addEventListener('click', this.onViewMouseEvent.bind(this, 'click', keys));
        view.addEventListener('dblclick', this.onViewMouseEvent.bind(this, 'dblclick', keys));
        view.addEventListener('keydown', this.onViewKeyEvent.bind(this, 'keydown', keys));
        view.addEventListener('keyup', this.onViewKeyEvent.bind(this, 'keyup', keys));

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
            case 'scrollLeft':
            case 'scrollTop':
                this.viewTransform = Matrix.identity.translate(this.scrollLeft, this.scrollTop).inverse();
                this.dirtyRender = true;
                this.propagateEvent(new Event('scroll'), []);
                break;
            case 'theme':
                this.applyTheme(this.theme);
                this.dirtyRender = true;
                break;
        }
    }

    private onViewMouseEvent(type:VisualMouseEventTypes, keyTracker:KeyTracker, me:MouseEvent):void
    {
        let viewPt = new Point(me.clientX, me.clientY).subtract(cumulative_offset(this.view));
        
        let camera = this.cameras.test(viewPt);
        if (!camera) return;

        let surfacePt = camera.toSurfacePoint('view', viewPt);        
        let keys = keyTracker.capture();
        let stack = this.test(surfacePt);
        let hoverVisual = this.tracker.get('hover');

        if (stack[0] != hoverVisual)
        {
            if (hoverVisual)
            {
                let evt = new VisualMouseEvent('mouseleave', hoverVisual, camera, surfacePt, me.button, keys);    
                this.propagateEvent(evt, [ hoverVisual ]);
            }

            this.tracker.set('hover', hoverVisual = stack[0] || null);

            if (hoverVisual)
            {
                let evt = new VisualMouseEvent('mouseenter', hoverVisual, camera, surfacePt, me.button, keys);    
                this.propagateEvent(evt, [ hoverVisual ]);
            }
        }

        let evt = new VisualMouseEvent(type, stack[0] || null, camera, surfacePt, me.button, keys);
        this.propagateEvent(evt, stack);
    }

    private onViewKeyEvent(type:VisualKeyboardEventTypes, keyTracker:KeyTracker, ke:KeyboardEvent):void
    {
        let key = ke.keyCode;
        let keys = keyTracker.capture();
        let stack = [] as Visual[];
        let hoverVisual = this.tracker.get('hover');

        let x = hoverVisual;
        while (!!x)
        {
            stack.push(x);
            x = x.parent;
        }

        let evt = new VisualKeyboardEvent(type, hoverVisual || null, key, keys);
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