

export function Observable(defaultValue?:any):any
{
    return function(target:any, propertyKey:string):PropertyDescriptor
    {
        if (!target['notifyChange']) 
        {
            throw 'Cannot mark Observable property on object that does not provide an notifyChange method.';
        }

        return {
            configurable: false,
            enumerable: true,
            get: function() 
            { 
                const state = this['__state'] || (this['__state'] = {});

                if (state[propertyKey] !== undefined)
                {
                    return state[propertyKey];
                }

                return defaultValue;
            },
            set: function(value:any) 
            {   
                const emit = this['notifyChange'] as (property:string) => void;
                const state = this['__state'] || (this['__state'] = {});

                if ((value === undefined || value === null) && !(defaultValue === undefined || defaultValue === null))
                {
                    value = defaultValue;
                }

                state[propertyKey] = value;
                emit.call(this, propertyKey);
            },
        }
    };
}