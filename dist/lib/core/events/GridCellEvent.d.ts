import { Event } from '../../base/Event';
import { GridElement } from '../GridElement';
export declare class GridCellEvent extends Event {
    grid: GridElement;
    cellRef: string;
    constructor(type: string, grid: GridElement, cellRef: string);
}
