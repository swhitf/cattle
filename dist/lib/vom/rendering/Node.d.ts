import { Buffer } from './Buffer';
import { Key } from './Key';
import { NodeList } from './NodeList';
export declare abstract class Node {
    readonly key: Key;
    readonly parent: Node;
    readonly children: NodeList;
    buffer: Buffer;
    accessed: boolean;
    private dirtyVal;
    constructor(key: Key, parent?: Node);
    dirty: boolean;
    beginUpdate(): void;
    endUpdate(): void;
    readonly abstract type: string;
    abstract render(gfx: CanvasRenderingContext2D): void;
}
