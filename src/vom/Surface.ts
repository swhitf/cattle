import { Event } from '../base/Event';
import { KeyedSet } from '../base/KeyedSet';
import { Observable } from '../base/Observable';
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { cumulativeOffset } from '../misc/Dom';
import { CameraManager } from './CameraManager';
import { CameraChangeEvent } from './events/CameraChangeEvent';
import { VisualChangeEvent } from './events/VisualChangeEvent';
import { VisualComposeEvent } from './events/VisualComposeEvent';
import { VisualKeyboardEvent, VisualKeyboardEventTypes } from './events/VisualKeyboardEvent';
import { VisualMouseDragEvent } from './events/VisualMouseDragEvent';
import { VisualMouseEvent, VisualMouseEventTypes } from './events/VisualMouseEvent';
import { DragHelper } from './input/DragHelper';
import { Keys } from './input/Keys';
import { Modifiers } from './input/Modifiers';
import { InternalCameraManager } from './InternalCameraManager';
import { RefreshLoop } from './RefreshLoop';
import { Composition, CompositionRegion } from './rendering/Composition';
import { Report } from './rendering/Report';
import { Composition2 } from './rendering2/Composition2';
import { TileRef } from './rendering2/TileRef';
import { TilingStrategy } from './rendering2/TilingStrategy';
import { RootVisual } from './RootVisual';
import { Theme } from './styling/Theme';
import { Visual } from './Visual';
import { VisualCallback } from './VisualList';
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

interface ObjectDirtyState
{
    object:any;
    transform?:boolean;
    //size?:boolean;
    render?:boolean;
    theme?:boolean;
}

interface DirtyState
{
    transform?:boolean;
    render?:boolean;
    theme?:boolean;
}

const PreventKeyList = [
    Keys.LEFT_ARROW,
    Keys.RIGHT_ARROW,
    Keys.UP_ARROW,
    Keys.DOWN_ARROW,
    Keys.TAB,
];

export class Surface extends SimpleEventEmitter
{
    public readonly cameras:CameraManager;
    public readonly root:Visual;
    public readonly ticker:RefreshLoop;
    public readonly view:HTMLCanvasElement;

    @Observable()
    public background:string = 'white';

    @Observable()
    public width:number;

    @Observable()
    public height:number;

    @Observable(new Theme('Default'))
    public theme:Theme;

    private readonly sequence:VisualSequence;
    private readonly composition:Composition;
    private readonly composition2:Composition2;
    private readonly dragSupport:DragHelper;

    private destroyed:boolean;    
    private _dirtyRender:boolean;
    private dirtySequence:boolean;
    private dirtyTheming:boolean;
    private themeQueue = new KeyedSet<Visual>(x => x.id);
    private tracker:VisualTracker;

    private get dirtyRender() { return this._dirtyRender; }
    private set dirtyRender(x:boolean) { 
        // if (x){
        //     console.log('dirtyRender', x);
        // }
        this._dirtyRender = x;
    }

    constructor(width:number = 800, height:number = 800)
    {
        super();
        
        this.width = width;
        this.height = height;

        this.root = this.createRoot();
        this.view = this.createView();
        this.cameras = this.createCameraManager();        

        this.dragSupport = new DragHelper(this.view, this.onViewMouseDragEvent.bind(this));

        this.composition = new Composition();
        this.composition2 = new Composition2();
        this.sequence = new VisualSequence(this.root);
        this.tracker = new VisualTracker();
 
        this.ticker = new RefreshLoop(60);
        this.ticker.add('render', () => this.render());
        this.ticker.start();
    }

    public get renderRequired():boolean
    {
        return this.dirtyRender || this.dirtySequence || this.dirtyTheming;
    }

    public destroy():void
    {
        if (this.destroyed)
        {
            throw new Error('Surface already destroyed.');
        }

        this.ticker.destroy();
        this.view.parentElement.removeChild(this.view);
        this.dragSupport.destroy();

        const cleanup = ['cameras', 'root', 'ticker', 'view', 'composition', 'sequence', 'dragSupport'];
        cleanup.forEach(x => this[x] = null);
    }

    public render():void
    {
        Report.begin();

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
            //this.performCompositionUpdates2();
            didRender = true; 
        }

        this.dirtyRender = this.dirtySequence = this.dirtyTheming = false;

