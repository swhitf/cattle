import { coalesce } from '../misc/Util';


export class Padding 
{
    public static empty = new Padding(0, 0, 0, 0);

    public readonly top:number;
    public readonly right:number;
    public readonly bottom:number;
    public readonly left:number;

    constructor(top?:number, right?:number, bottom?:number, left?:number) 
    {
        this.top = coalesce(top, 0);
        this.right = coalesce(right, this.top);
        this.bottom = coalesce(bottom, this.top);
        this.left = coalesce(left, this.right);
    }

    public get horizontal():number 
    {
        return this.left + this.right;
    }

    public get vertical():number 
    {
        return this.top + this.bottom;
    }

    public inflate(by:number):Padding
    {
        return new Padding(
            this.top + by,
            this.right + by,
            this.bottom + by,
            this.left + by,
        );
    }
}