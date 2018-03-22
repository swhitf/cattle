import { Observable } from '../../base/Observable';
import { Animation } from '../../vom/styling/Animate';
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

    @Styleable(new Border(1, '#4285f4'))
    public border:Border;

    @Styleable(false)
    public animateBorder:boolean;

    @Observable(0)
    protected borderOffset;

    private borderAnimation:Animation;

    public render(gfx:CanvasRenderingContext2D):void
    {
        let { border } = this;

        let offset = (border.width % 2) / 2; 
        let deflate = Math.floor(border.width / 2);

        gfx.lineWidth = border.width;
        gfx.strokeStyle = border.color;
        
        if (border.dash.length >= 2)
        {
            gfx.setLineDash(border.dash.slice(0, 2));
            gfx.lineDashOffset = this.borderOffset;
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
        if (deflate)
            gfx.rect(offset + deflate, offset + deflate, this.width - (deflate * 2) + 1, this.height - (deflate * 2) + 1);
        else
            gfx.rect(offset + deflate, offset + deflate, this.width, this.height);
        gfx.fill();
        gfx.stroke();
    }

    protected visualStyleDidChange():void
    {
        this.doAnimateBorder();
    }

    protected visualWillMount():void 
    {
        this.zIndex = 1;
    }

    protected notifyChange(property:string)
    {
        if (property == 'animateBorder')
        {
            this.doAnimateBorder();
        }

        super.notifyChange(property);
    }

    private doAnimateBorder()
    {
        if (this.animateBorder && !this.borderAnimation)
        {
            this.borderAnimation = this.animate()
                .every(50, x => x.borderOffset += 1.5)
                .get();
        }
        else if (!this.animateBorder && this.borderAnimation)
        {
            this.borderAnimation.cancel();
            delete this.borderAnimation;
        }
    }
}