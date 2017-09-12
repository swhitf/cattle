import { Event } from '../../eventing/Event';


export class SurfaceEvent extends Event
{
    constructor(type:string)
    {
        super(type);
    }
}