export interface PropertyChangedCallback
{
    (obj:any, val:any):void
}

export function property(defaultValue:any, filter:PropertyChangedCallback)
{
    return function(ctor:any, propName:string):void
    {
        Object.defineProperty(ctor, propName, {
            configurable: false,
            enumerable: true,
            get: function()
            {
                let val = this['__' + propName];
                return (val === undefined) ? defaultValue : val;
            },
            set: function(newVal)
            {
                this['__' + propName] = newVal;
                filter(this, newVal);
            }
        });
    }
}