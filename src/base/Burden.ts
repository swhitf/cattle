import { AbstractDestroyable, DestroyableCallback } from './AbstractDestroyable';
import { Destroyable } from './Destroyable';


export class Burden extends AbstractDestroyable
{
    public add(destroyable:Destroyable|DestroyableCallback):this
    {
        this.chain(destroyable);
        return this;
    }
}