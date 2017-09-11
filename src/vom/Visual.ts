import { index, values } from '../misc/Util';
import { toggle } from '../misc/Dom';
import { Animate, AnimationBuilder } from './styling/Animate';
import { SimpleEventEmitter } from '../eventing/SimpleEventEmitter';
import { Rect } from '../geom/Rect';
import { property } from '../misc/Property';
import { ChangeEvent } from './events/ChangeEvent';
import { ComposeEvent } from './events/ComposeEvent';
import { VisualEvent } from './events/VisualEvent';
import { Styleable } from './styling/Styleable';
import { Surface } from './Surface';
import * as u from '../misc/Util';
import { Point } from "../geom/Point";
import { Matrix } from "../geom/Matrix";


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
    public readonly id:number = IdSeed++;
    public readonly classes:VisualTagSet;
    public readonly traits:VisualTagSet;

    protected readonly children:Visual[] = [];
    protected parentVisual:Visual;
    
    private cacheData:any = {};
    private storeData:any = {};

    constructor(bounds:Rect = Rect.empty, children:Visual[] = [])
    {
        super();

        this.classes = new VisualTagSetImpl(this, 'classes');
        this.traits = new VisualTagSetImpl(this, 'traits');
        this.topLeft = bounds.topLeft();
        this.size = bounds.size();

        if (children && children.length)
        {
            this.mount(...children);
        }
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
        return this.cache('transform', () => {
            var t = !!this.parent ? this.parent.transform : Matrix.identity;
            return t.translate(this.left, this.top);
        });
    }

    public get transformLocal():Matrix
    {
        return this.cache('transformLocal', () => Matrix.identity.translate(this.left, this.top));
    }

    public get childCount():number
    {
        return this.children.length;
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

    public mount(...visuals:Visual[]):void
    {
        if (visuals.some(x => !!x.parentVisual))
        {
            throw `One or more visuals is already mounted somewhere else.`;
        }

        for (let v of visuals)
        {
            this.children.push(v);
            v.parentVisual = this;
        }
    
        this.notifyCompose();
    }

    public unmount(child:Visual):boolean
    {
        let idx = this.children.indexOf(child);
        if (idx < 0)
        {
            return false;
        }
        
        this.children.splice(idx, 1);
        child.parentVisual = null;
        
        this.notifyCompose();
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
        let arr = this.children.slice(0);

        if (recursive)
        {
            for (let c of this.children)
            {
                arr = arr.concat(c.toArray(true));
            }
        }

        return arr;
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

    protected notify(event:VisualEvent, bubble:boolean = true):void
    {
        if (!this.isMounted())
            return;

        if (event.target == this)
        {
            this.emit('!' + event.type, event);
        }

        if (!event.canceled)
        {
            this.emit(event.type, event);

            if (bubble && this.parentVisual && !event.canceled)
            {
                this.parentVisual.notify(event, bubble);
            }
        }
    }

    protected notifyChange(property:string):void
    {
        this.clearCache();

        if (property === 'zIndex' && !!this.parentVisual)
        {
            this.parentVisual.notifyCompose();
        }

        this.notify(new ChangeEvent(this, property));
    }

    protected notifyCompose():void
    {
        this.notify(new ComposeEvent(this));
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
            arr.push(this.values[key]);
        }

        return arr;
    }
}