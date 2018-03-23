

export function Styleable(defaultValue?:any):any
{
    return function(target:any, propertyKey:string):PropertyDescriptor
    {
        if (!target['notifyChange']) 
        {
            throw 'Cannot mark Styleable property on object that does not provide an notifyChange method.';
        }

        return {
            configurable: false,
            enumerable: true,
            get: function() 
            { 
                const state = this['__state'] || (this['__state'] = {});
                const style = this['__style'] || (this['__style'] = {});
                
                if (state[propertyKey] !== undefined)
                {
                    return state[propertyKey];
                }

                if (style[propertyKey] !== undefined)
                {
                    return style[propertyKey];
                }

                return defaultValue;
            },
            set: function(value:any) 
            {   
                const emit = this['notifyChange'] as (property:string) => void;
                const state = this['__state'] || (this['__state'] = {});
                
                state[propertyKey] = value;
                emit.call(this, propertyKey);
            },
        }
    };
}