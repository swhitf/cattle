import { Predicate } from '../../common';
import { NetHandle } from './NetHandle';


/**
 * Defines the interface of an object that manages nets within a grid element.
 */
export interface NetManager
{   
    /**
     * The number of non-private nets that exist.
     */
    readonly count:number;

    /**
     * Creates a new net with the specified settings and returns a `NetHandle` object 
     * representing the net.
     * 
     * @param {string} id The id of the net - must be unique per grid.
     * @param {string} type The type of the net - used to identifiy behavior and styling.
     * @param {string} from A cell ref specifing the upper left position of the net.
     * @param {string} to An optional cell ref specifing the lower right position of the net.
     * @returns {NetHandle}
     */
    create(id:string, type:string, from:string, to?:string):NetHandle;

    /**
     * Creates a new net with the specified settings and returns a `NetHandle` object 
     * representing the net.  The net will be private in that it will not be accessible 
     * via any of the api methods on the manager object, except `get`.
     * 
     * @param {string} id The id of the net - must be unique per grid.
     * @param {string} type The type of the net - used to identifiy behavior and styling.
     * @param {string} from A cell ref specifing the upper left position of the net.
     * @param {string} to An optional cell ref specifing the lower right position of the net.
     * @returns {NetHandle}
     */
    createPrivate(id:string, type:string, from:string, to?:string):NetHandle;

    /**
     * Destroys the net with the specified id.  Throws an exception if the net does not exist.
     */
    destroy(id:string):void 
    
    /**
     * Gets the net with the specified id or `null` if no net exists.
     * 
     * @param {string} id The id of the net..
     * @returns {NetHandle}
     */
    get(id:string):NetHandle;

    /**
     * Gets the non-private net at the specified index within the manager or `null` if no net exists.
     * 
     * @param {number} index The index.
     * @returns {NetHandle}
     */
    item(index:number):NetHandle;

    /**
     * Returns an array of the public net handles that currently exist.  Optionally a filter can be specified
     * to reduce the results to a specific list.
     */
    toArray(filter?:Predicate<NetHandle>):NetHandle[];
}