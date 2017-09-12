import { Destroyable } from './Destroyable';


/**
 * Provides an abstract base class for Destroyable implementations.
 */
export class AbstractDestroyable implements Destroyable
{
    private isDestroyed:boolean;
    private destroyables:Destroyable[] = [];

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
    protected chain(...objects:Destroyable[]):void
    {
        for (let i = 0; i < objects.length; i++)
        {
            this.destroyables.push(objects[i]);
        }
    }

    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    public destroy():void
    {
        this.guardDestroyed();

        for (let i = 0; i < this.destroyables.length; i++)
        {
            this.destroyables[i].destroy();
        }

        this.isDestroyed = true;
        this.destroyables = null;
    }

    /**
     * Indicates whether or not this object has been destroyed.
     */
    public destroyed():boolean
    {
        return this.isDestroyed;
    }
}