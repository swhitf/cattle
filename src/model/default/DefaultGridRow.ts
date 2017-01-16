import { GridRow } from '../GridRow';


/**
 * Provides a by-the-book implementation of GridRow.
 */
export class DefaultGridRow implements GridRow
{
    /**
     * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
     * row within the grid based on a zero-index.
     */
    public readonly ref:number;

    /**
     * The height of the column.
     */
    public height:number;

    /**
     * Initializes a new instance of DefaultGridRow.
     *
     * @param ref
     * @param height
     */
    constructor(ref:number, height:number = 21)
    {
        this.ref = ref;
        this.height = height;
    }
}