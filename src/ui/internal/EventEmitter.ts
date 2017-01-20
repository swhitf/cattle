

export interface EventSubscription
{
    cancel():void;
}

export interface EventCallback
{
    (...args:any[]):void;
}

export interface EventEmitter
{
    on(event:string, callback:EventCallback):EventSubscription;

    off(event:string, callback:EventCallback):void;

    emit(event:string, ...args:any[]):void;
}

EventTarget
export class EventEmitterBase
{
    private buckets:any = {};

    public on(event:string, callback:EventCallback):EventSubscription
    {
        this.getCallbackList(event).push(callback);
        return { cancel: () => this.off(event, callback) };
    }

    public off(event:string, callback:EventCallback):void
    {
        let list = this.getCallbackList(event);
        let idx = list.indexOf(callback);
        if (idx >= 0)
        {
            list.splice(idx, 1);
        }
    }

    public emit(event:string, ...args:any[]):void
    {
        if (!event.match('mouse') && !event.match('key') && !event.match('drag'))
        {
            console.log(event, ...args);
        }

        let list = this.getCallbackList(event);
        for (let callback of list)
        {
            callback.apply(null, args);
        }
    }

    private getCallbackList(event:string):EventCallback[]
    {
        return this.buckets[event] || (this.buckets[event] = []);
    }
}