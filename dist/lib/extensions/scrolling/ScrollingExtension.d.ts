import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
export declare class ScrollerExtension extends AbstractDestroyable {
    private scrollerWidth;
    private grid;
    private wedge;
    constructor(scrollerWidth?: number);
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements();
    private alignElements();
    private onContainerScroll();
}
