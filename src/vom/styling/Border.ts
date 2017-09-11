

export class Border
{   
    public static readonly default:Border = new Border();

    public readonly width:number;
    public readonly color:string;
    public readonly dash:number[];
    public readonly offset:number;

    constructor(width?:number, color?:string, dash?:number[], offset?:number)
    {
        this.width = (width !== undefined) ? width : 1;
        this.color = color || 'gainsboro';
        this.dash = dash || []; 
        this.offset = offset || 0;
    }

    public copy(changes?:Partial<Border>):Border
    {
        changes = (changes || {});

        return new Border(
            (changes.width !== undefined) ? changes.width : this.width,
            changes.color || this.color,
            changes.dash || this.dash,
            (changes.offset !== undefined) ? changes.offset : this.offset
        )
    }
}