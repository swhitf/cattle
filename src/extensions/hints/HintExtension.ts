import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridExtension, Routine } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { GridCell } from '../../model/GridCell';
import { Keys } from '../../vom/input/Keys';
import { Selection } from '../selector/SelectorExtension';
import { HintProvider } from './HintProvider';


export class HintExtension extends AbstractDestroyable implements GridExtension 
{
    private grid:GridElement;

    constructor(private providers:HintProvider[]) 
    {
        super();
    }

    public init(grid:GridElement, kernel:GridKernel):void 
    {
        this.grid = grid;   

        this.editInput.addEventListener('keypress', this.onEditInputKeyPress.bind(this));
        this.editInput.addEventListener('keyup', this.onEditInputKeyUp.bind(this));
    }

    private get editInput():HTMLInputElement 
    {
        return this.grid.kernel.variables.get('editInput');
    }

    private get primarySelection():Selection
    {
        return this.grid.kernel.variables.get('primarySelection');
    }

    private onEditInputKeyPress(e:KeyboardEvent):void 
    {
        if (!!e.which)
        {
            setTimeout(() => this.doSuggestion(), 0);
        }
    }

    private onEditInputKeyUp(e:KeyboardEvent):void 
    {
        if (e.ctrlKey && e.keyCode == Keys.SPACE)
        {
            setTimeout(() => this.doSuggestion(), 0);
        }
    }

    @Routine()
    private doSuggestion():void
    {
        const { grid, editInput, primarySelection, providers } = this;
        
        //Only suggest if selection at the end
        if (editInput.selectionEnd != editInput.value.length)
            return;

        const input = editInput.value;
        const cell = grid.model.findCell(primarySelection.from);
        const suggestion = this.getSuggestion(cell, input);

        console.log(editInput.value, 'results in suggestion', suggestion);
        
        if (suggestion)
        {
            editInput.value = suggestion;
            editInput.setSelectionRange(input.length, suggestion.length);
            editInput.focus();
        }
    }

    private getSuggestion(cell:GridCell, input:string):string
    {
        let result = null as string;

        for (let p of this.providers)
        {
            result = p.suggest(cell, input);

            if (!!result)
                break;
        }

        return result;
    }
}