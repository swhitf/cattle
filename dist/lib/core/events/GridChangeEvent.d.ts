import { GridElement } from '../GridElement';
import { GridEvent } from './GridEvent';
export declare class GridChangeEvent extends GridEvent {
    grid: GridElement;
    property: string;
    constructor(grid: GridElement, property: string);
}
