import { Destroyable } from '../../base/Destroyable';
import { RefreshTicker } from '../RefreshLoop';
import { Visual } from '../Visual';


export interface AnimationBuilder<T extends Visual>
{
    //delay(forTime:number):AnimationBuilder<T>;

    every(intervalTime:number, callback:ContinuousAnimationCallback<T>):ContinuousAnimationBuilder<T>;

    over(tweenTime:number):TweenAnimationBuilder<T>;
}

export interface ContinuousAnimationBuilder<T extends Visual>
{
    every(interval:number, callback:ContinuousAnimationCallback<T>):ContinuousAnimationBuilder<T>;    

    get():Animation;
}

export interface ContinuousAnimationCallback<T extends Visual>
{
    (visual:T):boolean|void;
}

export interface TweenAnimationBuilder<T extends Visual>
{
    tween(from:number, to:number, callback:TweenAnimationCallback<T>):TweenAnimationBuilder<T>;    

    then():AnimationBuilder<T>;

    get():Animation;
}

export interface TweenAnimationCallback<T extends Visual>
{
    (visual:T, value:number):void;
}

export interface Animation
{
    cancel():void;
}

export abstract class Animate
{
    private constructor()
    {
    }

    public static visual<T extends Visual>(visual:T):AnimationBuilder<T>
    {
        return new AnimationBuilderImpl<T>(visual);
    }
}

class AnimationBuilderImpl<T extends Visual> implements AnimationBuilder<T>
{
    private animation:AnimationImpl;

    constructor(private visual:T)
    {
        if (!visual.isMounted())
        {
            throw 'Visual must be mounted before being animated.';   
        }

        this.animation = new AnimationImpl(visual);
        setTimeout(() => visual.surface.ticker.add('animation', this.animation), 0);
    }

    public every(intervalTime:number, callback:ContinuousAnimationCallback<T>):ContinuousAnimationBuilder<T>
    {
        let factory = (function(visual:T) 
        {
            let ellapsed = 0;
            return function(dt:number):void|boolean
            {
                ellapsed += (1000 * dt);
                if (ellapsed > intervalTime) {
                    ellapsed -= intervalTime;
                    return callback(visual) !== false;
                }
            };
        });

        this.animation.functions.push(factory(this.visual));
        return this;
    }

    public over(tweenTime:number):TweenAnimationBuilder<T>
    {
        throw 'Not implemented';
    }

    public get():Animation
    {
        return this.animation;
    }
}

interface AnimationFunction
{
    (dt:number):void|boolean;
}

class AnimationImpl implements RefreshTicker
{
    public functions:AnimationFunction[] = [];

    private stop:boolean = false;
    private visualSub:Destroyable;

    constructor(public visual:Visual)
    {
        let es = visual.parent.on('compose', () => 
        {
            if (!visual.isMounted())
            {
                this.cancel();
            }
        });
    }

    public tick(dt:number):boolean|void 
    {
        if (this.stop || this.functions.length == 0)
        {
            return false;
        }

        for (let f of this.functions)
        {
            if (f(dt) === false)
            {
                return false;
            }
        }
    }

    public cancel():void
    {
        if (this.visualSub)
        {
            this.visualSub.destroy();
            delete this.visualSub;
        }

        this.stop = true;
    }
}