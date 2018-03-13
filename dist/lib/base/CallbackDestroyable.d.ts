import { AbstractDestroyable } from './AbstractDestroyable';
/**
 * Implements a Destroyable that accepts the destroy routine as a callback.
 */
export declare class CallbackDestroyable extends AbstractDestroyable {
    private callback;
    /**
     * Initializes a new instance of CallbackDestroyable.
     *
     * @param callback The callback to invoke on destroy.
     */
    constructor(callback: any);
    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    destroy(): void;
}
