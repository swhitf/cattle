import { GridColumn } from './GridColumn';
import { GridCell } from './GridCell';
import { GridRow } from './GridRow';


export interface GridModel
{
    readonly cells:GridCell[];
    readonly columns:GridColumn[];
    readonly rows:GridRow[];
}