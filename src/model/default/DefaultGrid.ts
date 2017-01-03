import { GridModel } from '../GridModel';
import { ColumnModel } from '../ColumnModel';
import { RowModel } from '../RowModel';
import { CellModel } from '../CellModel';


export class DefaultGrid implements GridModel
{
    public readonly cells: CellModel[] = [];
    public readonly columns: ColumnModel[] = [];
    public readonly rows: RowModel[] = [];
}