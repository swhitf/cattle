import { Point } from './../geom/Point';
import { GridCell } from './GridCell';
import { GridModel } from './GridModel';
import * as util from '../misc/Util'

export class GridModelIndex
{
    private readonly refs:ObjectMap<GridCell>;
    private readonly coords:ObjectIndex<ObjectIndex<GridCell>>;

    constructor(model:GridModel)
    {
        this.refs = util.index(model.cells, x => x.ref);
        this.coords = {};

        for (let c of model.cells)
        {
            let x = this.coords[c.colRef] || (this.coords[c.colRef] = {});
            x[c.rowRef] = c;
        }
    }

    public findCell(ref:string):GridCell
    {
        return this.refs[ref] || null;
    }

    public findCellNeighbor(ref:string, vector:Point):GridCell
    {
        let cell = this.findCell(ref);
        let col = cell.colRef + vector.x;
        let row = cell.rowRef + vector.y;

        return this.locateCell(col, row);
    }

    public locateCell(col:number, row:number):GridCell
    {
        return (this.coords[col] || {})[row] || null;
    }
}