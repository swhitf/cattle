import { Event } from '../../base/Event';
import { GridElement } from '../GridElement';


export class GridCellEvent extends Event
{
    constructor(type:string, public grid:GridElement, public cellRef:string)
    {
        super(type);
    }
}