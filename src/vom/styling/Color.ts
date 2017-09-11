import * as parse from 'parse-color';


interface ColorData
{
    readonly rgb:number[];
    readonly hsl:number[];
    readonly hsv:number[];
    readonly cmyk:number[];
    readonly keyword:string;
    readonly hex:string;
    readonly rgba:number[];
    readonly hsla:number[];
    readonly hsva:number[];
    readonly cmyka:number[];
}

export class Color
{
    public static rgba(r:number, g:number, b:number, a:number = 1):Color
    {
        return Color.parse(`rgba(${r},${g},${b},${a})`);
    }

    public static parse(cs:string):Color
    {
        return new Color(parse(cs));
    }

    private readonly data:ColorData;

    private constructor(data:ColorData)
    {
        this.data = data;
    }

    public get name():string { return this.data.keyword || null; }

    public get r():number { return this.data.rgba[0]; }
    public get g():number { return this.data.rgba[1]; }
    public get b():number { return this.data.rgba[2]; }
    public get a():number { return this.data.rgba[3]; }

    public get h():number { return this.data.hsl[0]; }
    public get s():number { return this.data.hsl[1]; }
    public get l():number { return this.data.hsl[2]; }

    public toString():string
    {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
}