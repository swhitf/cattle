import { Point } from '../../geom/Point';
import { Rect } from '../../geom/Rect';
import { EventEmitterBase } from '../internal/EventEmitter';


export abstract class Visual extends EventEmitterBase
{
    protected parentVisual:Visual;

    private children:Visual[] = [];
    private cacheData:any = {};
    private stateData:any = {};
    private randomData:any = {};

    constructor(bounds:Rect = Rect.empty, children:Visual[] = [])
    {
        super();

        this.stateData.position = bounds.topLeft();
        this.stateData.size = bounds.size();

        if (children && children.length)
        {
            this.mount(...children);
        }
    }

    public toString():string
    {
        return `${this.constructor['name']} ${this.left}x${this.top} ${this.width}:${this.height}`;
    }

    //region Abstract

    public abstract get type():string;

    public abstract render(gfx:CanvasRenderingContext2D):void;

    //endregion

    //region Framework

    public data(key:string, value?:any):any
    {
        let was = this.randomData[key];
        
        if (arguments.length > 1)
        {
            if (value === undefined)
            {
                delete this.randomData[key];
            }
            else
            {
                this.randomData[key] = value;
            }
        }

        return was;
    }

    protected get state():Readonly<any>
    {
        return this.stateData;
    }

    protected cache<T>(key:string, getter:() => T):T
    {
        if (this.cacheData[key] !== undefined)
        {
            return this.cacheData[key] as T;
        }

        return (this.cacheData[key] = getter()) as T;
    }

    protected get<T>(stateProp:string):T
    {
        return this.stateData[stateProp];
    }

    protected set<T>(stateProp:string, value:T):void
    {
        this.stateData[stateProp] = value;
        this.notify('invalidated', this);
    }

    protected update(mutator:(state:any) => void):void
    {
        mutator(this.stateData);
        this.notify('invalidated', this);
    }

    protected notify(event:string, subject:Visual, clearCache:boolean = true):void
    {
        if (clearCache)
        {
            this.cacheData = {};
        }

        if (this.parentVisual)
        {
            this.parentVisual.notify(event, subject);
        }

        this.emit(event, this);
        this.emit('changed', this);
    }

    //endregion
    
    //region Physicality

    public get left():number
    {
        return this.stateData.position.x;
    }

    public set left(value:number)
    {
        this.setPosition(value, this.top);
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
        return this.stateData.position.y;
    }

    public set top(value:number)
    {
        this.setPosition(this.left, value);
    }

    public get bottom():number
    {
        return this.top + this.height;
    }

    public set bottom(value:number)
    {
        this.top = value - this.height;
    }

    public get z():number
    {
        return this.stateData.zValue;
    }

    public set z(value:number)
    {
        this.setZ(value);
    }

    public get width():number
    {
        return this.stateData.size.x;
    }

    public set width(value:number)
    {
        this.setSize(value, this.height);
    }

    public get height():number
    {
        return this.stateData.size.y;
    }

    public set height(value:number)
    {
        this.setSize(this.width, value);
    }

    public get rotation():number
    {
        return this.stateData.rotation;
    }

    public set rotation(value:number)
    {
        this.setRotation(value);
    }

    public get center():Point
    {
        return this.stateData.position.add([this.width / 2, this.height / 2]);
    }

    public set center(value:Point)
    {
        this.setPosition(value.x - this.width / 2, value.y - this.width / 2);
    }

    public get topLeft():Point
    {
        return this.stateData.position;
    }

    public set topLeft(value:Point)
    {
        this.setPosition(value.x, value.y);
    }

    public get size():Point
    {
        return this.stateData.size;
    }

    public set size(value:Point)
    {
        this.setSize(value.x, value.y);
    }

    public get bounds():Rect
    {
        return this.cache('bounds', () => Rect.fromEdges(this.left, this.top, this.right, this.bottom));
    }

    // public localTransform():Matrix
    // {
    //     return Matrix.identity
    //         .translate(this.left, this.top)
    //         .translate(this.width / 2, this.height / 2)
    //         .rotate(this.rotation, AngleUnits.Degrees)
    //         .translate(this.width / -2, this.height / -2);
    // }

    // public transform():Matrix
    // {
    //     let m = Matrix.identity;

    //     if (!!this.parentVisual)
    //     {
    //         m = this.parentVisual.transform();
    //     }

    //     return m.multiply(this.localTransform());
    // }

    protected setPosition(x:number, y:number, silent:boolean = false):void
    {
        this.stateData.position = new Point(x, y);
        this.stateData.auto = null;

        if (!silent)
        {
            this.notify('invalidated', this);
        }
    }

    protected setSize(w:number, h:number, silent:boolean = false):void
    {
        this.stateData.size = new Point(w, h);
        this.stateData.auto = null;

        if (!silent)
        {
            this.notify('invalidated', this);
        }
    }

    protected setRotation(rotation:number, silent:boolean = false):void
    {
        this.stateData.rotation = rotation;
        this.stateData.auto = null;

        if (!silent)
        {
            this.notify('invalidated', this);
        }
    }
    
    protected setZ(z:number, silent:boolean = false):void
    {
        this.stateData.zValue = z;
        
        if (!silent && !!this.parentVisual)
        {
            this.notify('arranged', this);
        }
    }

    //endregion
    
    //region Composition

    public get childCount():number
    {
        return this.children.length;
    }

    public get parent():Visual
    {
        return this.parentVisual;
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

        this.notify('arranged', this);
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
        
        this.notify('arranged', this);
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

    public toArray():Visual[]
    {
        return this.children.slice(0);
    }
}