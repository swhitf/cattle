import { CallbackDestroyable } from '../../base/CallbackDestroyable';
import { VisualMouseEvent } from '../events/VisualMouseEvent';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { VoidCallback1, BlankPredicate } from '../../common';
import { MouseExpression } from './MouseExpression';
import { Destroyable } from '../../base/Destroyable';
import { KeyEmitter } from './KeyBehavior';
import { EventEmitter } from '../../base/EventEmitter';


export type MouseEmitter = Surface|Visual|HTMLElement;

export abstract class MouseBehavior extends AbstractDestroyable
{
    public static for(object:MouseEmitter):MouseBehavior
    {
        return (object instanceof HTMLElement)
            ? new HTMLElementMouseBehavior(object)
            : new VisualMouseBehavior(object);
    }

    private predicateStack = [] as BlankPredicate[];

    protected constructor(protected object:MouseEmitter)
    {
        super();
    }

    public on(expressions:string|string[], callback:VoidCallback1<any>):MouseBehavior
    {
        if (!Array.isArray(expressions))
        {
            return this.on([expressions as string], callback);
        }

        for (let e of expressions)
        {
            this.chain(this.createListener(MouseExpression.parse(e), callback, this.predicateStack[this.predicateStack.length - 1]));
        }
        
        return this;
    }

    public when(predicate:BlankPredicate, configurator:VoidCallback1<MouseBehavior>):MouseBehavior
    {
        try
        {
            this.predicateStack.push(predicate);
            configurator(this);
        }
        finally
        {
            this.predicateStack.pop();
        }
        
        return this;
    }

    protected abstract createListener(me:MouseExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable;
}

class VisualMouseBehavior extends MouseBehavior
{
    protected createListener(me:MouseExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable
    {
        let emitter = this.object as EventEmitter;

        return emitter.on(me.event, (evt:VisualMouseEvent) =>
        {
            if (!!predicate && !predicate())   
                return;

            if (me.matches(evt))
            {
                if (me.exclusive)
                {
                    evt.cancel();
                }

                callback(evt);
            }
        });
    }
}

class HTMLElementMouseBehavior extends MouseBehavior
{
    protected createListener(me:MouseExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable
    {
        let elmt = this.object as HTMLElement;
        let handler = (evt:MouseEvent) =>
        {
            if (!!predicate && !predicate())   
                return;
                
            if (me.matches(evt))
            {
                if (me.exclusive)
                {
                    evt.preventDefault();
                }

                callback(evt);
            }
        };

        elmt.addEventListener(me.event, handler);
        return new CallbackDestroyable(() => elmt.removeEventListener(me.event, handler));
    }
}