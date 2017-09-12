import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';


export class ChangeEvent extends VisualEvent
{
    public readonly property:string;

    constructor(target:Visual, property:string)
    {
        super('change', target);
        this.property = property;
    }
}