        if (didRender)
        {
            Report.complete();
            this.propagateEvent(new Event('render'), []);
        }
    }

    public query(selector:string):Visual[]
    {
        return vq.select(this.sequence.all, selector);
    }

    public test(surfacePt:Point, filter?:VisualCallback<boolean>):Visual[]
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
        const { theme, themeQueue } = this;

        const ptt = Report.time('Theme.Update');

        const toRoot = (v:Visual) => {
            const list = [];
            while (v.parent != null)
            {
                list.push(v.parent);
                v = v.parent;
            }
            return list;
        };

        const list = themeQueue.array.slice(0);
        list.forEach(x => toRoot(x).forEach(v => themeQueue.add(v)));

        this.applyTheme(theme, themeQueue.array);

        //Clear the theme queue
        themeQueue.clear();

        ptt();
    }

    private performCompositionUpdates():void 
    {
        const cpt = Report.time('Composition.Prepare');

        const { composition, sequence, view } = this;

        //Only render to cameras with valid bounds
        const cameras = this.cameras.toArray()
            .filter(x => !!x.bounds.width && !!x.bounds.height)

        composition.baseColor = this.background;

        composition.beginUpdate();

        const rootRegion = composition.root;
        rootRegion.arrange(new Rect(0, 0, this.width, this.height));

        for (const cam of cameras) 
        { 
            const camMat = Matrix.identity.translate(cam.vector.x, cam.vector.y).inverse();
            const camState = cam['__dirty'] as DirtyState;
            const camRegion = rootRegion.getRegion(cam.id, 0);
            camRegion.arrange(cam.bounds);

            //Rely on the knowledge that visuals will be in zIndex order, so we can get once and
            //keep until the id does not match
            let zLayer = null as CompositionRegion;

            sequence.climb(visual => 
            {
                //If visual is not visible to the camera, clip out
                if (!cam.area.intersects(visual.absoluteBounds))
                {
                    return true;
                }

                // if (visual.zIndex < 1) return true;
                // if (visual.classes.has('input')) return true;

                const visualState = visual['__dirty'] as DirtyState;

                //If no zLayer or id does not match zIndex, obtain layer
                if (!zLayer || zLayer.id != visual.zIndex.toString())
                {
                    zLayer = camRegion.getRegion(visual.zIndex.toString(), visual.zIndex);
                    //If new, arrange...
                    if (zLayer.age == 0)
                    {
                        zLayer.arrange(new Rect(0, 0, cam.bounds.width, cam.bounds.height));
                    }
                }

                //Obtain element for visual
                const elmt = zLayer.getElement(visual.id, visual.zIndex);

                //Update element transform if new, camera has moved or visual has moved
                if (elmt.age == 0 || (!!visualState && visualState.transform) || (!!camState && camState.transform))
                {
                    const camVisMat = visual.transform.translate(-5, -5).multiply(camMat); //camera+visual transform
                    const xy = camVisMat.apply(Point.empty);

                    elmt.arrange(new Rect(xy.left, xy.top, visual.width + 10, visual.height + 10));
                }
                
                //Finally, if our element is dirty or the visual needs redrawing, redraw
                if (elmt.dirty || (!!visualState && visualState.render))
                {
                    Report.time('Element.Draw', () => {
                        elmt.draw(gfx => {
                            gfx.translate(5, 5);
                            visual.render(gfx);
                        });
                    });
                }

                visual['__dirty'] = {};
                return true;
            });
        }

        composition.endUpdate();
        cpt();

        const cdt = Report.time('Composition.Draw');
        composition.render(view);
        cdt();
    }

    private performCompositionUpdates2():void 
    {
        const { composition2, sequence, view } = this;
        const tiling = new TilingStrategy();
        
        const $cp = Report.time('Composition.Prepare');

        //Only render to cameras with valid bounds
        const cameras = this.cameras.toArray()
            .filter(x => !!x.bounds.width && !!x.bounds.height);

        //Determine the tiles we need to render across all cameras
        const camTiles = KeyedSet.create(
            [].concat(...cameras.map(x => tiling.for(x.area))) as TileRef[],
            x => x.s
        );

        Report.time('Composition.BeginUpdate', () => composition2.beginUpdate());

        camTiles.forEach(x => Report.time('Composition.AllocTile', () => this.composition2.tile(x)));
        
        sequence.climb(visual => 
        {
            const visTiles = tiling.for(visual.absoluteBounds);
            
            //If the tiles this visual appears in are not in the camTiles, we don't need to render this visual
            if (!camTiles.hasAny(visTiles)) return true;

            //Get object describing dirty state of visual
            const visualState = (visual['__dirty'] || {}) as DirtyState;

            //Get (allocate or recycle) element for visual
            const $ea = Report.time('Element.Alloc');
            const elmt = composition2.element(visual.id, visual.zIndex);
            $ea();

            //Compute global element bounds by inflating the visual.absoluteBounds; inflation prevents clipping of
            //borders or other decoration outside of the visual bounds
            Report.time('Element.Arrange', () => elmt.arrange(visual.absoluteBounds.inflate([5, 5])));

            //If element is invalid or visual needs redrawing, then redraw
            if (elmt.invalid || visualState.render)
            {
                Report.time('Element.Draw', () => 
                    elmt.draw(gfx => {
                        gfx.translate(5, 5);
                        visual.render(gfx)
                    })
                );
            }

            visual['__dirty'] = {};
            return true;
        });

        Report.time('Composition.EndUpdate', () => composition2.endUpdate());
        $cp();
        
        const cdt = Report.time('Composition.Draw');
        for (let c of cameras) 
        {
            composition2.render(view, c.bounds, c.vector);
        }
        cdt();
    }

    private createCameraManager():InternalCameraManager
    {
        let cm = new InternalCameraManager();
        cm.create('main', 1, new Rect(0, 0, this.width, this.height), Point.empty);

        cm.on('create', () => this.dirtyRender);
        cm.on('destroy', () => this.dirtyRender);

        cm.on('change', (e:CameraChangeEvent) => {

            const ds = { object: e.target } as ObjectDirtyState;

            if (e.property == 'vector' || e.property == 'bounds')
            {
                e.target['__dirty'].transform = true;
            }
            // else if (e.property == 'bounds')
            // {
            //     ds.size = true;
            // }

            this.dirtyRender = true;
        });

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
                    // if (!Reflect.getMetadata(`cattle:styleable:${key}`, v))
                    // {
                    //     throw `${key} is not styleable on visual type ${v.type}.`;
                    // }

                    visualStyle[key] = style.props[key];
                }
            }
        }

        for (let v of visuals)
        {
            v['visualStyleDidChange']();
        }
    }

    private notifyChange(property:string):void
    {
        switch (property) {
            // case 'background':
            //     this.dirtyRender = true;
            //     break;
            case 'width':
            case 'height':
                if (this.view) 
                {
                    this.view.width = this.width;
                    this.view.height = this.height;
                    this.dirtyRender = true;
                    this.composition.reset();
                    this.propagateEvent(new Event('resize'), []);
                }
                break;
            case 'theme':
                this.applyTheme(this.theme);
                this.dirtyRender = true;
                this.composition.reset();
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

    private onViewMouseDragEvent(me:MouseEvent, source:HTMLElement, distance:Point):void
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
        if (!!~PreventKeyList.indexOf(ke.keyCode))
        {
            ke.preventDefault();
        }

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

    private onVisualCompose(e:VisualComposeEvent)
    {
        this.dirtyRender = true;
        this.dirtySequence = true;
        this.dirtyTheming = true;

        const ds = { render: true, theme: true };
        const { target, subject } = e;
       
        Object.assign(subject['__dirty'], ds);
        this.themeQueue.add(subject);

        subject.visit(x => {
            Object.assign(x['__dirty'], ds);
            this.themeQueue.add(x);
        });        
        
        this.sequence.invalidate(target);
    }

    private onVisualChange(e:VisualChangeEvent)
    {
        const target = e.target;
        const ds = {} as DirtyState;

        if (e.property == 'topLeft' || e.property == 'size')
        {
            ds.transform = true;
        }
        else if (e.property == 'classes' || e.property == 'traits')
        {
            ds.render = true;
            ds.theme = true;
            
            this.dirtyTheming = true;
            this.themeQueue.add(target);
        }
        else if (e.property == 'zIndex')
        {
            this.sequence.invalidate(target);
        }
        else
        {
            ds.render = true;
        }

        this.dirtyRender = true;

        Object.assign(target['__dirty'], ds);
        target.visit(x => {
            Object.assign(x['__dirty'], ds);
            if (ds.theme) {
                this.themeQueue.add(x);
            }
        });
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