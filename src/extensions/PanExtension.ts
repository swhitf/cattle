import { GridExtension, GridElement, GridMouseEvent } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import { KeyInput } from '../input/KeyInput';
import { command } from '../ui/Extensibility';
import * as _ from '../misc/Util'
import { MouseInput } from '../input/MouseInput';
import { Point } from '../geom/Point';
import { Keys } from '../input/Keys';


export class PanExtension implements GridExtension
{
    public init(grid:GridElement, kernel:GridKernel)
    {
        let panning = false;
        let last = null as Point;

        grid.on('keydown', (e:KeyboardEvent) =>
        {
            if (e.keyCode === Keys.SPACE)
            {
                panning = true;
                last = null;
            }
        });

        grid.on('keyup', (e:KeyboardEvent) =>
        {
            if (e.keyCode === Keys.SPACE)
            {
                panning = false;
                last = null;
            }
        });

        MouseInput.for(grid.root)
            .on('DRAG:PRIMARY', (e:GridMouseEvent) =>
        {
            if (!panning)
                return;

            if (last)
            {
                let next = new Point(e.gridX, e.gridY);
                let delta = next.subtract(last);

                grid.scrollLeft -= delta.x;
                grid.scrollTop -= delta.y;
            }

            last = new Point(e.gridX, e.gridY);
        });

        grid.kernel.routines.override('beginEdit', (override:string, impl:any) =>
        {
            if (panning)
                return false;

            return impl(override);
        });

        grid.kernel.routines.override('doSelect', (cells:string[] = [], autoScroll:boolean, impl:any) =>
        {
            if (panning)
                return false;

            return impl(cells, autoScroll);
        });
    }
}