import { GridCell } from "./GridCell";
import { GridModel } from "./GridModel";
import { Point, PointInput } from '../geom/Point';
export interface GridWalkCallback<T = void> {
    (cell: GridCell, vector: Point, model: GridModel): T;
}
export declare abstract class GridWalk {
    static toDataPoint(model: GridModel, fromRef: string, vector: PointInput, strategy?: GridWalkCallback<boolean>): GridCell;
    static toEdge(model: GridModel, fromRef: string, vector: PointInput): GridCell;
    static toNext(model: GridModel, fromRef: string, vector: PointInput): GridCell;
    static until(model: GridModel, fromRef: string, vector: PointInput, callback: GridWalkCallback<boolean | void>): GridCell;
}
export declare function defaultDataPointDetectStrategy(cell: GridCell, vector: Point, model: GridModel): boolean;
