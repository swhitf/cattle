import { RowModel } from '../RowModel';


export class DefaultRow implements RowModel
{
    public readonly ref:number;
    public height:number;

    constructor(ref:number, height:number = 21)
    {
        this.ref = ref;
        this.height = height;
    }
}