import { Visual } from '../Visual';
import { Event } from '../../eventing/Event';


export class VisualEvent extends Event
{
    public readonly target:Visual;

    constructor(type:string, target:Visual)
    {
        super(type);

        this.target = target;
    }
}