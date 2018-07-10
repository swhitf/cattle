import { GridModel } from './GridModel';



const next = (function() {
    let val = Number.MIN_SAFE_INTEGER;
    return function() {
        return val++;
    };
})();

/**
 * Represents an object within a grid model.
 */
export class GridObject
{
    private __model:GridModel;
    private __version:number = next();
    private __props = {} as { [key:string]:any };

    /**
     * Gets a numerical value that represents the unique version of the element.  When an Observable()
     * property on the element changes, the version will change.  It will never change back to the
     * same value.  This is used for dirty tracking.
     */
    public get version():number
    {
        return this.__version;
    }

    /**
     * Gets or sets a prop value for the object.  When setting will return the previous value.
     * 
     * @param key 
     * @param value 
     */
    public prop(key:string, value?:any):any
    {
        const ret = this.__props[key]; 

        if (value !== undefined)
        {
            this.__props[key] = value;
            this.notifyChange(`prop:${key}`);
        }

        return ret;
    }

    protected notifyChange(property?:string):void
    {
        this.__version = next();
        if (this.__model)
        {
            this.__model['notifyChange'](this);
        }
    }

    private connect(model:GridModel):void
    {
        if (this.__model) throw 'GridObject is already part of an existing GridModel.';
        this.__model = model;
        model['notifyChange'](this);
    }

    private disconnect(model:GridModel):void
    {
        if (this.__model != model) throw 'Invalid GridObject.disconnect call.';
        this.__model = null;
        model['notifyChange'](this);
    }
}