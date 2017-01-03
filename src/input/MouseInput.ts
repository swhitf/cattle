import { EventEmitter, EventEmitterBase, EventSubscription } from '../ui/internal/EventEmitter';
import { KeyExpression } from './KeyExpression';
import { EventTargetEventEmitterAdapter } from './EventTargetEventEmitterAdapter';
import { MouseExpression } from './MouseExpression';
import { MouseDragEventSupport } from './MouseDragEventSupport';


export type Mappable = EventTarget|EventEmitterBase;

export interface MouseCallback
{
    (e:Event):void;
}

export class MouseInput
{
    public static for(...elmts:Mappable[]):MouseInput
    {
        return new MouseInput(normalize(elmts));
    }

    private subs:EventSubscription[] = [];

    private constructor(private emitters:EventEmitter[])
    {
    }

    public on(expr:string, callback:MouseCallback):MouseInput
    {
        let ss = this.emitters.map(ee => this.createListener(
            ee,
            MouseExpression.parse(expr),
            callback));

        this.subs = this.subs.concat(ss);

        return this;
    }

    private createListener(target:EventEmitter, expr:MouseExpression, callback:MouseCallback):EventSubscription
    {
        return target.on(expr.event, (evt:MouseEvent) =>
        {
            if (expr.matches(evt))
            {
                if (expr.exclusive)
                {
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                callback(evt);
            }
        });
    }
}

function normalize(kms:Mappable[]):EventEmitter[]
{
    return <EventEmitter[]>kms
        .map(x => (!!x['addEventListener'])
            ? new EventTargetEventEmitterAdapter(<EventTarget>x)
            : x
        );
}

