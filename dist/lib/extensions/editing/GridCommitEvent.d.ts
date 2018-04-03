import { GridEvent } from '../../core/events/GridEvent';
import { GridElement } from '../../core/GridElement';
import { GridChangeSet } from './GridChangeSet';
export declare class GridCommitEvent extends GridEvent {
    grid: GridElement;
    changes: GridChangeSet;
    constructor(grid: GridElement, changes: GridChangeSet);
}
