/**
 * Common interface for the deterministic release of resources.
 */
export interface Destroyable {
    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    destroy(): void;
    /**
     * Indicates whether or not this object has been destroyed.
     */
    destroyed(): boolean;
}
