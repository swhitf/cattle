export declare class GridCellStyle {
    private values;
    static get(...values: string[]): GridCellStyle;
    private constructor();
    readonly length: number;
    item(index: number): string;
    add(...input: string[]): GridCellStyle;
    remove(...input: string[]): GridCellStyle;
    toArray(): string[];
}
