import { GridCell } from '../../model/GridCell';
export interface HintProvider {
    suggest(cell: GridCell, input: string): string;
}
