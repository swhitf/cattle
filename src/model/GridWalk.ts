import { GridCell } from "./GridCell";
import { GridModel } from "./GridModel";
import { Point, PointInput } from '../geom/Point';



export interface GridWalkCallback<T = void>
{
    (cell:GridCell, vector:Point, model:GridModel):T;
}

export abstract class GridWalk 
{
    public static toDataPoint(model:GridModel, fromRef:string, vector:PointInput, strategy?:GridWalkCallback<boolean>):GridCell 
    {
        strategy = strategy || defaultDataPointDetectStrategy;
        return GridWalk.until(model, fromRef, vector, (c, v, m) => strategy(c, v, m));
    }

    public static toEdge(model:GridModel, fromRef:string, vector:PointInput):GridCell 
    {
        let dir = Point.create(vector).round();
        let cell = model.findCell(fromRef);

        if (!cell) 
        {
            throw `Invalid walk starting from: ${fromRef}`;
        }

        let col = cell.colRef;
        let row = cell.rowRef;

        while (col >= 0 && col < model.width && row >= 0 && row < model.height)
        {
            let c = model.locateCell(col, row);

            if (c)
            {
                cell = c;
            }
            
            col += dir.x;
            row += dir.y;
        }

        return cell;
    }

    public static toNext(model:GridModel, fromRef:string, vector:PointInput):GridCell
    {
        return this.until(model, fromRef, vector, (c, v, m) => c.ref != fromRef);
    }

    public static until(model:GridModel, fromRef:string, vector:PointInput, callback:GridWalkCallback<boolean|void>):GridCell
    {
        let dir = Point.create(vector).round();
        let cell = model.findCell(fromRef);

        if (!cell)
        {
            throw `Invalid walk starting from: ${fromRef}`;
        }

        let col = cell.colRef;
        let row = cell.rowRef;

        while (col >= 0 && col < model.width && row >= 0 && row < model.height)
        {
            cell = model.locateCell(col, row);
            
            if (cell && callback(cell, dir, model) === true)
            {
                return cell;
            }
            
            col += dir.x;
            row += dir.y;
        }

        return null;
    }
}

export function defaultDataPointDetectStrategy(cell:GridCell, vector:Point, model:GridModel):boolean
{
    let empty = (cell:GridCell) => !!<any>(cell.value === ''  || cell.value === '0' || cell.value === undefined || cell.value === null);

    if (!!(cell as any).dataPoint)
    {
        return true;
    }

    let next = model.locateCell(cell.colRef + vector.x, cell.rowRef + vector.y);
    let prev = model.locateCell(cell.colRef - vector.x, cell.rowRef - vector.y);

    if (!next) 
    {
        return true;
    }   

    if (!empty(cell) && (empty(next) || empty(prev)))
    {
        return true;
    }

    return false;
}