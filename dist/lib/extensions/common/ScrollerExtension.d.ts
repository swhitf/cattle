import { GridElement } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
export declare class ScrollerExtension {
    private scrollerWidth;
    private grid;
    private wedge;
    constructor(scrollerWidth?: number);
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements(target);
    private alignElements();
    private onContainerScroll();
}
