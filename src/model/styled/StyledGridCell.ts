import { DefaultGridCell } from '../default/DefaultGridCell';
import { Style, BaseStyle } from './Style';
import { renderer, visualize } from '../../ui/Extensibility';


@renderer(draw)
export class StyledGridCell extends DefaultGridCell
{
    @visualize()
    public style:Style = BaseStyle;
}

function draw(gfx:CanvasRenderingContext2D, visual:any):void
{
    let style = visual.style as Style;

    gfx.lineWidth = 1;
    let av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;

    gfx.fillStyle = style.fillColor;
    gfx.fillRect(-av, -av, visual.width, visual.height);

    gfx.strokeStyle = style.borderColor;
    gfx.strokeRect(-av, -av, visual.width, visual.height);

    gfx.fillStyle = style.textColor;
    gfx.textBaseline = 'middle';
    gfx.font = `${style.textSize}px ${style.textFont}`;
    gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
}