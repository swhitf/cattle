import { Key } from './Key';
import { Node } from './Node';
export interface NodeListCallback<R = void> {
    (node: Node, index: number): R;
}
export declare class NodeList {
    private array;
    private index;
    add(node: Node): void;
    remove(node: Node): void;
    removeWhere(predicate: NodeListCallback<boolean>): Node[];
    get(key: Key): Node;
    delete(key: Key): Node;
    forEach(callback: NodeListCallback): void;
}
