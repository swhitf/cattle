import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridChangeEvent } from '../../core/events/GridChangeEvent';
import { GridExtension, Routine, Variable } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import * as dom from '../../misc/Dom';
import { GridCell } from '../../model/GridCell';
import { Keys } from '../../vom/input/Keys';
import { Selection } from '../selector/SelectorExtension';
import { HintProvider } from './HintProvider';


export class HintExtension extends AbstractDestroyable implements GridExtension 
{
    private grid:GridElement;

    @Variable('editSuggestion', false)
    private editSuggestion:string;

    constructor(private providers:HintProvider[]) 
    {
        super();
    }

    public init(grid:GridElement, kernel:GridKernel):void 
    {
        this.grid = grid;   

        kernel.routines.hook('before:doEndEdit', () => this.clearSuggestion());

        this.chain(
            dom.on(this.editInput, 'keypress', this.onEditInputKeyPress.bind(this)),
            dom.on(this.editInput, 'keyup', this.onEditInputKeyUp.bind(this)),
        );
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
        {
            this.clearSuggestion();
        }   
        else
        {
            const input = editInput.value;
            const cell = grid.model.findCell(primarySelection.from);
            const suggestion = this.getSuggestion(cell, input);

            if (suggestion)
            {
                editInput.value = suggestion;
                editInput.setSelectionRange(input.length, suggestion.length);
                editInput.focus();

                this.editSuggestion = suggestion;

                grid.emit(new GridChangeEvent(grid, 'editValue'));
                grid.emit(new GridChangeEvent(grid, 'editSuggestion'));
            }
            else 
            {
                this.clearSuggestion();
            }
        }
    }

    private clearSuggestion():void
    {
        if (!!this.editSuggestion)
        {
            this.editSuggestion = null;
            this.grid.emit(new GridChangeEvent(this.grid, 'editSuggestion'));
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