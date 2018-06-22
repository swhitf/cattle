

export class TileRef 
{
    public static DW = 160;
    public static DH = 160;

    public readonly x:number;
    public readonly y:number;
    public readonly s:string;

    constructor(x:number, y:number)
    {
        this.x = x;
        this.y = y;
        this.s = x + '/' + y;
    }

    public toString():string
    {
        return this.s;
    }
}