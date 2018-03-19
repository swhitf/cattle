import { RectLike } from '../../geom/Rect';
/**
 * Provides an interface with which consumers can manipulate a net instance.
 */
export interface NetHandle {
    /**
     * The id of the net.
     */
    readonly id: string;
    /**
     * The net type.
     */
    readonly type: string;
    /**
     * The grid-based bounds of the net.
     */
    readonly bounds: RectLike;
    /**
     * The ref of the cell in the upper left corner of the net.
     */
    readonly fromRef: string;
    /**
     * The ref of the cell in the lower right corner of the net.  For a single cell net this
     * will be the same as `fromRef`.
     */
    readonly toRef: string;
    /**
     * Sets the optional text label that appears above the net.
     */
    label: string;
    /**
     * Controls whether or not the net is visible.
     */
    visible: boolean;
    /**
     * Moves the net so that it covers the area between the cells specified by the from and
     * cell ref values.  From will be the upper left and to will be the lower right.
     */
    move(from: string, to?: string): void;
}
