import { DefaultGridCell } from '../default/DefaultGridCell';
import { renderer, visualize } from '../../ui/Extensibility';


@renderer(draw)
export class FlexCell extends DefaultGridCell
{
    @visualize()
    public borderColor:string = 'lightgray';

    @visualize()
    public bgColor:string = 'white';

    @visualize()
    public fgColor:string = 'black';
}

function draw(gfx:CanvasRenderingContext2D, visual:any):void
{
    gfx.lineWidth = 1;
    let av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;

    gfx.fillStyle = visual.bgColor;
    gfx.fillRect(-av, -av, visual.width, visual.height);

    gfx.strokeStyle = visual.borderColor;
    gfx.strokeRect(-av, -av, visual.width, visual.height);

    gfx.fillStyle = visual.fgColor;
    gfx.textBaseline = 'middle';
    gfx.font = '13px Segoe UI';
    gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
}