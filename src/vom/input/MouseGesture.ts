import { VisualMouseEvent } from '../events/VisualMouseEvent';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { KeyGesture } from './KeyGesture';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { MouseExpression } from './MouseExpression';
import { EventEmitter, EventSubscription } from '../../base/EventEmitter';


export interface MouseGestureCallback
{
    (e?:VisualMouseEvent):void;
}

export class MouseGesture extends AbstractDestroyable
{
    public static for(...objects:Array<Surface|Visual>):MouseGesture
    {
        return new MouseGesture(objects);
    }

    private subs:EventSubscription[] = [];

    private constructor(private emitters:EventEmitter[])
    {
        super();
    }

    public on(expressions:string|string[], callback:any):MouseGesture
    {
        if (!Array.isArray(expressions))
        {
            return this.on([expressions as string], callback);
        }

        for (let expr of expressions)
        {
            let es = this.emitters.map(x => this.createListener(
                x, MouseExpression.parse(expr), callback));
    
            this.subs = this.subs.concat(es);
        }

        return this;
    }

    private createListener(target:EventEmitter, expr:MouseExpression, callback:MouseGestureCallback):EventSubscription
    {
        return target.on(expr.event, (evt:VisualMouseEvent) =>
        {
            if (expr.matches(evt))
            {
                if (expr.exclusive)
                {
                    evt.cancel();
                }

                callback(evt);
            }
        });
    }
}

