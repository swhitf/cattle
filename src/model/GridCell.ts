

export interface GridCell
{
    readonly ref:string;

    colRef:number;

    colSpan:number;
    
    rowRef:number;

    rowSpan:number;

    value:any;
}