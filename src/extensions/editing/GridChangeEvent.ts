import { GridChangeSet } from "./GridChangeSet";
import { Event } from "../../base/Event";


export class GridChangeEvent extends Event
{
    constructor(public changes:GridChangeSet)
    {
        super('change');
    }
}