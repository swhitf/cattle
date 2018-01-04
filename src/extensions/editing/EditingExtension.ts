import {GridRange} from '../../model/GridRange';
import {GridCell} from '../../model/GridCell';
import {Command, Routine,  Variable} from '../../core/Extensibility';
import {GridElement} from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { GridChangeSet } from './GridChangeSet';
import { GridChangeEvent } from './GridChangeEvent';
import { Selection } from '../selector/SelectorExtension';


enum State
{
    Idle = 'idle',
    Editing = 'editing',
    EditingDetailed = 'editingDetailed',
}

export class EditingExtension
{
    private grid:GridElement;
    private layer:HTMLElement;
    private state:State = State.Idle;

    constructor(private autoApply:boolean = false)
    {
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
    }

    private get primarySelection():Selection
    {
        return this.grid.kernel.variables.get('primarySelection');
    }

    // private get selection():string[]
    // {
    //     return this.grid.kernel.variables.get('selection');
    // }

    @Command()
    private commitUniform(cellRefs:string[], uniformValue:any):void
    {
        let changes = new GridChangeSet();

        for (let ref of cellRefs)
        {
            changes.set(ref, uniformValue, false);
        }

        this.doCommit(changes);
    }

    @Command()
    private commit(changes:GridChangeSet):void
    {
        throw 'Not implemented';
    }

    @Routine()
    private doBeginEdit(override:string):boolean
    {
        throw 'Not implemented';
    }

    @Routine()
    private doEndEdit(commit?:boolean):boolean
    {
        throw 'Not implemented';
    }

    @Command()
    private erase():void
    {
        let { grid, primarySelection } = this;

        if (this.state != State.Idle || !primarySelection)
            return;

        let range = GridRange.fromRefs(grid.model, [primarySelection.from, primarySelection.to]);
        let cells = range.ltr.filter(x => !is_readonly(x));

        this.commitUniform(cells.map(x => x.ref), '');
    }

    @Routine()
    private doCommit(changes:GridChangeSet):void
    {
        let { autoApply, grid } = this;

        if (changes.length)
        {
            grid.emit(new GridChangeEvent(changes));
        }        

        if (autoApply)
        {
            changes.apply(grid.model);
        }
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['editable'] === false;
}