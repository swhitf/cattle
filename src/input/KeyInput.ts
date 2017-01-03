import { EventEmitter, EventEmitterBase, EventSubscription } from '../ui/internal/EventEmitter';
import { KeyExpression } from './KeyExpression';
import { EventTargetEventEmitterAdapter } from './EventTargetEventEmitterAdapter';


export type KeyMappable = EventTarget|EventEmitterBase;

export interface KeyMapCallback
{
    ():void;
}

export class KeyInput
{
    public static for(...elmts:KeyMappable[]):KeyInput
    {
        return new KeyInput(normalize(elmts));
    }

    private subs:EventSubscription[] = [];

    private constructor(private emitters:EventEmitter[])
    {
    }

    public on(exprs:string|string[], callback:KeyMapCallback):KeyInput
    {
        if (!Array.isArray(exprs))
        {
            return this.on([<string>exprs], callback);
        }

        for (let re of exprs)
        {
            let ss = this.emitters.map(ee => this.createListener(
                ee,
                KeyExpression.parse(re),
                callback));

            this.subs = this.subs.concat(ss);
        }

        return this;
    }

    private createListener(ee:EventEmitter, ke:KeyExpression, callback:KeyMapCallback):EventSubscription
    {
        return ee.on('keydown', (evt:KeyboardEvent) =>
        {
            if (ke.matches(evt))
            {
                if (ke.exclusive)
                {
                    evt.preventDefault();
                    evt.stopPropagation();
                }

                callback();
            }
        });
    }
}

function normalize(kms:KeyMappable[]):EventEmitter[]
{
    return <EventEmitter[]>kms
        .map(x => (!!x['addEventListener'])
            ? new EventTargetEventEmitterAdapter(<EventTarget>x)
            : x
        );
}

