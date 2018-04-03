import { GridKernel } from '../../core/GridKernel';
import { GridElement } from '../../core/GridElement';
import { GridExtension } from '../../core/Extensibility';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';


export class HintExtension extends AbstractDestroyable implements GridExtension 
{
    private grid:GridElement;

    public init(grid:GridElement, kernel:GridKernel):void 
    {
        this.grid = grid;   

        this.editInput.addEventListener('keypress', this.onEditInputKeyPress.bind(this));
    }

    private get editInput():HTMLInputElement 
    {
        return this.grid.kernel.variables.get('editInput');
    }

    private onEditInputKeyPress(e:KeyboardEvent):void 
    {
        if (!e.which) return; 
        
    }
}