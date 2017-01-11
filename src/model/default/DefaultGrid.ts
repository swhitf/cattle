import { GridModel } from '../GridModel';
import { GridColumn } from '../GridColumn';
import { GridRow } from '../GridRow';
import { GridCell } from '../GridCell';


export class DefaultGrid implements GridModel
{
    public readonly cells: GridCell[] = [];
    public readonly columns: GridColumn[] = [];
    public readonly rows: GridRow[] = [];
}