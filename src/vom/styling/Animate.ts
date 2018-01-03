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
}

export interface ContinuousAnimationCallback<T extends Visual>
{
    (visual:T):boolean|void;
}

export interface TweenAnimationBuilder<T extends Visual>
{
    tween(from:number, to:number, callback:TweenAnimationCallback<T>):TweenAnimationBuilder<T>;    

    then():AnimationBuilder<T>;
}

export interface TweenAnimationCallback<T extends Visual>
{
    (visual:T, value:number):void;
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
    private animation:Animation;

    constructor(private visual:T)
    {
        if (!visual.isMounted())
        {
            throw 'Visual must be mounted before being animated.';   
        }

        this.animation = new Animation(visual);
        setTimeout(() => visual.surface.ticker.add(this.animation), 0);
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
}

interface AnimationFunction
{
    (dt:number):void|boolean;
}

class Animation implements RefreshTicker
{
    public functions:AnimationFunction[] = [];
    public stop:boolean = false;

    constructor(public visual:Visual)
    {
        let es = visual.parent.on('compose', () => 
        {
            if (!visual.isMounted())
            {
                es.destroy();
                this.stop = true;
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
}