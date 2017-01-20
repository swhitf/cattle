import { Point, PointLike } from './Point';
export interface RectLike {
    left: number;
    top: number;
    width: number;
    height: number;
}
export declare class Rect {
    static empty: Rect;
    static fromEdges(left: number, top: number, right: number, bottom: number): Rect;
    static fromLike(like: RectLike): Rect;
    static fromMany(rects: Rect[]): Rect;
    static fromPoints(...points: Point[]): Rect;
    static fromPointBuffer(points: Point[], index?: number, length?: number): Rect;
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
    constructor(left: number, top: number, width: number, height: number);
    readonly right: number;
    readonly bottom: number;
    center(): Point;
    topLeft(): Point;
    points(): Point[];
    size(): Point;
    offset(pt: PointLike): Rect;
    contains(input: Point | RectLike): boolean;
    inflate(size: Point): Rect;
    intersects(rect: RectLike): boolean;
    normalize(): Rect;
    toString(): string;
}
