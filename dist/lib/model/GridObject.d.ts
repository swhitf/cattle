/**
 * Represents an object within a grid model.
 */
export declare class GridObject {
    private n;
    /**
     * Gets a numerical value that represents the unique state of the element.  When an Observable()
     * property on the element changes, the nonce will change.  It will never change back to the
     * same value.  This is used for dirty tracking.
     */
    readonly nonce: number;
    private notifyChange(property);
}
