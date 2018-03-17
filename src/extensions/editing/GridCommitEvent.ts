import { GridEvent } from '../../core/events/GridEvent';
import { GridElement } from '../../core/GridElement';
import { GridChangeSet } from './GridChangeSet';


export class GridCommitEvent extends GridEvent
{
    constructor(public grid:GridElement, public changes:GridChangeSet)
    {
        super('change', grid);
    }
}