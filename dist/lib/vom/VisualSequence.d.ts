import { Visual } from './Visual';
export interface VisualSequenceCallback {
    (v: Visual): boolean;
}
export declare class VisualSequence {
    private root;
    private lookup;
    private head;
    private tail;
    private list;
    constructor(root: Visual);
    readonly all: Visual[];
    dive(callback: VisualSequenceCallback): void;
    climb(callback: VisualSequenceCallback): void;
    invalidate(visual: Visual): void;
    update(): void;
    private create(visual, depth);
    private expand(node);
    private truncate(node);
}
