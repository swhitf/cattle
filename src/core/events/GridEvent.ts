import { GridElement } from '../GridElement';
import { Event } from '../../base/Event';


export class GridEvent extends Event
{
    constructor(type:string, public grid:GridElement)
    {
        super(type);
    }
}