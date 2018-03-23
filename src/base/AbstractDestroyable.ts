import { Destroyable } from './Destroyable';


export interface DestroyableCallback
{
    ():void;
}

/**
 * Provides an abstract base class for Destroyable implementations.
 */
export class AbstractDestroyable implements Destroyable
{
    private isDestroyed:boolean;
    private destroyables:DestroyableCallback[] = [];

    /**
     * Throws an exception if this object has been destroyed.  Call this before operations that should be prevented
     * on a destroyed object.
     */
    protected guardDestroyed():void
    {
        if (this.isDestroyed)
        {
            throw 'This object has been destroyed.';
        }
    }

    /**
     * Chains the specified Destroyable objects to this Destroyable so they are destroyed when this object is destroyed.
     *
     * @param objects the Destroyable objects
     */
    protected chain(...objects:Array<DestroyableCallback|Destroyable>):void
    {
        for (let i = 0; i < objects.length; i++)
        {
            this.destroyables.push(
                typeof(objects[i]) == 'function' 
                    ? objects[i]
                    : (objects[i] as Destroyable).destroy.bind(objects[i])
            );
        }
    }

    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    public destroy():void
    {
        this.guardDestroyed();

        this.destroyables.forEach(x => x());
        this.destroyables = null;
        this.isDestroyed = true;
    }

    /**
     * Indicates whether or not this object has been destroyed.
     */
    public destroyed():boolean
    {
        return this.isDestroyed;
    }
}