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

    borderLine(gfx, 'top', rect, styles[1] || styles[0]);
    borderLine(gfx, 'right', rect, styles[2] || styles[0]);
    borderLine(gfx, 'bottom', rect, styles[3] || styles[0]);
    borderLine(gfx, 'left', rect, styles[4] || styles[0]);
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

export function text(gfx:CanvasRenderingContext2D, str:string, rect:Rect, font:Font, color:string, align:'left'|'center'|'right' = 'left', strike?:boolean)
{
    gfx.strokeStyle = null;
    gfx.fillStyle = color;
    gfx.font = font.toString();
    gfx.textBaseline = 'middle';
    gfx.textAlign = align;
    gfx.fillText(str, rectAlign(rect, align), rect.height / 2);

    if (strike)
    {
        let len = gfx.measureText(str).width;
        if (len > rect.width) len = rect.width;
        if (align === 'right') len *= -1;
 
        let pts = [
            new Point(rectAlign(rect, align), rect.height / 2),
            new Point(rectAlign(rect, align) + len, rect.height / 2),
        ];

        line(gfx, pts, 1, color);
    }
}

function borderLine(gfx:CanvasRenderingContext2D, edge:'top'|'right'|'bottom'|'left', rect:Rect, border:Border)
{
    if (!border) return;
    rect = rect.inflate([border.width * -0.5, border.width * -0.5]);
    line(gfx, borderEdge(rect, edge), border.width, border.color, border.dash, border.offset);
}

function borderEdge(rect:Rect, edge:'top'|'right'|'bottom'|'left')
{
    switch (edge) {
        default:
        case 'top': return [ rect.topLeft(), rect.topRight() ];
        case 'right': return [ rect.topRight(), rect.bottomRight() ];
        case 'bottom': return [ rect.bottomRight(), rect.bottomLeft() ];
        case 'left': return [ rect.bottomLeft(), rect.topLeft() ];
    }
}

function rectAlign(rect:Rect, align:'left'|'center'|'right') 
{
    switch (align)
    {
        default:
        case 'left': return rect.left;
        case 'center': return rect.left + (rect.width / 2);
        case 'right': return rect.right;
    }
}




