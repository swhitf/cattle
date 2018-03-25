import { GridExtension } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
export declare class ClipboardExtension implements GridExtension {
    private grid;
    private layer;
    init(grid: GridElement): void;
    private readonly nets;
    private readonly selection;
    private clearCopy();
    private doCopy(delimiter?);
    private doCut(delimiter?);
    private doPaste(text, wasPreviouslyCut);
    private onPasteOrCut(text, wasPreviouslyCut);
    private captureSelectionAsText(delimiter?);
    private parsePastedText(pastedText);
    private computePasteRange(data);
    private computeChangeSet(data, range);
    private createCopyNet();
    private destroyCopyNet();
}
