import { ColumnModel } from '../ColumnModel';


export class DefaultColumn implements ColumnModel
{
    public readonly ref:number;
    public width:number;

    constructor(ref:number, width:number = 100)
    {
        this.ref = ref;
        this.width = width;
    }
}