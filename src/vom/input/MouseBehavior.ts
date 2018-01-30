import { Point } from '../../geom/Point';
import { VoidCallback } from '../../common';
import { VisualMouseEvent } from '../events/VisualMouseEvent';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { KeyBehavior } from './KeyBehavior';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { MouseExpression } from './MouseExpression';
import { EventEmitter } from '../../base/EventEmitter';
import { Destroyable } from '../../base/Destroyable';


export type MouseEmitter = Surface|Visual|HTMLElement;

export class MouseGesture extends AbstractDestroyable
{
    public static for(object:MouseEmitter):MouseGesture
    {
        return new MouseGesture(object);
    }

    private constructor(private emitter:MouseEmitter)
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
            let subs = this.emitters.map(x => this.createListener(
                x, MouseExpression.parse(expr), callback));
    
            this.chain(...subs);
        }

        return this;
    }

    private createListener(target:EventEmitter, expr:MouseExpression, callback:any):Destroyable
    {
        return target.on(expr.event, (evt:VisualMouseEvent) =>
        {
            if (expr.matches(evt))
            {
                callback(evt);
            }
        });
    }
}