import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Matrix } from '../geom/Matrix';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { toggle } from '../misc/Dom';
import { index, values } from '../misc/Util';
import { VisualChangeEvent } from './events/VisualChangeEvent';
import { VisualComposeEvent } from './events/VisualComposeEvent';
import { VisualEvent } from './events/VisualEvent';
import { Animate, AnimationBuilder } from './styling/Animate';
import { Styleable } from './styling/Styleable';
import { Surface } from './Surface';
import { VisualCallback, VisualIteratorCallback, VisualList } from './VisualList';


var IdSeed:number = Math.floor(Math.random() * (new Date().getTime() / 1000));

export interface VisualTagSet
{
    readonly length:number;

    item(index:number):string;

    has(trait:string):boolean;

    add(trait:string):VisualTagSet;

    remove(trait:string):VisualTagSet;

    toggle(trait:string):VisualTagSet;

    set(trait:string, value:boolean):VisualTagSet;

    toArray():string[];
}

export abstract class Visual extends SimpleEventEmitter implements Visual
{
    public readonly id:string = 'v' + (IdSeed++);
    public readonly classes:VisualTagSet;
    public readonly traits:VisualTagSet;

    protected readonly children:VisualList = new VisualList();
    protected parentVisual:Visual;
    
    private cacheData:any = {};
    private storeData:any = {};

    private __dirty = {} as any;
    private __state = {} as any;
    private __style = {} as any;    

    constructor(bounds:Rect = Rect.empty)
    {
        super();

        this.classes = new VisualTagSetImpl(this, 'classes');
        this.traits = new VisualTagSetImpl(this, 'traits');
        this.topLeft = bounds.topLeft();
        this.size = bounds.size();
    }

    public abstract get canHost():boolean;

    public abstract get type():string;

    public abstract render(gfx:CanvasRenderingContext2D):void;

    @Styleable(Point.empty)
    public topLeft:Point;

    @Styleable(Point.empty)
    public size:Point;

    @Styleable(0)
    public zIndex:number;

    public get left():number
    {
        return this.topLeft.x;
    }

    public set left(value:number)
    {
        this.topLeft = new Point(value, this.top);
    }

    public get right():number
    {
        return this.left + this.width;
    }

    public set right(value:number)
    {
        this.left = value - this.width;
    }

    public get top():number
    {
        return this.topLeft.y;
    }

    public set top(value:number)
    {
        this.topLeft = new Point(this.left, value);
    }

    public get bottom():number
    {
        return this.top + this.height;
    }

    public set bottom(value:number)
    {
        this.top = value - this.height;
    }

    public get width():number
    {
        return this.size.x;
    }

    public set width(value:number)
    {
        this.size = new Point(value, this.height);
    }

    public get height():number
    {
        return this.size.y;
    }

    public set height(value:number)
    {
        this.size = new Point(this.width, value);
    }

    public get center():Point
    {
        return this.topLeft.add([this.width / 2, this.height / 2]);
    }

    public set center(value:Point)
    {
        this.topLeft = new Point(value.x - this.width / 2, value.y - this.width / 2);
    }

    public get bounds():Rect
    {
        return this.cache('bounds', () => Rect.fromEdges(this.left, this.top, this.right, this.bottom));
    }

    public get absoluteBounds():Rect
    {
        return this.cache('absolute', () => 
        {
            let tl = this.transform.apply(Point.empty);
            return new Rect(tl.x, tl.y, this.width, this.height);
        });
    }    

    public get transform():Matrix
    {
        // return this.cache('transform', () => {
            var t = !!this.parent ? this.parent.transform : Matrix.identity;
            return t.translate(this.left, this.top);
        // });
    }

    public get transformLocal():Matrix
    {
        return this.cache('transformLocal', () => Matrix.identity.translate(this.left, this.top));
    }

    public get childCount():number
    {
        return this.children.size;
    }

    public get parent():Visual
    {
        return this.parentVisual;
    }

    public get root():Visual
    {
        return !!this.surface ? this.surface.root : null;
    }

    public get surface():Surface
    {
        return !!this.parentVisual ? this.parentVisual.surface : null;
    }

    public animate():AnimationBuilder<this>
    {
        return Animate.visual(this);
    }

