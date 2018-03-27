import { Observable } from '../base/Observable';
import { GridObject } from './GridObject';


/**
 * Represents a grid column.
 */
export class GridColumn extends GridObject
{
    /**
     * The default width of a row; this can be altered.
     */
    public static defaultWidth = 100;

    /**
     * The column reference, must be unique per GridModel instance.  Used to indicate the position of the
     * column within the grid based on a zero-index.
     */
    public readonly ref:number;

    /**
     * The width of the column.
     */
    @Observable()
    public width:number;

    /**
     * Initializes a new instance of DefaultGridColumn.
     *
     * @param ref
     * @param width
     */
    constructor(ref:number, width:number = GridColumn.defaultWidth)
    {
        super();
        
        this.ref = ref;
        this.width = width;
    }
}