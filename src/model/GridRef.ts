import { Point } from '../geom/Point';
import { Base26 } from '../misc/Base26';
import { GridCellRefParts } from './GridCell';


export abstract class GridRef
{
    /**
     * Compares two cell refs and returns -1 if a is less than b, 1 if a is greater than b, otherwise 0.
     * 
     * @param a 
     * @param b 
     */
    public static compare(a:string, b:string):number
    {
        const [ax, ay] = this.unmakeToArray(a);
        const [bx, by] = this.unmakeToArray(b);

        const yd = ay - by;

        if (yd == 0) return ax - bx;
        else return yd;
    }

    /**
     * Determines whether or not the specified string is a valid cell reference.
     * 
     * @param str 
     */
    public static valid(str:string):boolean
    {
        return !!(str || '').match(/[A-Za-z]+\d+/);
    }

    /**
     * Creates a cell reference string from the specified column and row references.
     * 
     * @param col 
     * @param row 
     */
    public static make(col:number, row:number):string
    {
        return Base26.num(col).str + (row + 1).toString()
    }

    /**
     * Reads a cell reference string and returns the column and row reference values.
     * 
     * @param cellRef 
     */
    public static unmake(cellRef:string):GridCellRefParts
    {
        let b26cr = '';
        let b10rr = '';

        for (let i = 0; i < cellRef.length; i++)
        {
            let c = cellRef.charAt(i);
            
            if (!isNaN(+c))
            {
                b26cr = cellRef.slice(0, i);
                b10rr = cellRef.slice(i, cellRef.length);
                break;
            }
        }

        return { col: Base26.str(b26cr).num, row: parseInt(b10rr) - 1, };
    }

    /**
     * Reads a cell reference string and returns the column and row as the first and 
     * second values in an array.
     * 
     * @param cellRef 
     */
    public static unmakeToArray(cellRef:string):number[]
    {
        let parts = this.unmake(cellRef);
        return [parts.col, parts.row];
    }

    /**
     * Creates a Point from a cell reference with the x as the column and y as the row.
     * 
     * @param cellRef 
     */
    public static toPoint(cellRef:string):Point
    {
        return Point.create(this.unmakeToArray(cellRef));
    }
}