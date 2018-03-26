import { AbstractDestroyable, DestroyableCallback } from './AbstractDestroyable';
import { Destroyable } from './Destroyable';
export declare class Burden extends AbstractDestroyable {
    add(destroyable: Destroyable | DestroyableCallback): this;
}
