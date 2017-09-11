

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

    off(event:string, callback?:EventCallback):void;

    emit(event:string, ...args:any[]):void;
}

export function debug_events(ee:EventEmitter):void
{
    let original = ee['emit'];
    ee['emit'] = function(event:string, ...args:any[]):void
    {
        console.debug(event + ' -> ', (args || []).join(', '));
        original.apply(this, arguments);
    };
}