import { Visual } from '../Visual';
import { KeySet } from './KeySet';
import { VisualEvent } from './VisualEvent';


export type KeyInputEventTypes = 'keydown'|'keyup';

export class KeyInputEvent extends VisualEvent
{
    public readonly key:number;
    public readonly keys:KeySet;

    constructor(type:KeyInputEventTypes, target:Visual, key:number, keys:KeySet)
    {
        super(type, target); 
        
        this.key = key;
        this.keys = keys;
    }
}