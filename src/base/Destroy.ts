import { Destroyable } from './Destroyable';


/**
 * Helper function that destroys a Destroyable if the reference is valid and it has not been destroyed.
 *
 * @param d the destroyable
 * @returns {boolean} whether any action was taken
 */
export function safely(d:Destroyable):boolean
{
    if (!!d && !d.destroyed())
    {
        d.destroy();
        return true;
    }

    return false;
}

/**
 * Helper function that destroys a Destroyable after the specified callback has been executed.
 *
 * @param d the destroyable
 * @param callback the callback
 */
export function after<T extends Destroyable>(d:T, callback:(d:T) => void):void
{
    callback(d);
    safely(d);
}