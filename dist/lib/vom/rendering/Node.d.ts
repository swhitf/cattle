import { Rect, RectLike } from '../../geom/Rect';
import { Buffer } from './Buffer';
import { Key } from './Key';
import { NodeList } from './NodeList';
import { Region } from './Region';
export declare abstract class Node {
    readonly key: Key;
    readonly parent: Region;
    readonly children: NodeList;
    protected readonly buffer: Buffer;
    age: number;
    area: Rect;
    accessed: boolean;
    dirty: boolean;
    constructor(key: Key, parent?: Region);
    readonly id: string;
    arrange(rect: Rect): void;
    beginUpdate(): void;
    endUpdate(): void;
    readonly abstract type: string;
    abstract render(gfx: CanvasRenderingContext2D, clip?: RectLike): void;
}
