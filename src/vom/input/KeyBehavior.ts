import { CallbackDestroyable } from '../../base/CallbackDestroyable';
import { test } from '../VisualQuery';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Destroyable } from '../../base/Destroyable';
import { EventEmitter } from '../../base/EventEmitter';
import { VisualKeyboardEvent } from '../events/VisualKeyboardEvent';
import { Surface } from '../Surface';
import { Visual } from '../Visual';
import { KeyExpression } from './KeyExpression';


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

    protected constructor(protected object:KeyEmitter)
    {
        super();
    }

    public on(expressions:string|string[], callback:any):KeyBehavior
    {
        let { object } = this;

        if (!Array.isArray(expressions))
        {
            return this.on([expressions as string], callback);
        }

        for (let e of expressions)
        {
            this.chain(this.createListener(KeyExpression.parse(e), callback));
        }

        return this;
    }

    protected abstract createListener(ke:KeyExpression, callback:any):Destroyable;
}

class VisualKeyBehavior extends KeyBehavior
{
    protected createListener(ke:KeyExpression, callback:any):Destroyable
    {
        let emitter = this.object as EventEmitter;

        return emitter.on('keydown', (evt:VisualKeyboardEvent) =>
        {
            if (ke.matches(evt))
            {
                if (ke.exclusive)
                {
                    evt.cancel();
                }

                callback();
            }
        });
    }
}

class HTMLElementKeyBehavior extends KeyBehavior
{
    protected createListener(ke:KeyExpression, callback:any):Destroyable
    {
        let elmt = this.object as HTMLElement;
        let handler = (evt:KeyboardEvent) =>
        {
            if (ke.matches(evt))
            {
                if (ke.exclusive)
                {
                    evt.preventDefault();
                }

                callback();
            }
        };

        elmt.addEventListener('keydown', handler);
        return new CallbackDestroyable(() => elmt.removeEventListener('keydown', handler));
    }
}