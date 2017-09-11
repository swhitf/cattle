import { EventCallback, EventEmitter, EventSubscription } from './EventEmitter';


export class ProxyEventEmitter implements EventEmitter
{
    constructor(protected emitter:EventEmitter)
    {
    }
    
    public on(event:string, callback:EventCallback):EventSubscription 
    {
        return this.emitter.on(event, callback);
    }   

    public off(event:string, callback?:EventCallback):void 
    {
        this.emitter.off(event, callback);
    }

    public emit(event:string, ...args:any[]):void 
    {
        this.emitter.emit(event, ...args);
    }
}