import { RectLike, Rect } from '../geom/Rect';
import * as Dom from '../misc/Dom';


/**
 * Defines the base interface of a widget.  A widget is an object that represents a UI element within the context of
 * a grid.  It can be composed of one or more DOM elements and be interactable or static.  The Widget interfaces
 * provides a common interface through which modules or consumers can access the underlying DOM elements of a widget
 * and basic methods that ease the manipulation of widgets.
 */
export interface Widget
{
    /**
     * The root HTMLElement of the widget.
     */
    readonly root:HTMLElement;

    /**
     * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
     */
    readonly viewRect:Rect;

    /**
     * Hides the whole widget.
     */
    hide():void;

    /**
     * Shows the whole widget.
     */
    show():void;

    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    toggle(visible:boolean):void;
}

/**
 * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
 * absolutely positioned root elements.
 */
export class AbsWidgetBase<T extends HTMLElement> implements Widget
{
    constructor(public root:T)
    {
    }

    /**
     * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
     */
    public get viewRect():Rect
    {
        return new Rect
        (
            parseFloat(this.root.style.left),
            parseFloat(this.root.style.top),
            this.root.clientWidth,
            this.root.clientHeight
        );
    }

    /**
     * Moves the Widget to the specified position relative to the viewport of the grid.
     *
     * @param viewRect
     * @param animate
     */
    public goto(viewRect:RectLike, autoShow:boolean = true):void
    {
        if (autoShow)
        {
            Dom.show(this.root);
        }

        Dom.css(this.root, {
            left: `${viewRect.left - 1}px`,
            top: `${viewRect.top - 1}px`,
            width: `${viewRect.width + 1}px`,
            height: `${viewRect.height + 1}px`,
            overflow: `hidden`,
        });
    }

    /**
     * Hides the whole widget.
     */
    public hide():void
    {
        Dom.hide(this.root);
    }

    /**
     * Shows the whole widget.
     */
    public show():void
    {
        Dom.show(this.root);
    }

    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    public toggle(visible:boolean):void
    {
        Dom.toggle(this.root, visible)
    }
}