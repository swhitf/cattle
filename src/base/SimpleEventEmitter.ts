import { Event } from "./Event";
import { EventEmitter, EventCallback } from "./EventEmitter";
import { Destroyable } from "./Destroyable";
import { AbstractDestroyable } from "./AbstractDestroyable";


export class SimpleEventEmitter implements EventEmitter
{
    private buckets:any = {};

    public on(event:string, callback:EventCallback):Destroyable
    {
        this.getCallbackList(event).push(callback);
        return new CallbackDestroyable(() => this.off(event, callback));
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

class CallbackDestroyable extends AbstractDestroyable
{
    constructor(private callback:any)
    {
        super();
    }

    public destroy():void 
    {
        this.destroy();
        this.callback();
    }
}