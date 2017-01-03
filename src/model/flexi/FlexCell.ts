import { DefaultCell } from '../default/DefaultCell';
import { Rect } from '../../geom/Rect';
import { renderer } from '../../ui/Renderer';


@renderer(draw)
export class FlexCell extends DefaultCell
{
}

function draw(gfx:CanvasRenderingContext2D, region:Rect, cell:FlexCell):void
{
    gfx.fillStyle = 'white';
    gfx.strokeStyle = 'lightgray';
    gfx.lineWidth = 1;

    let av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;

    gfx.fillRect(-av, -av, region.width, region.height);
    gfx.strokeRect(-av, -av, region.width, region.height);

    gfx.fillStyle = 'black';
    gfx.textBaseline = 'middle';
    gfx.font = '13px Segoe UI';
    gfx.fillText(cell.value, 3, 0 + (region.height / 2));
}