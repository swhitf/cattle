import { GridKernel } from '.././../ui/GridKernel';
import { GridElement } from '.././../ui/GridElement';
import { Point } from '../../geom/Point';
import { Widget } from '../../ui/Widget';
export interface SelectorWidget extends Widget {
}
export interface SelectorExtensionExports {
    canSelect: boolean;
    readonly selection: string[];
    readonly primarySelector: SelectorWidget;
    readonly captureSelector: SelectorWidget;
    select(cells: string[], autoScroll?: boolean): void;
    selectAll(): void;
    selectBorder(vector: Point, autoScroll?: boolean): void;
    selectEdge(vector: Point, autoScroll?: boolean): void;
    selectLine(gridPt: Point, autoScroll?: boolean): void;
    selectNeighbor(vector: Point, autoScroll?: boolean): void;
}
export declare class SelectorExtension {
    private grid;
    private layer;
    private selectGesture;
    private canSelect;
    private selection;
    private primarySelector;
    private captureSelector;
    init(grid: GridElement, kernel: GridKernel): void;
    private createElements(target);
    private select(cells, autoScroll?);
    private selectAll();
    private selectBorder(vector, autoScroll?);
    private selectEdge(vector, autoScroll?);
    private selectLine(gridPt, autoScroll?);
    private selectNeighbor(vector, autoScroll?);
    private reselect(autoScroll?);
    private beginSelectGesture(gridX, gridY);
    private updateSelectGesture(gridX, gridY);
    private endSelectGesture();
    private doSelect(cells?, autoScroll?);
    private alignSelectors(animate);
}
