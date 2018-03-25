export declare class Color {
    static rgba(r: number, g: number, b: number, a?: number): Color;
    static parse(cs: string): Color;
    private readonly data;
    private constructor();
    readonly name: string;
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;
    readonly h: number;
    readonly s: number;
    readonly l: number;
    toString(): string;
}
