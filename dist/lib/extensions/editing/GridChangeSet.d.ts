import { GridModel } from "../../model/GridModel";
export interface GridChangeSetEntry {
    readonly ref: string;
    readonly value: string;
    readonly cascaded?: boolean;
}
export declare class GridChangeSet {
    private readonly map;
    private readonly list;
    readonly length: number;
    has(ref: string): boolean;
    get(ref: string): GridChangeSetEntry;
    set(ref: string, value: string, cascaded?: boolean): void;
    delete(ref: string): boolean;
    value(ref: string): string;
    refs(): string[];
    apply(model: GridModel): void;
}
