import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridExtension } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { NetManager } from './NetManager';
export declare class NetExtension extends AbstractDestroyable implements GridExtension {
    nets: NetManager;
    init(grid: GridElement, kernel: GridKernel): void;
}
