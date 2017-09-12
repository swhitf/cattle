import { Border } from '../../vom/styling/Border';
import { Color } from '../../vom/styling/Color';
import { Styleable } from '../../vom/styling/Styleable';
import { Visual } from '../../vom/Visual';


export class NetVisual extends Visual
{
    public readonly canHost:boolean = false;
    public readonly type:string = 'net';

    @Styleable('transparent')
    public background:string;

    @Styleable(new Border(2, '#4285f4'))
    public border:Border;

    public render(gfx:CanvasRenderingContext2D):void
    {
        let { border } = this;

        gfx.lineWidth = border.width;
        gfx.strokeStyle = border.color;
        
        if (border.dash.length >= 2)
        {
            gfx.setLineDash(border.dash.slice(0, 2));
        }
        
        if (border.dash.length >= 3)
        {
            gfx.lineDashOffset = border.dash[2];
        }

        if (this.background)
        {
            gfx.fillStyle = this.background;
        }
        else
        {
            let bc = Color.parse(this.border.color);
            let fc = Color.rgba(bc.r, bc.g, bc.b, 0.1);
            gfx.fillStyle = fc.toString();
        }
        
        gfx.beginPath();
        gfx.rect(0, 0, this.width, this.height);
        gfx.fill();
        gfx.stroke();
    }
}