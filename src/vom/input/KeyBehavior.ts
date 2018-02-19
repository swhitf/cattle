import { CallbackDestroyable } from '../../base/CallbackDestroyable';
import { test } from '../VisualQuery';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Destroyable } from '../../base/Destroyable';
import { EventEmitter } from '../../base/EventEmitter';
import { VisualKeyboardEvent } from '../events/VisualKeyboardEvent';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { KeyExpression } from './KeyExpression';
import { VoidCallback1, BlankPredicate, VoidCallback } from '../../common';


/*KeyInput.for(grid)
.on('!TAB', () => this.selectNeighbor(Vectors.e))
.on('!SHIFT+TAB', () => this.selectNeighbor(Vectors.w))
.on('!RIGHT_ARROW', () => this.selectNeighbor(Vectors.e))
.on('!LEFT_ARROW', () => this.selectNeighbor(Vectors.w))
.on('!UP_ARROW', () => this.selectNeighbor(Vectors.n))
.on('!DOWN_ARROW', () => this.selectNeighbor(Vectors.s))
.on('!CTRL+RIGHT_ARROW', () => this.selectEdge(Vectors.e))
.on('!CTRL+LEFT_ARROW', () => this.selectEdge(Vectors.w))
.on('!CTRL+UP_ARROW', () => this.selectEdge(Vectors.n))
.on('!CTRL+DOWN_ARROW', () => this.selectEdge(Vectors.s))
.on('!CTRL+A', () => this.selectAll())
.on('!HOME', () => this.selectBorder(Vectors.w))
.on('!CTRL+HOME', () => this.selectBorder(Vectors.nw))
.on('!END', () => this.selectBorder(Vectors.e))
.on('!CTRL+END', () => this.selectBorder(Vectors.se))
*/

export type KeyEmitter = Surface|Visual|HTMLElement;

export abstract class KeyBehavior extends AbstractDestroyable
{
    public static for(object:KeyEmitter):KeyBehavior
    {
        return (object instanceof HTMLElement)
            ? new HTMLElementKeyBehavior(object)
            : new VisualKeyBehavior(object);
    }

    private predicateStack = [] as BlankPredicate[];

    protected constructor(protected object:KeyEmitter)
    {
        super();
    }

    public on(expressions:string|string[], callback:VoidCallback1<any>):KeyBehavior
    {
        if (!Array.isArray(expressions))
        {
            return this.on([expressions as string], callback);
        }

        for (let e of expressions)
        {
            this.chain(this.createListener(KeyExpression.parse(e), callback, this.predicateStack[this.predicateStack.length - 1]));
        }
        
        return this;
    }

    public when(predicate:BlankPredicate, configurator:VoidCallback1<KeyBehavior>):KeyBehavior
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

    protected abstract createListener(ke:KeyExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable;
}

class VisualKeyBehavior extends KeyBehavior
{
    protected createListener(ke:KeyExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable
    {
        let emitter = this.object as EventEmitter;

        return emitter.on(ke.event, (evt:VisualKeyboardEvent) =>
        {
            if (!!predicate && !predicate())   
                return;

            if (ke.matches(evt))
            {
                if (ke.exclusive)
                {
                    evt.cancel();
                }

                callback(evt);
            }
        });
    }
}

class HTMLElementKeyBehavior extends KeyBehavior
{
    protected createListener(ke:KeyExpression, callback:VoidCallback1<any>, predicate?:BlankPredicate):Destroyable
    {
        let elmt = this.object as HTMLElement;
        let handler = (evt:KeyboardEvent) =>
        {
            if (!!predicate && !predicate())   
                return;
                
            if (ke.matches(evt))
            {
                if (ke.exclusive)
                {
                    evt.preventDefault();
                }

                callback(evt);
            }
        };

        elmt.addEventListener(ke.event, handler);
        return new CallbackDestroyable(() => elmt.removeEventListener(ke.event, handler));
    }
}