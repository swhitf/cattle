import { RectLike, Rect } from '../geom/Rect';
/**
 * Defines the base interface of a widget.  A widget is an object that represents a UI element within the context of
 * a grid.  It can be composed of one or more DOM elements and be interactable or static.  The Widget interfaces
 * provides a common interface through which modules or consumers can access the underlying DOM elements of a widget
 * and basic methods that ease the manipulation of widgets.
 */
export interface Widget {
    /**
     * The root HTMLElement of the widget.
     */
    readonly root: HTMLElement;
    /**
     * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
     */
    readonly viewRect: Rect;
    /**
     * Hides the whole widget.
     */
    hide(): void;
    /**
     * Shows the whole widget.
     */
    show(): void;
    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    toggle(visible: boolean): void;
}
/**
 * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
 * absolutely positioned root elements.
 */
export declare class AbsWidgetBase<T extends HTMLElement> implements Widget {
    root: T;
    constructor(root: T);
    /**
     * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
     */
    readonly viewRect: Rect;
    /**
     * Moves the Widget to the specified position relative to the viewport of the grid.
     *
     * @param viewRect
     * @param animate
     */
    goto(viewRect: RectLike, autoShow?: boolean): void;
    /**
     * Hides the whole widget.
     */
    hide(): void;
    /**
     * Shows the whole widget.
     */
    show(): void;
    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    toggle(visible: boolean): void;
}
