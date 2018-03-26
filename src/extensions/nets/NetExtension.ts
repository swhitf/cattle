import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridExtension, Variable } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { DefaultNetManager } from './DefaultNetManager';
import { NetManager } from './NetManager';


export class NetExtension extends AbstractDestroyable implements GridExtension
{
    @Variable(false)
    public nets:NetManager;

    public init(grid:GridElement, kernel:GridKernel):void 
    {
        this.nets = new DefaultNetManager(grid);
    }
}