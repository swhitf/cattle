import { Point } from './Point';
export declare enum AngleUnits {
    Radians = 1,
    Degrees = 2,
}
export declare class Matrix {
    static identity: Matrix;
    readonly a: number;
    readonly b: number;
    readonly c: number;
    readonly d: number;
    readonly e: number;
    readonly f: number;
    constructor(a?: number, b?: number, c?: number, d?: number, e?: number, f?: number);
    isIdentity(): boolean;
    isInvertible(): boolean;
    determinant(): number;
    equals(m: Matrix): boolean;
    apply(pt: Point): Point;
    concat(cm: Matrix): Matrix;
    clone(): Matrix;
    transform(a2: any, b2: any, c2: any, d2: any, e2: any, f2: any): Matrix;
    multiply(m: Matrix): Matrix;
    divide(m: Matrix): Matrix;
    divideScalar(dv: number): Matrix;
    scale(f: number): Matrix;
    translate(tx: number, ty: number): Matrix;
    rotate(angle: number, unit?: AngleUnits): Matrix;
    inverse(): Matrix;
    toArray(): number[];
    toCSS(): string;
    toCSS3D(): string;
    private _q(f1, f2);
}
