//@no-export
import { GridChangeEvent } from '../../core/events/GridChangeEvent';
import { GridElement } from '../../core/GridElement';
import { Selection } from '../../extensions/selector/SelectorExtension';
import * as dom from '../../misc/Dom';


export class ExternalInput
{
    public static create(grid:GridElement, input:HTMLInputElement):ExternalInput
    {
        return new ExternalInput(grid, input);
    }

    private inFocus:boolean = false;
    private inEdit:boolean = false;

    constructor(private grid:GridElement, private input:HTMLInputElement)
    {
        input.addEventListener('focus', () => this.inFocus = true);
        input.addEventListener('blur', () => this.inFocus = false);
        dom.watchInput(input, this.updateGridEditValue.bind(this));

        grid.on('beginEdit', () => this.inEdit = true);
        grid.on('endEdit', () => this.inEdit = false);
        grid.on('select', () => this.mirrorGridPrimarySelection());
        grid.on('commit', () => this.mirrorGridPrimarySelection());
        grid.on('change', (e:GridChangeEvent) => 
        {
            if (e.property == 'editValue') this.mirrorGridEditValue();
        });
    }

    private mirrorGridPrimarySelection():void
    {
        const { grid, input } = this;
        const selection = grid.get('primarySelection') as Selection;

        if (selection && selection.from)
        {
            const cell = grid.model.findCell(selection.from);
            input.value = cell.value;
        }
        else
        {
            input.value = '';
        }
    }

    private mirrorGridEditValue():void
    {
        const { grid, input, inFocus } = this;
        
        if (!inFocus)
        {
            input.value = grid.get('editValue');
        }
    }

    private updateGridEditValue():void
    {
        const { grid, input, inEdit } = this;
        
        if (inEdit)
        {
            const gridInput = grid.get('editInput') as HTMLInputElement;
            gridInput.value = input.value;
            gridInput.scrollLeft = 100000;
        }
        else
        {
            grid.exec('beginEdit', input.value, false);
            input.focus();
        }
    }
}