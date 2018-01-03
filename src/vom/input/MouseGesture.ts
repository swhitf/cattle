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


export interface MouseGestureCallback<T extends VisualMouseEvent>
{
    (e?:T):void;
}

export class MouseGesture extends AbstractDestroyable
{
    public static for(...objects:Array<Surface|Visual>):MouseGesture
    {
        return new MouseGesture(objects);
    }

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

// class RegularListener extends AbstractDestroyable 
// {
//     constructor(target:EventEmitter, expr:MouseExpression, callback:any)
//     {
//         super(); 

//         let es = target.on(expr.event, (evt:VisualMouseEvent) =>
//         {
//             if (expr.matches(evt))
//             {
//                 if (expr.exclusive)
//                 {
//                     evt.cancel();
//                 }

//                 callback(evt);
//             }
//         });
        
//         this.chain(es);
//     }
// }

// class DragListener implements EventSubscription
// {
//     private start:Point;

//     public cancel:VoidCallback;

//     constructor(target:EventEmitter, expr:MouseExpression, private callback:MouseGestureCallback)
//     {
//         let es = target.on('mousedown', (evt:VisualMouseEvent) =>
//         {
//             evt.native
//         });
        
//         this.cancel = es.cancel;
//     }

//     private hijack():void
//     {
//         const mm = (me:MouseEvent) =>
//         {
//             callback
//         };

//         const mu = (me:MouseEvent) =>
//         {

//             window.removeEventListener('mousemove', mm);
//             window.removeEventListener('mousemove', mu);
//         }

//         window.addEventListener('mousemove', mm);
//         window.addEventListener('mousemove', mu);
//     }
// }