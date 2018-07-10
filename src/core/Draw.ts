import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { Border } from '../vom/styling/Border';
import { Font } from '../vom/styling/Font';


export function border(gfx:CanvasRenderingContext2D, rect:Rect, styles:Border[])
{
    //styles[0] = default
    //styles[1] = top
    //styles[2] = right
    //styles[3] = bottom
    //styles[4] = left

    //top
    borderLine(gfx, [rect.topLeft(), rect.topLeft()], styles[1] || styles[0]);

    // line(gfx, pts, border.width, border.color, border.dash, border.offset);
}



export function line(gfx:CanvasRenderingContext2D, pts:Point[], width:number, color:string, dash:number[] = [], dashOffset = 0)
{
    if (!width) return;

    gfx.lineWidth = width;
    gfx.strokeStyle = color;
    gfx.setLineDash(dash);
    gfx.lineDashOffset = dashOffset;
    gfx.lineCap = 'square';

    gfx.beginPath();
    gfx.moveTo(pts[0].x, pts[0].y);

    for (let i = 1; i < pts.length; i++)
    {
        gfx.lineTo(pts[i].x, pts[i].y);
    }

    gfx.stroke();
}

export function text(gfx:CanvasRenderingContext2D, str:string, rect:Rect, font:Font, color:string, align:'left'|'right' = 'left')
{
    gfx.strokeStyle = null;
    gfx.fillStyle = color;
    gfx.font = font.toString();
    gfx.textBaseline = 'middle';
    gfx.textAlign = align;
    gfx.fillText(str, rect[align], rect.height / 2);
}

function borderLine(gfx:CanvasRenderingContext2D, pts:Point[], border:Border)
{
    line(gfx, pts, border.width, border.color, border.dash, border.offset);
}