

export type ObservableValueFilter = (val:any) => any;

export function Observable(defaultValue?:any, valueFilter?:ObservableValueFilter|string):any
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

                if (valueFilter)
                {
                    const vf = typeof(valueFilter) === 'function' 
                        ? valueFilter
                        : this[valueFilter].bind(this);

                    value = vf(value);                    
                }

                state[propertyKey] = value;
                emit.call(this, propertyKey);
            },
        }
    };
}