export interface PointLike {
    x: number;
    y: number;
}
export declare type BrowserPoint = {
    left: number;
    top: number;
};
export declare type PointInput = number[] | Point | PointLike | BrowserPoint;
export declare class Point implements PointLike {
    readonly x: number;
    readonly y: number;
    static rad2deg: number;
    static deg2rad: number;
    static empty: Point;
    static max: Point;
    static min: Point;
    static up: Point;
    static average(points: PointLike[]): Point;
    static direction(from: PointInput, to: PointInput): Point;
    static create(source: PointInput): Point;
    static fromBuffer(buffer: number[], index?: number): Point;
    constructor(x: number | number[], y?: number);
    angle(): number;
    angleAbout(val: PointInput): number;
    cross(val: PointInput): number;
    distance(to: PointInput): number;
    dot(val: PointInput): number;
    length(): number;
    normalize(): Point;
    perp(): Point;
    rperp(): Point;
    inverse(): Point;
    reverse(): Point;
    rotate(radians: number): Point;
    add(val: number | PointInput): Point;
    divide(divisor: number): Point;
    multiply(multipler: number): Point;
    round(): Point;
    subtract(val: number | PointInput): Point;
    clone(): Point;
    equals(another: PointLike): boolean;
    toArray(): number[];
    toString(): string;
}
