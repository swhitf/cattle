

export interface KeySequence
{
    readonly length:number;

    item(index:number):number;
    
    contains(key:number):boolean;

    toArray():number[];
}