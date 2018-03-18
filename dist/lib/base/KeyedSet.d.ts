export interface KeySetItemCallback<T, R = void> {
    (tm: T, index: number): R;
}
export interface KeySetItemReduceCallback<T, R = T> {
    (prev: R, curr: T, index: number, array: T[]): R;
}
export declare class KeyedSet<T> {
    protected indexer: (t: T) => number | string;
    protected list: T[];
    protected index: any;
    constructor(indexer: (t: T) => number | string);
    readonly array: T[];
    readonly size: number;
    add(value: T): boolean;
    addAll(values: T[]): void;
    merge(value: T): void;
    clear(): void;
    delete(key: number | string): boolean;
    remove(value: T): boolean;
    removeAll(values: T[]): void;
    removeWhere(predicate: KeySetItemCallback<T, boolean>): number;
    has(value: T): boolean;
    get(key: string | number): T;
    first(): T;
    last(): T;
    forEach(callback: KeySetItemCallback<T>, thisArg?: any): void;
    filter(callback: KeySetItemCallback<T, boolean>): T[];
    find(callback: KeySetItemCallback<T, boolean>): T;
    map<U>(callback: KeySetItemCallback<T, U>): U[];
    reduce<U>(callback: KeySetItemReduceCallback<T, U>, initial: U): U;
}
