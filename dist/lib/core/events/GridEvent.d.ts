import { GridElement } from '../GridElement';
import { Event } from '../../base/Event';
export declare class GridEvent extends Event {
    grid: GridElement;
    constructor(type: string, grid: GridElement);
}
