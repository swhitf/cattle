import { DefaultGridCell, DefaultGridCellParams } from '../default/DefaultGridCell';
import { Style } from './Style';
/**
 * Defines the parameters that can/should be passed to a new StyledGridCell instance.
 */
export interface StyledGridCellParams extends DefaultGridCellParams {
    placeholder?: string;
    style?: Style;
}
export declare class StyledGridCell extends DefaultGridCell {
    style: Style;
    placeholder: string;
    /**
     * Initializes a new instance of StyledGridCell.
     *
     * @param params
     */
    constructor(params: StyledGridCellParams);
}
