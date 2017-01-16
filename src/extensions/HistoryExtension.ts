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

    private beforeCommit(changes:ObjectMap<string>):void
    {
        if (this.noCapture)
            return;

        let snapshots = this.createSnapshots(changes);
        let action = this.createEditAction(snapshots);

        this.push(action);
    }

    private createSnapshots(changes:ObjectMap<string>):CellEditSnapshot[]
    {
        let model = this.grid.model;
        let batch = [] as CellEditSnapshot[];

        for (let ref in changes)
        {
            batch.push({
                ref: ref,
                newVal: changes[ref],
                oldVal: model.findCell(ref).value,
            });
        }

        return batch;
    }

    private createEditAction(snapshots:CellEditSnapshot[]):HistoryAction
    {
        return {
            apply: () => {
                this.invokeSilentCommit(_.zipPairs(snapshots.map(x => [x.ref, x.newVal])));
            },
            rollback: () => {
                this.invokeSilentCommit(_.zipPairs(snapshots.map(x => [x.ref, x.oldVal])));
            },
        };
    }

    private invokeSilentCommit(changes:ObjectMap<string>):void
    {
        let kernel = this.grid.kernel;

        try
        {
            this.noCapture = true;
            kernel.commands.exec('commit', changes);
        }
        finally
        {
            this.noCapture = false;
        }

        kernel.commands.exec('select', _.keys(changes));
    }
}