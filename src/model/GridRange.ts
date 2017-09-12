// import { ObjectMap } from '../common';
// import { Base26 } from '../misc/Base26';
// import { GridCell } from './GridCell';
// import { GridModel } from './GridModel';
// import { Point } from '../geom/Point';
// import { Rect } from '../geom/Rect';
// import * as u from '../misc/Util';


// /**
//  * Provides a method of selecting and representing a range of cells from a `GridModel`.
//  */
// export class GridRange
// {
//     /**
//      * Creates a new GridRange object that contains the cells with the specified refs from the
//      * specified model.
//      *
//      * @param model
//      * @param cellRefs
//      * @returns {Range}
//      */
//     public static create(model:GridModel, cellRefs:string[]):GridRange
//     {
//         let lookup = u.index(cellRefs, x => x);

//         let cells = [] as GridCell[];
//         let lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
//         let hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;

//         for (let c of model.cells)
//         {
//             if (!lookup[c.ref])
//                 continue;

//             cells.push(c);

//             if (lc > c.colRef) lc = c.colRef;
//             if (hc < c.colRef) hc = c.colRef;
//             if (lr > c.rowRef) lr = c.rowRef;
//             if (hr < c.rowRef) hr = c.rowRef;
//         }

//         let ltr = cells.sort(ltr_sort);
//         let ttb = cells.slice(0).sort(ttb_sort);

//         return new GridRange({
//             ltr: ltr,
//             ttb: ttb,
//             width: hc - lc,
//             height: hr - lr,
//             length: (hc - lc) * (hr - lr),
//             count: cells.length,
//         });
//     }

//     /**
//      * Captures a range of cells from the specified model based on the specified vectors.  The vectors should be
//      * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
//      * Any cells falling into the rectangle created from these two points will be included in the selected GridRange.
//      *
//      * @param model
//      * @param from
//      * @param to
//      * @param toInclusive
//      * @returns {Range}
//      */
//     public static capture(model:GridModel, from:Point, to:Point, toInclusive:boolean = false):GridRange
//     {
//         //TODO: Explain this...
//         let tl = new Point(from.x < to.x ? from.x : to.x, from.y < to.y ? from.y : to.y);
//         let br = new Point(from.x > to.x ? from.x : to.x, from.y > to.y ? from.y : to.y);

//         if (toInclusive)
//         {
//             br = br.add(1);
//         }

//         let dims = Rect.fromPoints(tl, br);
//         let results = [] as GridCell[];

//         for (let r = dims.top; r < dims.bottom; r++)
//         {
//             for (let c = dims.left; c < dims.right; c++)
//             {
//                 let cell = model.locateCell(c, r);
//                 if (cell)
//                 {
//                     results.push(cell);
//                 }
//             }
//         }

//         return GridRange.createInternal(model, results);
//     }
    
//     /**
//      * Selects a range of cells using an Excel-like range expression. For example:
//      * - A1 selects a 1x1 range of the first cell
//      * - A1:A5 selects a 1x5 range from the first cell horizontally.
//      * - A1:E5 selects a 5x5 range from the first cell evenly.
//      * 
//      * @param model
//      * @param query
//      */
//     public static select(model:GridModel, query:string):GridRange
//     {
//         let [from, to] = query.split(':');
//         let fromCell = resolve_expr_ref(model, from);

//         if (!to)
//         {
//             if (!!fromCell)
//             {
//                 return GridRange.createInternal(model, [fromCell]);
//             }
//         }
//         else
//         {
//             let toCell = resolve_expr_ref(model, to);

//             if (!!fromCell && !!toCell)
//             {
//                 let fromVector = new Point(fromCell.colRef, fromCell.rowRef);
//                 let toVector = new Point(toCell.colRef, toCell.rowRef);
//                 return GridRange.capture(model, fromVector, toVector, true);
//             }
//         }

//         return GridRange.empty();
//     }

//     /**
//      * Creates an empty GridRange object.
//      *
//      * @returns {Range}
//      */
//     public static empty():GridRange
//     {
//         return new GridRange({
//             ltr: [],
//             ttb: [],
//             width: 0,
//             height: 0,
//             length: 0,
//             count: 0,
//         });
//     }

//     private static createInternal(model:GridModel, cells:GridCell[]):GridRange
//     {
//         let lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
//         let hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;

//         for (let c of cells)
//         {
//             if (lc > c.colRef) lc = c.colRef;
//             if (hc < c.colRef) hc = c.colRef;
//             if (lr > c.rowRef) lr = c.rowRef;
//             if (hr < c.rowRef) hr = c.rowRef;
//         }

//         let ltr:GridCell[];
//         let ttb:GridCell[];

//         if (cells.length > 1)
//         {
//             ltr = cells.sort(ltr_sort);
//             ttb = cells.slice(0).sort(ttb_sort);
//         }
//         else
//         {
//             ltr = ttb = cells;
//         }

//         return new GridRange({
//             ltr: ltr,
//             ttb: ttb,
//             width: hc - lc,
//             height: hr - lr,
//             length: (hc - lc) * (hr - lr),
//             count: cells.length,
//         });
//     }

//     /**
//      * The cells in the GridRange ordered from left to right.
//      */
//     public readonly ltr:GridCell[];

//     /**
//      * The cells in the GridRange ordered from top to bottom.
//      */
//     public readonly ttb:GridCell[];

//     /**
//      * The width of the GridRange in columns.
//      */
//     public readonly width:number;

//     /**
//      * WitTheh height of the GridRange in rows.
//      */
//     public readonly height:number;

//     /**
//      * The number of cells in the GridRange (will be different to length if some cell slots contain no cells).
//      */
//     public readonly count:number;

//     /**
//      * The length of the GridRange (number of rows * number of columns).
//      */
//     public readonly length:number;

//     private index:ObjectMap<GridCell>;

//     private constructor(values:any)
//     {
//         u.extend(this, values);
//     }

//     /**
//      * Indicates whether or not a cell is included in the range.
//      */
//     public contains(cellRef:string):boolean
//     {
//         if (!this.index)
//         {
//             this.index = u.index(this.ltr, x => x.ref);
//         }

//         return !!this.index[cellRef];
//     }
    
//     /**
//      * Returns an array of the references for all the cells in the range.
//      */
//     public refs():string[]
//     {
//         return this.ltr.map(x => x.ref);
//     }
// }

// function ltr_sort(a:GridCell, b:GridCell):number
// {
//     let n = 0;

//     n = a.rowRef - b.rowRef;
//     if (n === 0)
//     {
//         n = a.colRef - b.colRef;
//     }

//     return n;
// }

// function ttb_sort(a:GridCell, b:GridCell):number
// {
//     let n = 0;

//     n = a.colRef - b.colRef;
//     if (n === 0)
//     {
//         n = a.rowRef - b.rowRef;
//     }

//     return n;
// }

// function resolve_expr_ref(model:GridModel, value:string):GridCell
// {
//     const RefConvert = /([A-Za-z]+)([0-9]+)/g;

//     RefConvert.lastIndex = 0;
//     let result = RefConvert.exec(value);

//     let colRef = Base26.str(result[1]).num;
//     let rowRef = parseInt(result[2]) - 1;

//     return model.locateCell(colRef, rowRef);
// }