import { Predicate } from '../../common';
import { GridElement } from '../../core/GridElement';
import { NetHandle } from './NetHandle';
import { NetManager } from './NetManager';
export declare class DefaultNetManager implements NetManager {
    private grid;
    private list;
    private lookup;
    constructor(grid: GridElement);
    readonly count: number;
    create(id: string, type: string, from: string, to?: string): NetHandle;
    destroy(id: string): void;
    createPrivate(id: string, type: string, from: string, to?: string): NetHandle;
    get(id: string): NetHandle;
    item(index: number): NetHandle;
    toArray(filter?: Predicate<NetHandle>): NetHandle[];
    protected indexOf(id: string): number;
}
