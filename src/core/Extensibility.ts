import { Destroyable } from '../base/Destroyable';
import { GridElement } from './GridElement';
import { GridKernel } from './GridKernel';


export interface GridExtension extends Destroyable
{
    init(grid:GridElement, kernel:GridKernel):void;
}

/**
 * Do not use directly.
 */
export interface ClassDef<T>
{
}

export function Dependency(name:string):any
{
    
}

/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs a task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
export function Command(name?:string):any
{
    return function(ctor:Object, key:string, descriptor:TypedPropertyDescriptor<Function>):void
    {
        const mdk = 'grid:commands';

        let list = Reflect.getMetadata(mdk, ctor);
        if (!list)
        {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }

        list.push({
            name: name || key,
            key: key,
            impl: descriptor.value,
        });
    };
}


/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
export function Routine(name?:string):any
{
    return function(ctor:Object, key:string, descriptor:TypedPropertyDescriptor<Function>):any
    {
        let routine = descriptor.value;
        let wrapper = function ()
        {
            let kernel = (this['__kernel'] || this['kernel']) as GridKernel;
            return kernel.routines.signal(key, Array.prototype.slice.call(arguments, 0), routine.bind(this));
        };

        return { value: wrapper };
    };
}

/**
 * A decorator that marks a field as a _variable_; a readable and optionally writable value that can be consumed by
 * extensions.  A name for the variable can be optionally specified, otherwise the name of the field being exported
 * as the variable will be used.
 * @param name The optional variable name
 * @returns decorator
 */
export function Variable(mutable:boolean):any;
export function Variable(name?:string, mutable?:boolean):any;
export function Variable(name:string|boolean, mutable?:boolean):any
{
    if (typeof(name) === 'boolean')
    {
        return Variable(undefined, name as boolean);
    }

    return function(ctor:Object, key:string):void
    {
        const mdk = 'grid:variables';

        let list = Reflect.getMetadata(mdk, ctor);
        if (!list)
        {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }

        list.push({
            name: name || key,
            key: key,
            mutable: mutable,
        });

        let valStoreKey = `__${name || key}`;
        
        Object.defineProperty(ctor, name || key, {
            configurable: false,
            enumerable: true,
            get: function() { 
                return this[valStoreKey]; 
            },
            set: function(newVal) { 
                this[valStoreKey] = newVal; 
            }
        });
    };
}