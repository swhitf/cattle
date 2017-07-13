import { GridChangeSet } from './EditingExtension';
import { GridExtension, GridElement } from '../../ui/GridElement';
import { GridRange } from '../../model/GridRange';
import { GridCell } from '../../model/GridCell';
import { KeyInput } from '../../input/KeyInput';
import { Rect } from '../../geom/Rect';
import { Point } from '../../geom/Point';
import { SelectorWidget } from './SelectorExtension';
import { AbsWidgetBase } from '../../ui/Widget';
import { variable, command, routine } from '../../ui/Extensibility';
import * as _ from '../../misc/Util';
import * as Dom from '../../misc/Dom';
import * as Papa from 'papaparse';
import * as Tether from 'tether';
import * as clipboard from 'clipboard-js';


//I know... :(
//const NewLine = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
const NewLine = '\r\n';

export class ClipboardExtension implements GridExtension
{
    private grid:GridElement;
    private layer:HTMLElement;

    private copyList:string[] = [];
    private copyRange:GridRange = GridRange.empty();

    @variable()
    private copyNet:CopyNet;

    public init(grid:GridElement):void
    {
        this.grid = grid;
        this.createElements(grid.root);

        KeyInput.for(grid.root)
            .on('!CTRL+KEY_C', (e:KeyboardEvent) => this.copySelection())
        ;

        window.addEventListener('paste', this.onWindowPaste.bind(this));

        grid.on('scroll', () => this.alignNet());
        grid.kernel.routines.hook('before:beginEdit', () => this.resetCopy());
        grid.kernel.routines.hook('before:commit', () => this.resetCopy());
    }

    private get captureSelector():SelectorWidget
    {
        return this.grid.kernel.variables.get('captureSelector');
    }

    private get selection():string[]
    {
        return this.grid.kernel.variables.get('selection');
    }

    private createElements(target:HTMLElement):void
    {
        let layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });

        let onBash = () => {
            Dom.fit(layer, target);
            t.position();
        };

        this.grid.on('bash', onBash);
        onBash();

        this.layer = layer;
        this.copyNet = CopyNet.create(layer);
    }

    @command()
    private copySelection():void
    {
        this.doCopy(this.selection);
        this.alignNet();
    }

    @command()
    private resetCopy():void
    {
        this.doCopy([]);
        this.alignNet();
    }

    @routine()
    private doCopy(cells:string[], delimiter:string = '\t'):void
    {
        this.copyList = cells;
        let range = this.copyRange = GridRange.create(this.grid.model, cells);
        let text = '';

        if (!cells.length)
            return;

        let rr = range.ltr[0].rowRef;
        for (let i = 0; i < range.ltr.length; i++)
        {
            let c = range.ltr[i];

            if (rr !== c.rowRef)
            {
                text += NewLine;
                rr = c.rowRef;
            }

            text += c.value;

            if (i < (range.ltr.length - 1) && range.ltr[i + 1].rowRef === rr)
            {
                text += delimiter;
            }
        }
        
        clipboard.copy(text);
    }

    @routine()
    private doPaste(text:string):void
    {
        let { grid, selection } = this;

        selection = selection.filter(x => !is_readonly(grid.model.findCell(x)));

        if (!selection.length)
            return;

        let focusedCell = grid.model.findCell(selection[0]);

        let parsed = Papa.parse(text, {
            delimiter: text.indexOf('\t') >= 0 ? '\t' : undefined,
        });

        let data = parsed.data.filter(x => x.length > 1 || (x.length == 1 && !!x[0]));
        if (!data.length)
            return;

        let width = _.max(data, x => x.length).length;
        let height = data.length;
        let startVector = new Point(focusedCell.colRef, focusedCell.rowRef);
        let endVector = startVector.add(new Point(width, height));

        let pasteRange = GridRange.capture(grid.model, startVector, endVector);

        let changes = new GridChangeSet();
        for (let cell of pasteRange.ltr)
        {
            let xy = new Point(cell.colRef, cell.rowRef).subtract(startVector);
            let value = data[xy.y][xy.x] || '';

            changes.put(cell.ref, value);
        }

        this.grid.kernel.commands.exec('commit', changes);
        this.grid.kernel.commands.exec('select', pasteRange.ltr.map(x => x.ref));
    }

    private alignNet():void
    {
        let { grid, copyList, copyNet } = this;

        if (copyList.length)
        {
            //TODO: Improve the shit out of this:
            let netRect = Rect.fromMany(copyList.map(x => grid.getCellViewRect(x)));
            copyNet.goto(netRect);
        }
        else
        {
            copyNet.hide();
        }
    }

    private onWindowPaste(e:ClipboardEvent):void
    {
        let ae = document.activeElement;
        while (!!ae)
        {
            if (ae == this.grid.root)
                break;

            ae = ae.parentElement;
        }

        if (!ae)
            return;

        let text = e.clipboardData.getData('text/plain');
        if (text !== null && text !== undefined)
        {
            this.doPaste(text);
        }
    }
}

export class CopyNet extends AbsWidgetBase<HTMLDivElement>
{
    public static create(container:HTMLElement):CopyNet
    {
        let root = document.createElement('div');
        root.className = 'grid-net grid-net-copy';
        container.appendChild(root);

        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });

        return new CopyNet(root);
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['mutable'] === false;
}