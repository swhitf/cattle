export declare class Padding {
    static empty: Padding;
    readonly top: number;
    readonly right: number;
    readonly bottom: number;
    readonly left: number;
    constructor(top?: number, right?: number, bottom?: number, left?: number);
    readonly horizontal: number;
    readonly vertical: number;
    inflate(by: number): Padding;
}
