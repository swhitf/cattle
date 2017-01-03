import { CellModel } from '../CellModel';
import * as shortid from 'shortid';


export class DefaultCell implements CellModel
{
    public readonly ref:string;
    public readonly colRef: number;
    public readonly rowRef: number;

    public colSpan: number = 1;
    public rowSpan: number = 1;
    public value:any = '';

    constructor(colRef:number, rowRef:number, ref:string = null, value:any = null)
    {
        this.colRef = colRef;
        this.rowRef = rowRef;
        this.ref = ref || shortid.generate();
        this.value = value;
    }
}