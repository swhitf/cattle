import { Observable } from '../base/Observable';
import { Padding } from '../geom/Padding';
import { Rect } from '../geom/Rect';
import { GridCell } from '../model/GridCell';
import { Border } from '../vom/styling/Border';
import { Font } from '../vom/styling/Font';
import { Styleable } from '../vom/styling/Styleable';
import { Visual } from '../vom/Visual';
import * as draw from './Draw';


export class CellVisual extends Visual
{
    private cellStyles = [] as string[];

    public readonly canHost:boolean = true;
    public readonly type:string = 'cell';

    @Observable()
    public ref:string;

    @Styleable('#fff')
    public background:string;

    @Styleable()
    public border:Border;

    @Styleable()
    public borderLeft:Border;

    @Styleable()
    public borderTop:Border;

    @Styleable()
    public borderRight:Border;

    @Styleable()
    public borderBottom:Border;

    @Styleable('#111')
    public color:string;

    @Styleable(Font.default)
    public font:Font;

    @Styleable(Padding.hv(5, 0))
    public padding:Padding;

    @Styleable('left')
    public textAlign:'left'|'center'|'right';

    @Styleable(false)
    public textStrike:boolean;

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
        gfx.fillRect(1, 1, this.width - 1, this.height - 1);
        
        //Paint border
        draw.border(gfx, new Rect(0, 0, this.width + 1, this.height + 1), [
            this.border,
            this.borderTop,
            this.borderRight,
            this.borderBottom,
            this.borderLeft,
        ]);

        //Paint text
        draw.text(
            gfx, 
            this.text, 
            new Rect(this.padding.left, this.padding.top, this.width - this.padding.horizontal, this.height - this.padding.vertical),
            this.font,
            this.color,
            this.textAlign,
            this.textStrike,
        );
    }
}