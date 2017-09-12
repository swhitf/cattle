import { Base26 } from '../misc/Base26';
import { GridCellStyle } from './GridCellStyle';
import { Observable } from '../eventing/Observable';
import { GridObject } from './GridObject';
import { Ident } from '../misc/Ident';
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

/**
 * Represents a cell within a grid.
 */
export class GridCell extends GridObject
{
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

        this.ref = Base26.num(params.colRef).str + params.rowRef.toString();
        this.type = params.type || 'default';
        this.colRef = params.colRef;
        this.colSpan = params.colSpan || 1;
        this.rowRef = params.rowRef;
        this.rowSpan = params.rowSpan || 1;
        this.style = GridCellStyle.get(...(params.style || []));
        this.value = (params.value === undefined || params.value === null) ? '' : params.value;
    }
}