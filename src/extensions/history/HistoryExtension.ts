import { DefaultHistoryManager, HistoryAction, HistoryManager } from './HistoryManager';
import { zipPairs } from '../../misc/Util';
import { GridChangeSet } from '../common/EditingExtension';
import { GridExtension, GridElement } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import { KeyInput } from '../../input/KeyInput';
import { command } from '../../ui/Extensibility';
import * as _ from '../../misc/Util'


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
    private manager:HistoryManager;

    private noCapture:boolean = false;
    private suspended:boolean = false;
    private capture:ObjectMap<string>;

    constructor(manager?:HistoryManager)
    {
        this.manager = manager || new DefaultHistoryManager();
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;

        KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', () => this.undo())
            .on('!CTRL+KEY_Y', () => this.redo())
        ;

        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
        grid.kernel.routines.hook('after:commit', this.afterCommit.bind(this));
    }

    @command()
    private undo():void
    {
        this.manager.undo();
    }

    @command()
    private redo():void
    {
        this.manager.redo();
    }

    @command()
    private push(action:HistoryAction):void
    {
        this.manager.push(action);
    }

    @command('clearHistory')
    private clear():void
    {
        this.manager.clear();
    }

    @command('suspendHistory')
    private suspend(flag:boolean = true):void 
    {
        this.suspended = flag;
    }

    private beforeCommit(changes:GridChangeSet):void
    {
        if (this.noCapture || this.suspended)
            return;

        let model = this.grid.model;

        this.capture = zipPairs(
            changes.refs().map(r => [r, model.findCell(r).value]) 
        );
    }

    private afterCommit(changes:GridChangeSet):void
    {
        if (this.noCapture || !this.capture || this.suspended)
            return;

        let snapshots = this.createSnapshots(this.capture, changes);
        if (snapshots.length) 
        {
            let action = this.createEditAction(snapshots);
            this.push(action);
        }
        
        this.capture = null;
    }

    private createSnapshots(capture:ObjectMap<string>, changes:GridChangeSet):CellEditSnapshot[]
    {
        let model = this.grid.model;
        let batch = [] as CellEditSnapshot[];

        let compiled = changes.compile(model);
        for (let entry of compiled.filter(x => !x.cascaded))
        {
            batch.push({
                ref: entry.cell.ref,
                newVal: entry.value,
                oldVal: capture[entry.cell.ref],
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