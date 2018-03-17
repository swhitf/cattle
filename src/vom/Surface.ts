import { Event } from '../base/Event';
import { KeyedSet } from '../base/KeyedSet';
import { Observable } from '../base/Observable';
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { cumulativeOffset } from '../misc/Dom';
import * as u from '../misc/Util';
import { BufferManager } from './BufferManager';
import { CameraManager } from './CameraManager';
import { CameraEvent } from './events/CameraEvent';
import { VisualChangeEvent } from './events/VisualChangeEvent';
import { VisualEvent } from './events/VisualEvent';
import { VisualKeyboardEvent, VisualKeyboardEventTypes } from './events/VisualKeyboardEvent';
import { VisualMouseDragEvent } from './events/VisualMouseDragEvent';
import { VisualMouseEvent, VisualMouseEventTypes } from './events/VisualMouseEvent';
import { DragHelper } from './input/DragHelper';
import { Modifiers } from './input/Modifiers';
import { InternalCameraManager } from './InternalCameraManager';
import { RefreshLoop } from './RefreshLoop';
import { Composition } from './rendering/Composition';
import { RootVisual } from './RootVisual';
import { Theme } from './styling/Theme';
import { Visual, VisualPredicate } from './Visual';
import * as vq from './VisualQuery';
import { VisualSequence } from './VisualSequence';
import { VisualTracker } from './VisualTracker';


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

interface VisualDirtyState
{
    visual:Visual;
    render?:boolean;
    theme?:boolean;
}

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

    @Observable(new Theme('Default'))
    public theme:Theme;

    private readonly sequence:VisualSequence;
    private readonly buffers:BufferManager;
    private readonly composition:Composition;

    private dirtyTheming:boolean;
    private dirtyRender:boolean;
    private dirtySequence:boolean;
    private dirtyStates:KeyedSet<VisualDirtyState>;
    private tracker:VisualTracker;

    constructor(width:number = 800, height:number = 800)
    {
        super();
        
        this.width = width;
        this.height = height;

        this.root = this.createRoot();
        this.view = this.createView();
        this.cameras = this.createCameraManager();        

        this.composition = new Composition();
        this.sequence = new VisualSequence(this.root);
        this.dirtyStates = new KeyedSet<VisualDirtyState>(x => x.visual.id);
        this.tracker = new VisualTracker();
 
        this.ticker = new RefreshLoop(60);
        this.ticker.add('render', () => this.render());
        this.ticker.start();
    }

    public get renderRequired():boolean
    {
        return this.dirtyRender || this.dirtySequence;
    }

    public render():void
    {
        if (this.dirtyTheming)
        {
            this.performThemeUpdates();
        }

        let didRender = false;

        if (this.dirtySequence)
        {
            this.sequence.update();
            this.dirtyRender = true;
        }   

        if (this.dirtyRender)
        {
            this.performCompositionUpdates();
            didRender = true;
        }

        this.dirtyRender = this.dirtySequence = false;
        this.dirtyStates.clear();

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

    private performThemeUpdates():void
    {
        const { composition, sequence, view, dirtyStates } = this;
        const visuals = new KeyedSet<Visual>(x => x.id);

        dirtyStates.forEach(st => 
        {
            if (st.theme)
            {
                visuals.addAll(st.visual.toArray());
            }
        });

        this.applyTheme(this.theme, visuals.array);
    }

    private performCompositionUpdates():void 
    {
        const { composition, sequence, view, dirtyStates } = this;

        //Only render to cameras with valid bounds
        const cameras = this.cameras.toArray()
            .filter(x => !!x.bounds.width && !!x.bounds.height)

        composition.beginUpdate();

        const rootRegion = composition.root;
        rootRegion.arrange(0, 0, this.width, this.height);

        for (const cam of cameras) 
        { 
            const camMat = Matrix.identity.translate(cam.vector.x, cam.vector.y).inverse();
            const camRegion = rootRegion.getRegion(`camera/${cam.id}`, 0);
            camRegion.arrange(cam.bounds);

            sequence.climb(visual => 
            {
                //If visual is not visible to the camera, clip out
                if (!cam.area.intersects(visual.absoluteBounds))
                {
                    return true;
                }

                if (visual.zIndex == 1)
                    return true;

                const zLayer = camRegion.getRegion(`zIndex/${visual.zIndex}`, visual.zIndex);
                zLayer.arrange(0, 0, cam.bounds.width, cam.bounds.height);

                const visElmt = zLayer.getElement(`visual/${visual.id}`, visual.zIndex);
                visElmt.debug = `${visual.type}/${visual.id}`;
                
                //If the visual is dirty, or element is new we need to update its element
                const state = dirtyStates.get(visual.id);

                const camVisMat = visual.transform.translate(-5, -5).multiply(camMat); //camera+visual transform
                visElmt.transform(camVisMat);
                visElmt.dim(visual.width + 10, visual.height + 10);

                if (visElmt.dirty || (!!state && state.render))
                {
                    visElmt.draw(gfx => {
                        console.log('visual.draw');
                        gfx.translate(5, 5);
                        visual.render(gfx);
                    });
                }

                return true;
            });
        }

        composition.endUpdate();
        composition.render(view);
    }

    private createCameraManager():InternalCameraManager
    {
        let cm = new InternalCameraManager();
        cm.create('main', 1, new Rect(0, 0, this.width, this.height), Point.empty);

        let callback = (e:CameraEvent) => {
            this.dirtyRender = true
        };

        cm.on('create', callback);
        cm.on('destroy', callback);
        cm.on('change', callback);

        return cm;
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
        view.style.display = 'block';
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
        let viewPt = new Point(me.clientX, me.clientY).subtract(cumulativeOffset(this.view));
        
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
        let viewPt = new Point(me.clientX, me.clientY).subtract(cumulativeOffset(this.view));
        
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
        //ke.preventDefault();

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
        this.dirtyTheming = true;

        this.dirtyStates.merge({ visual: e.target, render: true, theme: true });
        this.sequence.invalidate(e.target);
    }

    private onVisualChange(e:VisualChangeEvent)
    {
        this.dirtyStates.merge({ visual: e.target, render: true });
        this.dirtyRender = true;

        if (e.property == 'classes' || e.property == 'traits')
        {
            this.dirtyTheming = true;
            this.dirtyStates.merge({ visual: e.target, theme: true });
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

function setTransform(gfx:CanvasRenderingContext2D, mt:Matrix)
{
    gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
}