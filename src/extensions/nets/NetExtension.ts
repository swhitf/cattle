import { DefaultNetManager } from './DefaultNetManager';
import { NetManager } from './NetManager';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { GridExtension, Variable } from '../../core/Extensibility';


export class NetExtension implements GridExtension
{
    @Variable(false)
    public nets:NetManager;

    public init(grid:GridElement, kernel:GridKernel):void 
    {
        this.nets = new DefaultNetManager(grid);
    }
}