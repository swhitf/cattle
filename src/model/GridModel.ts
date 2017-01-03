import { ColumnModel } from './ColumnModel';
import { CellModel } from './CellModel';
import { RowModel } from './RowModel';


export interface GridModel
{
    readonly cells:CellModel[];
    readonly columns:ColumnModel[];
    readonly rows:RowModel[];
}