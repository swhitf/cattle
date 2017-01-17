import { GridCell } from '../GridCell';
import * as _ from '../../misc/Util';
import * as shortid from 'shortid';
import { visualize, renderer } from '../../ui/Extensibility';


/**
 * Defines the parameters that can/should be passed to a new DefaultGridCell instance.
 */
export interface DefaultGridCellParams
{
    colRef:number;
    rowRef:number;
    value:string;
    ref?:string;
    colSpan?:number;
    rowSpan?:number;
}

/**
 * Provides a by-the-book implementation of GridCell.
 */
@renderer(draw)
export class DefaultGridCell implements GridCell
{
    /**
     * The cell reference, must be unique per GridModel instance.
     */
    public readonly ref:string;

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
     * The value of the cell.
     */
    public value:string;

    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    constructor(params:DefaultGridCellParams)
    {
        params.ref = params.ref || shortid.generate();
        params.colSpan = params.colSpan || 1;
        params.rowSpan = params.rowSpan || 1;
        params.value = (params.value === undefined || params.value === null) ? '' : params.value;

        _.extend(this, params);
    }
}

function draw(gfx:CanvasRenderingContext2D, visual:any):void
{
    gfx.lineWidth = 1;
    let av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;

    gfx.fillStyle = 'white';
    gfx.fillRect(-av, -av, visual.width, visual.height);

    gfx.strokeStyle = 'lightgray';
    gfx.strokeRect(-av, -av, visual.width, visual.height);

    gfx.fillStyle = 'black';
    gfx.textBaseline = 'middle';
    gfx.font = `13px Sans-Serif`;
    gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
}