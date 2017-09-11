import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';


export class ComposeEvent extends VisualEvent
{
    constructor(target:Visual)
    {
        super('compose', target);
    }
}