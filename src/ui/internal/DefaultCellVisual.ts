import { DefaultCell } from '../../model/default/DefaultCell';
import { Visual } from './Visual';


export class DefaultCellVisual implements Visual
{
    constructor(public left:number = 0,
                public top:number = 0,
                public width:number = 0,
                public height:number = 0)
    {
    }

    public draw(gfx:CanvasRenderingContext2D, model:DefaultCell):void
    {
        gfx.strokeStyle = 'black';
        gfx.strokeRect(this.left, this.top, this.width, this.height);
    }
}