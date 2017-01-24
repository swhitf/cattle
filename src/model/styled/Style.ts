import { extend } from '../../misc/Util';


export function cascade():PropertyDecorator
{
    return function(ctor:Object, key:string):PropertyDescriptor
    {
        let pk = `__${key}`;

        return {
            enumerable: true,
            get: function():void
            {
                return this[pk] || (!!this.parent ? this.parent[key] : null);
            },
            set: function(val:any):void
            {
                this[pk] = val;
            }
        };
    };
}


export type TextAlignment = 'left'|'center'|'right';

export class Style
{
    public readonly parent:Style;

    @cascade()
    public borderColor:string;

    @cascade()
    public fillColor:string;

    @cascade()
    public textAlignment:TextAlignment;

    @cascade()
    public textColor:string;

    @cascade()
    public textFont:string;

    @cascade()
    public textSize:number;

    @cascade()
    public textStyle:string;

    @cascade()
    public textVariant:string;

    @cascade()
    public textWeight:string;

    constructor(parent?:Style, values?:any)
    {
        this.parent = parent || null;
        if (values)
        {
            extend(this, values);
        }
    }
}

export const BaseStyle = new Style(null, {
    borderColor: 'lightgray',
    fillColor: 'white',
    textAlignment: 'left',
    textColor: 'black',
    textFont: 'Segoe UI',
    textSize: 13,
    textStyle: 'normal',
    textVariant: 'normal',
    textWeight: 'normal',
});