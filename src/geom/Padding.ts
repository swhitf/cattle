

export class Padding 
{
    public static empty = new Padding(0, 0, 0, 0);

    public static hv(h:number, v:number):Padding
    {
        return new Padding(v, h, v, h);
    }

    public readonly top:number;
    public readonly right:number;
    public readonly bottom:number;
    public readonly left:number;

    constructor(top?:number, right?:number, bottom?:number, left?:number) 
    {
        this.top = top || 0;
        this.right = right || 0;
        this.bottom = bottom || 0;
        this.left = left || 0;
    }

    public get horizontal():number 
    {
        return this.left + this.right;
    }

    public get vertical():number 
    {
        return this.top + this.bottom;
    }

    public copy(changes:Partial<Padding>):Padding
    {
        let c = (a, b) => a !== undefined ? a : b;

        return new Padding(
            c(changes.top, this.top),
            c(changes.right, this.right),
            c(changes.bottom, this.bottom),
            c(changes.left, this.left),
        );
    }
}