import { GridCell } from '../model/GridCell';
import { GridKernel } from './../ui/GridKernel';
import { GridElement, GridMouseEvent, GridMouseDragEvent } from './../ui/GridElement';
import { GridModelIndex } from '../model/GridModelIndex';
import { KeyInput } from '../input/KeyInput';
import { Point } from '../geom/Point';
import { RectLike, Rect } from '../geom/Rect';
import { MouseInput } from '../input/MouseInput';
import { MouseDragEventSupport } from '../input/MouseDragEventSupport';
import { MouseDragEvent } from '../input/MouseDragEvent';
import * as Tether from 'tether';
import * as Dom from '../misc/Dom';


export class TestExtension
{
    private layer:HTMLElement;

    public init(grid:GridElement, kernel:GridKernel)
    {
        //kernel.override('select', (cells:string[], autoScroll:boolean, original:Function) =>
        //{
        //    original.call(this, cells, autoScroll);
        //});
    }
}