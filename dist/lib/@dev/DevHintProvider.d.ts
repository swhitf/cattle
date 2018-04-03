import { HintProvider } from '../extensions/hints/HintProvider';
import { GridCell } from '../model/GridCell';
export declare class DevHintProvider implements HintProvider {
    suggest(cell: GridCell, input: string): string;
}
