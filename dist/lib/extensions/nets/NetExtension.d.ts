import { NetManager } from './NetManager';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { GridExtension } from '../../core/Extensibility';
export declare class NetExtension implements GridExtension {
    nets: NetManager;
    init(grid: GridElement, kernel: GridKernel): void;
}
