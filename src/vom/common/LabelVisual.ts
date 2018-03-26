import { Observable } from '../../base/Observable';
import { Padding } from '../../geom/Padding';
import { Styleable } from '../../vom/styling/Styleable';
import { Visual } from '../../vom/Visual';
import { TextRuler } from '../layout/TextRuler';
import { Font } from '../styling/Font';


export class LabelVisual extends Visual
{
    public readonly canHost:boolean = false;
    public readonly type:string = 'label';

    @Styleable('transparent')
    public background:string;

    @Styleable('black')
    public foreground:string;

    @Styleable(Font.default)
    public font:Font;

    @Styleable(new Padding(3, 3, 3, 3))
    public padding:Padding;

    @Observable('')
    public text:string;

    public autoSize():void
    {
        this.size = TextRuler
            .measure(this.font, this.text)
            .add([this.padding.horizontal, this.padding.vertical]);
    }

    public render(gfx:CanvasRenderingContext2D):void
    {
        //Background
        gfx.fillStyle = this.background;
        gfx.fillRect(0, 0, this.width, this.height);

        //Paint text
        gfx.strokeStyle = null;
        gfx.fillStyle = this.foreground;
        gfx.font = this.font.toString();
        gfx.textBaseline = 'middle';
        gfx.fillText(
            this.text, 
            this.padding.left, 
            ((this.height - this.padding.vertical) / 2) + this.padding.top, 
            undefined,
        );
    }
}