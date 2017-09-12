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
    id?:string;
    colSpan?:number;
    rowSpan?:number;
}

/**
 * Represents a cell within a grid.
 */
export class GridCell extends GridObject
{
    /**
     * The cell id, must be unique per GridModel instance.
     */
    public readonly id:string;

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

        params.type = params.type || 'default';
        params.id = params.id || Ident.next();
        params.colSpan = params.colSpan || 1;
        params.rowSpan = params.rowSpan || 1;        
        params.value = (params.value === undefined || params.value === null) ? '' : params.value;

        u.extend(this, params);
        this.style = GridCellStyle.get(...(params.style || []));
    }
}