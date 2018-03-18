import { ObjectMap } from '../../common';
import { Command } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { zipPairs } from '../../misc/Util';
import { GridRange } from '../../model/GridRange';
import { KeyBehavior } from '../../vom/input/KeyBehavior';
import { GridChangeSet } from '../editing/GridChangeSet';
import { DefaultHistoryManager } from './DefaultHistoryManager';
import { HistoryAction, HistoryManager } from './HistoryManager';


export class HistoryExtension
{
    private grid:GridElement;
    private manager:HistoryManager;
    
    private capture:ObjectMap<string>;
    private noCapture:boolean = false;
    private suspended:boolean = false;

    constructor(manager?:HistoryManager)
    {
        this.manager = manager || new DefaultHistoryManager();
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;

        KeyBehavior.for(grid.surface)
            .on('CTRL+KEY_Z/xe', () => this.undo())
            .on('CTRL+KEY_Y/xe', () => this.redo())
        ;

        grid.kernel.routines.hook('before:doCommit', this.beforeCommit.bind(this));
        grid.kernel.routines.hook('after:doCommit', this.afterCommit.bind(this));
    }

    @Command()
    private undo():void
    {
        this.manager.undo();
    }

    @Command()
    private redo():void
    {
        this.manager.redo();
    }

    @Command()
    private push(action:HistoryAction):void
    {
        this.manager.push(action);
    }

    @Command('clearHistory')
    private clear():void
    {
        this.manager.clear();
    }

    @Command('suspendHistory')
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

        for (let entry of changes.filter(x => !x.cascaded))
        {
            batch.push({
                ref: entry.ref,
                newVal: entry.value,
                oldVal: capture[entry.ref],
                cascaded: entry.cascaded,
            });
        }

        return batch;
    }

    private createEditAction(snapshots:CellEditSnapshot[]):HistoryAction
    {
        return {
            apply: () => {
                this.invokeSilentCommit(createChanges(snapshots, x => x.newVal));
            },
            rollback: () => {
                this.invokeSilentCommit(createChanges(snapshots, x => x.oldVal));
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

        const refs = changes.filter(x => !x.cascaded).map(x => x.ref);
        const range = GridRange.fromRefs(grid.model, refs);

        grid.exec('select', range.first().ref, range.last().ref);
    }
}

interface CellEditSnapshot
{
    ref:string;
    newVal:string;
    oldVal:string;
    cascaded?:boolean;
}

function createChanges(snapshots:CellEditSnapshot[], valSelector:(s:CellEditSnapshot) => string):GridChangeSet 
{
    let changeSet = new GridChangeSet();

    for (let s of snapshots)
    {
        changeSet.set(s.ref, valSelector(s), s.cascaded);
    }

    return changeSet;
}