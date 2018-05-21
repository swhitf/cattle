import { Destroyable } from './Destroyable';
import { Event } from './Event';


export interface EventCallback
{
    (evt:Event):void;
}

export interface EventEmitter
{
    on(event:string, callback:EventCallback):Destroyable;

    off(event:string, callback?:EventCallback):void;

    emit(evt:Event):void;
}

export function debug_events(ee:EventEmitter):void
{
    let original = ee['emit'];
    ee['emit'] = function(e:Event):void
    {
        console.debug(e.type + ' -> ', e);
        original.apply(this, arguments);
    };
}