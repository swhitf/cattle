import { Base26 } from '../misc/Base26';
import { GridCellStyle } from './GridCellStyle';
import { Observable } from '../base/Observable';
import { GridObject } from './GridObject';
import * as u from '../misc/Util';


/**
 * Defines the parameters that can/should be passed to a new GridCell instance.
 */
export interface GridCellParams
{
    colRef:number;
    rowRef:number;
    value:string;
    style?:string[];
    type?:string;
    colSpan?:number;
    rowSpan?:number;
}

export interface GridCellRefParts
{
    readonly col:number;
    readonly row:number;
}





/**
 * Represents a cell within a grid.
 */
export class GridCell extends GridObject
{
    /**
     * Creates a cell reference string from the specified column and row references.
     * 
     * @param col 
     * @param row 
     */
    public static makeRef(col:number, row:number):string
    {
        return Base26.num(col).str + (row + 1).toString()
    }

    /**
     * Reads a cell reference string and returns the column and row reference values.
     * 
     * @param col 
     * @param row 
     */
    public static unmakeRef(cellRef:string):GridCellRefParts
    {
        let b26cr = '';
        let b10rr = '';

        for (let i = 0; i < cellRef.length; i++)
        {
            let c = cellRef.charAt(i);
            
            if (isNaN(+c))
            {
                b26cr += c;
            }
            else
            {
                b10rr = cellRef.substr(i);
            }
        }

        return { col: Base26.str(b26cr).num, row: parseInt(b10rr), };
    }

    /**
     * The cell ref, an excel-like reference to the location of the cell.
     */
    public readonly ref:string;

    /**
     * User specified cell that specifies the cell type; this is an arbitrary string that intended
     * to help with customization.
     */
    public readonly type:string;

    /**
     * The column reference that describes the horizontal position of the cell.
     */
    public readonly colRef:number;

    /**
     * The number of columns that this cell spans.
     */
    public readonly colSpan:number;

    /**
     * The row reference that describes the vertical position of the cell.
     */
    public readonly rowRef:number;

    /**
     * The number of rows that this cell spans.
     */
    public readonly rowSpan:number;

    /**
     * The style of the cell.
     */
    @Observable()
    public style:GridCellStyle;

    /**
     * The value of the cell.
     */
    @Observable()
    public value:string;

    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    constructor(params:GridCellParams)
    {
        super();

        this.ref = GridCell.makeRef(params.colRef, params.rowRef + 1);
        this.type = params.type || 'default';
        this.colRef = params.colRef;
        this.colSpan = params.colSpan || 1;
        this.rowRef = params.rowRef;
        this.rowSpan = params.rowSpan || 1;
        this.style = GridCellStyle.get(...(params.style || []));
        this.value = (params.value === undefined || params.value === null) ? '' : params.value;
    }
}