

/**
 * Represents an object within a grid model.
 */
export class GridObject
{
    private n:number = Number.MIN_VALUE;

    /**
     * Gets a numerical value that represents the unique state of the element.  When an Observable()
     * property on the element changes, the nonce will change.  It will never change back to the
     * same value.  This is used for dirty tracking.
     */
    public get nonce():number
    {
        return this.n;
    }

    private notifyChange(property:string):void
    {
        this.n++;
    }
}