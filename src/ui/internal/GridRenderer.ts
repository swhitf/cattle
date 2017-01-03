//import { GridModel } from '../../model/GridModel';
//import { GridDimensions } from './GridDimensions';
//import { Renderer } from '../Renderer';
//
//
//export class GridRenderer implements Renderer<GridModel>
//{
//    constructor(private canvas:HTMLCanvasElement)
//    {
//    }
//
//    public draw(model:GridModel):void
//    {
//        //let gfx = this.canvas.getContext('2d');
//        //let dims = GridDimensions.compute(model);
//        //
//        //let w = this.canvas.width;
//        //let h = this.canvas.height;
//        //
//        //for (let cr in dims.columns)
//        //{
//        //    let c = dims.columns[cr];
//        //
//        //    gfx.lineWidth = 1;
//        //    gfx.strokeStyle = 'lightgray';
//        //    gfx.moveTo(c.left - 0.5, 0);
//        //    gfx.lineTo(c.left - 0.5, h);
//        //    gfx.stroke();
//        //
//        //    gfx.lineWidth = 1;
//        //    gfx.strokeStyle = 'lightgray';
//        //    gfx.moveTo(c.right - 0.5, 0);
//        //    gfx.lineTo(c.right - 0.5, h);
//        //    gfx.stroke();
//        //}
//        //
//        //for (let rr in dims.rows)
//        //{
//        //    let r = dims.rows[rr];
//        //
//        //    console.log(r);
//        //
//        //    gfx.lineWidth = 1;
//        //    gfx.strokeStyle = 'lightgray';
//        //    gfx.moveTo(0, r.top - 0.5);
//        //    gfx.lineTo(w, r.top - 0.5);
//        //    gfx.stroke();
//        //
//        //    gfx.lineWidth = 1;
//        //    gfx.strokeStyle = 'lightgray';
//        //    gfx.moveTo(0, r.bottom - 0.5);
//        //    gfx.lineTo(w, r.bottom - 0.5);
//        //    gfx.stroke();
//        //}
//        //
//        //for (let c of model.cells)
//        //{
//        //    let left =
//        //}
//    }
//}