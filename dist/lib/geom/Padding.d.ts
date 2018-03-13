export declare class Padding {
    static empty: Padding;
    static hv(h: number, v: number): Padding;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    constructor(top?: number, right?: number, bottom?: number, left?: number);
    readonly horizontal: number;
    readonly vertical: number;
    copy(changes: Partial<Padding>): Padding;
}
