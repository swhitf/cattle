import { GridElement } from '../GridElement';
import { GridEvent } from './GridEvent';


export class GridChangeEvent extends GridEvent
{
    constructor(public grid:GridElement, public property:string)
    {
        super('change', grid);
    }
}