//@no-export


export class Key
{
    public readonly id:string;
    public readonly sort:number;
    
    constructor(id:string, sort:number = 0)
    {
        this.id = id;
        this.sort = sort;
    }

    public toString():string
    {
        return `${this.sort}/${this.id}`;
    }
}