    public data(key:string, value?:any):any
    {
        let was = this.storeData[key];
        
        if (arguments.length > 1)
        {
            if (value === undefined)
            {
                delete this.storeData[key];
            }
            else
            {
                this.storeData[key] = value;
            }
        }

        return was;
    }
    
    public isMounted():boolean
    {
        return !!this.parentVisual ? this.parentVisual.isMounted() : false;
    }

    public mount(child:Visual):void
    {
        if (!!child.parentVisual)
        {
            throw `Visual is already mounted somewhere else.`;
        }

        child.visualWillMount();

        this.children.add(child);
        child.parentVisual = this;

        child.visualDidMount();
    
        this.notifyCompose(child, 'mount');
    }

    public unmount(child:Visual):boolean
    {
        if (!this.children.contains(child))
        {
            return false;
        }

        child.visualWillUnmount();
        
        this.children.remove(child);
        child.parentVisual = null;
        
        this.notifyCompose(child, 'mount');
        return true;
    }
    
    public mountTo(to:Visual):void
    {
        to.mount(this);
    }
    
    public unmountSelf():void
    {
        if (this.parentVisual)
        {
            this.parentVisual.unmount(this);
        }
        else
        {
            throw 'Visual is not mounted.';
        }        
    }

    public toArray(recursive:boolean = false):Visual[]
    {
        let arr = [] as Visual[];

        this.children.forEach(x => 
        {
            arr.push(x);
            if (recursive) 
            {
                arr = arr.concat(x.toArray(recursive));
            }
        });
        
        return arr;
    }

    public map<T>(callback:VisualIteratorCallback<T>):T[]
    {
        return this.children.map(callback);
    }

    public filter(callback:VisualIteratorCallback<boolean>):Visual[]
    {
        return this.children.filter(callback);
    }

    public visit(callback:VisualCallback):void
    {
        this.children.forEach(x => 
        {
            callback(x);
            x.visit(callback);
        });
    }

    public toString():string
    {
        return `${this.constructor['name']} ${this.left}x${this.top} ${this.width}:${this.height}`;
    }

    protected cache<T>(key:string, getter:() => T):T
    {
        if (this.cacheData[key] !== undefined)
        {
            return this.cacheData[key] as T;
        }

        return (this.cacheData[key] = getter()) as T;
    }

    protected clearCache():void
    {
        this.cacheData = {};
    }

    protected visualWillMount():void
    {

    }

    protected visualDidMount():void
    {

    }

    protected visualWillUnmount():void
    {

    }

    protected visualStyleDidChange():void
    {

    }

    protected notify(evt:VisualEvent, bubble:boolean = true):void
    {
        if (!this.isMounted())
            return;

        if (!evt.canceled)
        {
            this.emit(evt);

            if (bubble && this.parentVisual && !evt.canceled)
            {
                this.parentVisual.notify(evt, bubble);
            }
        }
    }

    protected notifyChange(property:string):void
    {
        this.clearCache();

        this.notify(new VisualChangeEvent(this, property));
    }

    protected notifyCompose(child:Visual, mode:'mount'|'unmount'):void
    {
        this.notify(new VisualComposeEvent(this, child, mode));
    }
}

class VisualTagSetImpl implements VisualTagSet
{
    private count:number = 0;
    private values:any = {};

    constructor(private owner:Visual, private property:string)
    {
    }

    public get length():number
    {
        return this.values
    }

    public item(index:number):string
    {
        return this.values[index];
    }

    public add(trait:string):VisualTagSet 
    {
        this.count++;
        this.values[trait] = true;
        this.owner['notifyChange'](this.property);
        return this;
    }

    public remove(trait:string):VisualTagSet 
    {
        if (this.has(trait))
        {
            this.count--;
            delete this.values[trait];
            this.owner['notifyChange'](this.property);
        }
        return this;
    }

    public toggle(trait:string):VisualTagSet 
    {
        return this.set(trait, !this.has(trait));
    }

    public has(trait:string):boolean
    {
        return !!this.values[trait];
    }

    public set(trait:string, value:boolean):VisualTagSet 
    {
        if (value)
        {
            return this.add(trait);
        }
        else
        {
            return this.remove(trait);
        }
    }

    public toArray():string[] 
    {
        let arr = [] as string[];

        for (let key in this.values)
        {
            if (this.values[key])
            {
                arr.push(key);
            }
        }

        return arr;
    }

    public toString():string
    {
        return this.toArray().join(' ');
    }
}