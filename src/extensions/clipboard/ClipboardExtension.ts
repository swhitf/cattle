import * as Papa from 'papaparse';

import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Command, GridExtension, Routine } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { Point } from '../../geom/Point';
import { GridRange } from '../../model/GridRange';
import { KeyBehavior } from '../../vom/input/KeyBehavior';
import { GridChangeSet } from '../editing/GridChangeSet';
import { NetManager } from '../nets/NetManager';
import { Selection } from '../selector/SelectorExtension';
import { clipboard } from './Clipboard';
import { ClipEvent } from './ClipEvent';


// :(
const NewLine = '\r\n';// = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';

export class ClipboardExtension extends AbstractDestroyable implements GridExtension
{
    private grid:GridElement;
    private layer:HTMLElement;

    public init(grid:GridElement):void
    {
        this.grid = grid;

        KeyBehavior.for(grid.surface)
            .on('CTRL+KEY_C', () => this.doCopy())
            .on('CTRL+KEY_X', () => this.doCut())
        ;

        this.chain(
            clipboard.on('paste', (e:ClipEvent) => this.onPasteOrCut(e.data, false)),
            clipboard.on('cut', (e:ClipEvent) => this.onPasteOrCut(e.data, true)),
        );
        
        grid.kernel.routines.hook('before:doBeginEdit', () => this.clearCopy());
        grid.kernel.routines.hook('before:doCommit', () => this.clearCopy());
    }

    private get nets():NetManager
    {
        return this.grid.kernel.variables.get('nets');
    }
    
    private get selection():Selection
    {
        return this.grid.kernel.variables.get('primarySelection');
    }

    @Command()
    private clearCopy():void
    {
        this.destroyCopyNet();
    }

    @Command('copy')
    @Routine()
    private doCopy(delimiter:string = '\t'):void
    {
        clipboard.copy(this.captureSelectionAsText());
        this.createCopyNet();
    }

    @Command('cut')
    @Routine()
    private doCut(delimiter:string = '\t'):void
    {
        clipboard.cut(this.captureSelectionAsText());
        this.createCopyNet();
    }

    @Routine()
    private doPaste(text:string, wasPreviouslyCut:boolean):void
    {
        const { grid, nets } = this;

        const copyRegion = nets.get('copy');

        const data = this.parsePastedText(text);
        const range = this.computePasteRange(data);
        const changes = this.computeChangeSet(data, range);

        if (!changes)
            return;

        if (wasPreviouslyCut && copyRegion)
        {
            const deleteRange = GridRange.fromRefs(grid.model, [copyRegion.fromRef, copyRegion.toRef]);
            for (const cell of deleteRange.ltr)
            {
                changes.set(cell.ref, '');
            }
        }

        this.grid.kernel.commands.exec('commit', changes);
        this.grid.kernel.commands.exec('select', range.first().ref, range.last().ref);
    }

    private onPasteOrCut(text:string, wasPreviouslyCut:boolean):void
    {
        let ae = document.activeElement;
        
        while (!!ae)
        {
            if (ae == this.grid.surface.view)
                break;

            ae = ae.parentElement;
        }

        if (ae)
        {
            this.doPaste(text, wasPreviouslyCut);
        }
    }

    private captureSelectionAsText(delimiter:string = '\t'):string
    {
        const { grid, nets, selection } = this;

        if (!selection)
            return;

        const range = GridRange.fromRefs(grid.model, [selection.from, selection.to]);
        
        if (!range.length)
            return;


        const first = range.first();
        const arr = (n:number) => new Array<string>(n).fill('');
        const lines = arr(range.height)
            .map(_ => arr(range.width));

        for (const c of range.ltr)
        {
            lines[c.rowRef - first.rowRef][c.colRef - first.colRef] = c.value;
        }

        return lines.map(x => x.join(delimiter)).join(NewLine);
    }

    private parsePastedText(pastedText:string):string[][]
    {
        let parsed = Papa.parse(pastedText, {
            delimiter: pastedText.indexOf('\t') >= 0 ? '\t' : undefined,
        });

        return parsed.data.filter(x => x.length > 1 || (x.length == 1 && !!x[0]));
    }

    private computePasteRange(data:string[][])
    {
        let { grid, selection } = this;
        
        const focusCell = grid.model.findCell(selection.from);
        const size = new Point(
            Math.max(...data.map(x => x.length)),
            data.length,
        );

        const start = new Point(focusCell.colRef, focusCell.rowRef);
        const end = start.add(size).subtract(1);

        return GridRange.fromPoints(grid.model, [start, end])
    }

    private computeChangeSet(data:string[][], range:GridRange):GridChangeSet
    {
        let { grid, selection } = this;

        const changes = new GridChangeSet();
        const start = Point.create([range.first().colRef, range.first().rowRef]);

        for (let cell of range.ltr)
        {
            let xy = new Point(cell.colRef, cell.rowRef).subtract(start);
            let value = data[xy.y][xy.x] || '';

            changes.set(cell.ref, value);
        }

        return changes;
    }

    private createCopyNet():void
    {
        const { nets, selection } = this;

        this.destroyCopyNet();
        nets.create('copy', 'copy', selection.from, selection.to);
    }

    private destroyCopyNet():void
    {
        const { nets } = this;

        const net = nets.get('copy');
        if (net) nets.destroy('copy');
    }
}