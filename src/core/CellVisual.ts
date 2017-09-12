import { Observable } from '../eventing/Observable';
import { GridCell } from '../model/GridCell';
import { Padding } from '../geom/Padding';
import { Border } from '../vom/styling/Border';
import { Font } from '../vom/styling/Font';
import { Styleable } from '../vom/styling/Styleable';
import { Visual } from '../vom/Visual';


export class CellVisual extends Visual
{
    private cellStyles = [] as string[];

    public readonly canHost:boolean = true;
    public readonly type:string = 'cell';

    @Observable()
    public ref:string;

    @Styleable('#fff')
    public background:string;

    @Styleable(Border.default)
    public border:Border;

    @Styleable('#111')
    public color:string;

    @Styleable(Font.default)
    public font:Font;

    @Styleable(Padding.hv(5, 0))
    public padding:Padding;

    @Observable()
    public text:string;

    public update(cell:GridCell):void
    {
        this.ref = cell.ref;
        this.text = cell.value;
        
        for (let cs of this.cellStyles)
        {
            this.classes.remove(cs);
        }

        this.cellStyles = [ cell.type ].concat(cell.style.toArray());

        for (let cs of this.cellStyles)
        {
            this.classes.add(cs);
        }
    }

    public render(gfx:CanvasRenderingContext2D):void
    {
        //Paint background
        gfx.fillStyle = this.background;
        gfx.fillRect(0, 0, this.width, this.height);

        //Paint border
        gfx.lineWidth = this.border.width;
        gfx.strokeStyle = this.border.color;
        gfx.setLineDash(this.border.dash);
        gfx.lineDashOffset = this.border.offset;
        gfx.strokeRect((gfx.lineWidth % 2) / 2, (gfx.lineWidth % 2) / 2, this.width, this.height);
        
        //Paint text
        gfx.strokeStyle = null;
        gfx.fillStyle = this.color;
        gfx.font = this.font.toString();
        gfx.textBaseline = 'middle';
        gfx.fillText(this.text, this.padding.left, ((this.height - this.padding.vertical) / 2) + this.padding.top, this.width - this.padding.horizontal);
    }
}