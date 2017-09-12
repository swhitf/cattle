import { Point, PointLike } from '../geom/Point';
import { Rect, RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridColumn } from '../model/GridColumn';
import { GridRow } from '../model/GridRow';
import { GridLayout } from './GridLayout';


// private computeViewport():Rect
// {
//     return new Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
// }

export interface GridViewlet
{
    readonly key:string;
    readonly offsetLeft:number;
    readonly offsetTop:number;
    readonly left:number;
    readonly top:number;
    readonly width:number;
    readonly height:number;
}

export class GridView
{
    public readonly left:number;
    public readonly top:number;
    public readonly width:number;
    public readonly height:number;
    public readonly viewlets:GridViewlet[];

    public static compute(viewport:Rect, freezeMargin:Point, layout:GridLayout)
    {
        let main = new GridViewletImpl('main', viewport, Point.empty);
        
        if (freezeMargin.equals(Point.empty))
        {
            return new GridView(viewport, [ main ]);
        }
        else
        {
            let marginLeft = layout.measureColumnRange(0, freezeMargin.x).width;
            let marginTop = layout.measureRowRange(0, freezeMargin.y).height;
            let margin = new Point(marginLeft, marginTop);

            let top = new GridViewletImpl('left', 
                new Rect(viewport.left + margin.x, 0, viewport.width - margin.x, margin.y),
                new Point(margin.x, 0)
            );

            let left = new GridViewletImpl('left', 
                new Rect(0, viewport.top + margin.y, margin.x, viewport.height - margin.y),
                new Point(0, margin.y)
            );

            let topLeft = new GridViewletImpl('left', 
                new Rect(0, viewport.top + margin.y, margin.x, viewport.height - margin.y),
                new Point(0, margin.y)
            );

            return new GridView(viewport, [ main, top, left, topLeft ]);
        }
    }

    private constructor(viewport:Rect, viewlets:GridViewlet[])
    {
        this.left = viewport.left;
        this.top = viewport.top;
        this.width = viewport.width;
        this.height = viewport.height;
        this.viewlets = viewlets;
    }

    public captureColumns(region:RectLike):GridColumn[]
    {
        throw 'Not implemented';
    }

    public captureRows(region:RectLike):GridRow[]
    {
        throw 'Not implemented';
    }

    public captureCells(region:RectLike):GridCell[]
    {
        throw 'Not implemented';
    }

    public pickColumn(at:PointLike):GridColumn
    {
        throw 'Not implemented';
    }

    public pickRow(at:PointLike):GridRow
    {
        throw 'Not implemented';
    }

    public pickCell(at:PointLike):GridCell
    {
        throw 'Not implemented';
    }

}

class GridViewletImpl
{
    public constructor(key:string, rect:RectLike, offset:PointLike)
    {
        this.key = key;
        this.left = rect.left;
        this.top = rect.top;
        this.width = rect.width;
        this.height = rect.height;
        this.offsetLeft = offset.y;
        this.offsetTop = offset.y;
    }

    public readonly key:string;
    public readonly offsetLeft:number;
    public readonly offsetTop:number;
    public readonly left:number;
    public readonly top:number;
    public readonly width:number;
    public readonly height:number;
}

