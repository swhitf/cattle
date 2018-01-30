import { Surface } from '../vom/Surface';
import { Point, PointLike } from '../geom/Point';
import { Rect, RectLike } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { GridColumn } from '../model/GridColumn';
import { GridRow } from '../model/GridRow';
import { GridLayout } from './GridLayout';


export class GridView
{
    constructor(private layout:GridLayout, private surface:Surface) 
    {
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
    
    public measureColumn(ref:number):RectLike
    {
        throw 'Not implemented';
    }

    public measureColumnRange(fromRef:number, toRefEx:number):RectLike
    {
        throw 'Not implemented';
    }

    public measureRow(ref:number):RectLike
    {
        throw 'Not implemented';
    }

    public measureRowRange(fromRef:number, toRefEx:number):RectLike
    {
        throw 'Not implemented';
    }

    public measureCell(ref:string):RectLike
    {
        const { layout, surface } = this;

        let rect = Rect.fromLike(layout.measureCell(ref));
        
        for (let i = 0; i < surface.cameras.count; i++)
        {
            let cam = surface.cameras.item(i);

            if (rect.intersects(cam.area))
            {
                let viewPt = cam.toViewPoint('surface', rect.topLeft());
                return new Rect(viewPt.x, viewPt.y, rect.width, rect.height);
            }
        }

        return null;
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

