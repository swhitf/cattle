import { Destroyable } from './Destroyable';
export interface DestroyableCallback {
    (): void;
}
/**
 * Provides an abstract base class for Destroyable implementations.
 */
export declare class AbstractDestroyable implements Destroyable {
    private isDestroyed;
    private destroyables;
    /**
     * Throws an exception if this object has been destroyed.  Call this before operations that should be prevented
     * on a destroyed object.
     */
    protected guardDestroyed(): void;
    /**
     * Chains the specified Destroyable objects to this Destroyable so they are destroyed when this object is destroyed.
     *
     * @param objects the Destroyable objects
     */
    protected chain(...objects: Array<DestroyableCallback | Destroyable>): void;
    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    destroy(): void;
    /**
     * Indicates whether or not this object has been destroyed.
     */
    destroyed(): boolean;
}
