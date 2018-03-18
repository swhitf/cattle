import { Event } from '../../base/Event';


export class ClipEvent extends Event
{
    constructor(type:'cut'|'copy'|'paste', public data:string)
    {
        super(type);
    }
}