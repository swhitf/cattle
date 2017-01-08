import { Point } from './../geom/Point';
import { CellModel } from './CellModel';
import { GridModel } from './GridModel';
import { ObjectMap, ObjectIndex } from '../global';
import * as util from '../misc/Util'

export class GridModelIndex
{
    private readonly refs:ObjectMap<CellModel>;
    private readonly coords:ObjectIndex<ObjectIndex<CellModel>>;

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

    public findCell(ref:string):CellModel
    {
        return this.refs[ref] || null;
    }

    public findCellNeighbor(ref:string, vector:Point):CellModel
    {
        let cell = this.findCell(ref);
        let col = cell.colRef + vector.x;
        let row = cell.rowRef + vector.y;

        return this.locateCell(col, row);
    }

    public locateCell(col:number, row:number):CellModel
    {
        return (this.coords[col] || {})[row] || null;
    }
}