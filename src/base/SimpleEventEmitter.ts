import { Event } from "./Event";
import { EventEmitter, EventCallback, EventSubscription } from "./EventEmitter";


export class SimpleEventEmitter implements EventEmitter
{
    private buckets:any = {};

    public on(event:string, callback:EventCallback):EventSubscription
    {
        this.getCallbackList(event).push(callback);
        return { cancel: () => this.off(event, callback) };
    }

    public off(event:string, callback?:EventCallback):void
    {
        let list = this.getCallbackList(event);

        if (callback)
        {
            let idx = list.indexOf(callback);
            if (idx >= 0)
            {
                list.splice(idx, 1);
            }
        }
        else
        {
            list.splice(0, list.length);
        }
    }

    public emit(evt:Event):void
    {
        let list = this.getCallbackList(evt.type);
        for (let callback of list)
        {
            callback.call(null, evt);
        }
    }

    private getCallbackList(event:string):EventCallback[]
    {
        return this.buckets[event] || (this.buckets[event] = []);
    }
}