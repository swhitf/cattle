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

export interface KeyBehaviorCallback
{
    (e?:VisualKeyboardEvent):void;
}

export class KeyBehavior extends AbstractDestroyable
{
    public static for(...objects:Array<Surface|Visual>):KeyBehavior
    {
        return new KeyBehavior(objects);
    }

    private constructor(private emitters:EventEmitter[])
    {
        super();
    }

    public on(expressions:string|string[], callback:any):KeyBehavior
    {
        if (!Array.isArray(expressions))
        {
            return this.on([expressions as string], callback);
        }

        for (let re of expressions)
        {
            let subs = this.emitters.map(ee => this.createListener(
                ee,
                KeyExpression.parse(re),
                callback));

            this.chain(...subs);
        }

        return this;
    }

    private createListener(ee:EventEmitter, ke:KeyExpression, callback:KeyBehaviorCallback):Destroyable
    {
        return ee.on('keydown', (evt:VisualKeyboardEvent) =>
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