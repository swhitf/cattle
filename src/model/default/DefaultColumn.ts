import { GridColumn } from '../GridColumn';


export class DefaultColumn implements GridColumn
{
    public readonly ref:number;
    public width:number;

    constructor(ref:number, width:number = 100)
    {
        this.ref = ref;
        this.width = width;
    }
}