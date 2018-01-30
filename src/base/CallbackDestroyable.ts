import { AbstractDestroyable } from './AbstractDestroyable';


/**
 * Implements a Destroyable that accepts the destroy routine as a callback.
 */
export class CallbackDestroyable extends AbstractDestroyable
{
    /**
     * Initializes a new instance of CallbackDestroyable.
     * 
     * @param callback The callback to invoke on destroy.
     */
    constructor(private callback:any)
    {
        super();
    }

    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    public destroy():void
    {
        super.destroy();
        this.callback();
    }
}