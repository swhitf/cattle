import { GridRow } from '../../export/lib/_export';
import { GridChangeSet } from './EditingExtension';
import { GridExtension, GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import { KeyInput } from '../input/KeyInput';
import { command } from '../ui/Extensibility';
import * as _ from '../misc/Util'


export interface HistoryAction
{
    apply():void;

    rollback():void;
}

interface CellEditSnapshot
{
    ref:string;
    newVal:string;
    oldVal:string;
    cascaded?:boolean;
}

export class HistoryExtension implements GridExtension
{
    private grid:GridElement;

    private future:HistoryAction[] = [];
    private past:HistoryAction[] = [];
    private noCapture:boolean = false;

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;

        KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', () => this.undo())
            .on('!CTRL+KEY_Y', () => this.redo())
        ;

        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
    }

    @command()
    private undo():void
    {
        if (!this.past.length)
        {
            return;
        }

        let action = this.past.pop();
        action.rollback();
        this.future.push(action);
    }

    @command()
    private redo():void
    {
        if (!this.future.length)
        {
            return;
        }

        let action = this.future.pop();
        action.apply();
        this.past.push(action);
    }

    @command()
    private push(action:HistoryAction):void
    {
        this.past.push(action);
        this.future = [];
    }

    private beforeCommit(changes:GridChangeSet):void
    {
        if (this.noCapture)
            return;

        let snapshots = this.createSnapshots(changes);
        let action = this.createEditAction(snapshots);

        this.push(action);
    }

    private createSnapshots(changes:GridChangeSet):CellEditSnapshot[]
    {
        let model = this.grid.model;
        let batch = [] as CellEditSnapshot[];

        let compiled = changes.compile(model);
        for (let entry of compiled)
        {
            batch.push({
                ref: entry.cell.ref,
                newVal: entry.value,
                oldVal: entry.cell.value,
                cascaded: entry.cascaded,
            });
        }

        return batch;
    }

    private createEditAction(snapshots:CellEditSnapshot[]):HistoryAction
    {
        return {
            apply: () => {
                this.invokeSilentCommit(create_changes(snapshots, x => x.newVal));
            },
            rollback: () => {
                this.invokeSilentCommit(create_changes(snapshots, x => x.oldVal));
            },
        };
    }

    private invokeSilentCommit(changes:GridChangeSet):void
    {
        let { grid } = this;

        try
        {
            this.noCapture = true;
            grid.exec('commit', changes);
        }
        finally
        {
            this.noCapture = false;
        }

        let compiled = changes.compile(grid.model);
        let refs = compiled.filter(x => !x.cascaded).map(x => x.cell.ref);
        grid.exec('select', refs);
    }
}

function create_changes(snapshots:CellEditSnapshot[], valSelector:(s:CellEditSnapshot) => string):GridChangeSet 
{
    let changeSet = new GridChangeSet();
    for (let s of snapshots)
    {
        changeSet.put(s.ref, valSelector(s), s.cascaded);
    }
    return changeSet;
}