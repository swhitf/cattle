import { Observable } from '../base/Observable';
import { GridObject } from './GridObject';


/**
 * Represents a grid row.
 */
export class GridRow extends GridObject
{
    /**
     * The default height of a row; this can be altered.
     */
    public static defaultHeight = 21;

    /**
     * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
     * row within the grid based on a zero-index.
     */
    public readonly ref:number;

    /**
     * The height of the column.
     */
    @Observable()
    public height:number;

    /**
     * Initializes a new instance of DefaultGridRow.
     *
     * @param ref
     * @param height
     */
    constructor(ref:number, height:number = GridRow.defaultHeight)
    {
        super();

        this.ref = ref;
        this.height = height;
    }
}