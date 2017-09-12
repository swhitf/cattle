import { GridObject } from './GridObject';
import { Observable } from '../eventing/Observable';


/**
 * Represents a grid row.
 */
export class GridRow extends GridObject
{
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
    constructor(ref:number, height:number = 21)
    {
        super();

        this.ref = ref;
        this.height = height;
    }
}