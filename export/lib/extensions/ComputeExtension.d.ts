import { GridExtension, GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
export declare class ComputeExtension implements GridExtension {
    private grid;
    private tracker;
    private readonly selection;
    init?(grid: GridElement, kernel: GridKernel): void;
    private beginEditOverride(override, impl);
    private commitOverride(changes, impl);
    private evaluate(formula);
    private resolveExpr(expr);
    private resolveRef(nameRef);
}
