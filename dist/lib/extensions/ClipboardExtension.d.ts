import { GridExtension, GridElement } from '../ui/GridElement';
import { AbsWidgetBase } from '../ui/Widget';
export declare class ClipboardExtension implements GridExtension {
    private grid;
    private layer;
    private copyList;
    private copyRange;
    private copyNet;
    init(grid: GridElement): void;
    private readonly captureSelector;
    private readonly selection;
    private createElements(target);
    private copySelection();
    private resetCopy();
    private doCopy(cells, delimiter?);
    private doPaste(text);
    private alignNet();
    private onWindowPaste(e);
}
export declare class CopyNet extends AbsWidgetBase<HTMLDivElement> {
    static create(container: HTMLElement): CopyNet;
}
