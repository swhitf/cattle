import { EventEmitter, EventCallback, EventSubscription } from '../ui/internal/EventEmitter';
import * as _ from '../misc/Util';


export class EventTargetEventEmitterAdapter implements EventEmitter
{
    public static wrap(target:EventTarget|EventEmitter):EventEmitter
    {
        if (!!target['addEventListener'])
        {
            return new EventTargetEventEmitterAdapter(<EventTarget>target);
        }

        return <EventEmitter>target;
    }

    constructor(private target:EventTarget)
    {
    }

    public on(event:string, callback:EventCallback):EventSubscription
    {
        this.target.addEventListener(event, callback);
        return {
            cancel: () => this.off(event, callback),
        };
    }

    public off(event:string, callback:EventCallback):void
    {
        this.target.removeEventListener(event, callback);
    }

    public emit(event:string, ...args:any[]):void
    {
        this.target.dispatchEvent(
            _.extend(new Event(event), { args: args })
        );
    }
}