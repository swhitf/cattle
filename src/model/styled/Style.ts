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

export class Cascading<T>
{
    public readonly parent:T;

    constructor(parent?:T, values?:any)
    {
        this.parent = parent || null;
        if (values)
        {
            extend(this, values);
        }
    }
}



export type TextAlignment = 'left'|'center'|'right';

export interface ValueFormatter
{
    (value:string, visual:any):string;
}

export class Style extends Cascading<Style>
{
    @cascade()
    public borderColor:string;

    @cascade()
    public fillColor:string;

    @cascade()
    public formatter:ValueFormatter;

    @cascade()
    public text:TextStyle;
}

export class TextStyle extends Cascading<TextStyle>
{
    public static Default:TextStyle = new TextStyle(null, {
        alignment: 'left',
        color: 'black',
        font: 'Segoe UI',
        size: 13,
        style: 'normal',
        variant: 'normal',
        weight: 'normal',
    });

    @cascade()
    public alignment:TextAlignment;

    @cascade()
    public color:string;

    @cascade()
    public font:string;

    @cascade()
    public size:number;

    @cascade()
    public style:string;

    @cascade()
    public variant:string;

    @cascade()
    public weight:string;
}

export const BaseStyle = new Style(null, {
    borderColor: 'lightgray',
    fillColor: 'white',
    formatter: v => v,
    text: new TextStyle(null, {
        alignment: 'left',
        color: 'black',
        font: 'Segoe UI',
        size: 13,
        style: 'normal',
        variant: 'normal',
        weight: 'normal',
    })
});