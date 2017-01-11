import { GridRow } from '../GridRow';


export class DefaultRow implements GridRow
{
    public readonly ref:number;
    public height:number;

    constructor(ref:number, height:number = 21)
    {
        this.ref = ref;
        this.height = height;
    }
}