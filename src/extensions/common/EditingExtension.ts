import * as Tether from 'tether';

import { Point } from '../../geom/Point';
import { RectLike } from '../../geom/Rect';
import { KeyInput } from '../../input/KeyInput';
import { MouseInput } from '../../input/MouseInput';
import * as Dom from '../../misc/Dom';
import { ObjectMap } from '../../misc/Interfaces';
import { values } from '../../misc/Util';
import { GridCell } from '../../model/GridCell';
import { GridModel } from '../../model/GridModel';
import { command, routine, variable } from '../../ui/Extensibility';
import { AbsWidgetBase, Widget } from '../../ui/Widget';
import { GridElement, GridKeyboardEvent } from '.././../ui/GridElement';
import { GridKernel } from '.././../ui/GridKernel';
import { SelectorWidget } from './SelectorExtension';


const Vectors = {
    n: new Point(0, -1),
    s: new Point(0, 1),
    e: new Point(1, 0),
    w: new Point(-1, 0),
};

export interface GridEditEvent
{
    changes:GridChange[];
}

export interface GridChange
{
    readonly cell:GridCell;
    readonly value:string;
    readonly cascaded?:boolean;
}

export interface GridChangeSetVisitor
{
    (ref:string, val:string, cascaded:boolean):void;
}

export interface GridChangeSetItem
{
    readonly ref:string;
    readonly value:string;
    readonly cascaded?:boolean;
}

export class GridChangeSet
{
    private data:ObjectMap<GridChangeSetItem> = {};

    public contents():GridChangeSetItem[]
    {
        return values(this.data);
    }

    public get(ref:string):string
    {
        let entry = this.data[ref];
        return !!entry ? entry.value : undefined;
    }

    public put(ref:string, value:string, cascaded?:boolean):GridChangeSet
    {
        this.data[ref] = {
            ref: ref,
            value: value,
            cascaded: !!cascaded,
        };

        return this;
    }

    public refs():string[]
    {
        return Object.keys(this.data);
    }

    public compile(model:GridModel):GridChange[]
    {
        return this.contents()
            .map(x => ({
                cell: model.findCell(x.ref),
                value: x.value,
                cascaded: x.cascaded,
            }))
            .filter(x => !!x.cascaded || !is_readonly(x.cell))
        ;
    }
}

export interface InputWidget extends Widget
{
    focus():void;
    val(value?:string):string;
}

export class EditingExtension
{
    private grid:GridElement;
    private layer:HTMLElement;

    @variable()
    private input:Input;

    private isEditing:boolean = false;
    private isEditingDetailed = false;

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements(grid.root);

        KeyInput.for(this.input.root)
            .on('!ESCAPE', () => this.endEdit(false))
            .on('!ENTER', () => this.endEditToNeighbor(Vectors.e))
            .on('!TAB', () => this.endEditToNeighbor(Vectors.e))
            .on('!SHIFT+TAB', () => this.endEditToNeighbor(Vectors.w))
            .on('UP_ARROW', () => this.endEditToNeighbor(Vectors.n))
            .on('DOWN_ARROW', () => this.endEditToNeighbor(Vectors.s))
            .on('RIGHT_ARROW', () => { if (!this.isEditingDetailed) { this.endEditToNeighbor(Vectors.e); } })
            .on('LEFT_ARROW', () => { if (!this.isEditingDetailed) { this.endEditToNeighbor(Vectors.w); } })
        ;

        MouseInput.for(this.input.root)
            .on('DOWN:PRIMARY', () => this.isEditingDetailed = true)
        ;

        KeyInput.for(this.grid.root)
            .on('!DELETE', () => this.erase())
            .on('!BACKSPACE', () => this.beginEdit(''))
        ;

        MouseInput.for(this.grid.root)
            .on('DBLCLICK:PRIMARY', () => this.beginEdit(null))
        ;

        this.input.root.addEventListener('blur', () => { this.endEdit(true) });

        grid.on('keypress', (e:GridKeyboardEvent) => this.beginEdit(String.fromCharCode(e.charCode)));

        kernel.routines.hook('before:doSelect', () => this.endEdit(true));
    }

    private get primarySelector():SelectorWidget
    {
        return this.grid.kernel.variables.get('primarySelector');
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
        this.input = Input.create(layer);
    }

    @command()
    @routine()
    private beginEdit(override:string):boolean
    {
        if (this.isEditing)
        {
            return false;
        }

        let { input } = this;
        let cell = this.grid.model.findCell(this.selection[0]);

        if (is_readonly(cell))
        {
            return false;
        }

        if (!!override || override === '')
        {
            input.val(override);
        }
        else
        {
            input.val(cell.value);
        }

        input.goto(this.primarySelector.viewRect);
        input.focus();

        this.isEditingDetailed = false;
        this.isEditing = true;

        return true;
    }

    @command()
    @routine()
    private endEdit(commit:boolean = true):boolean
    {
        if (!this.isEditing)
            return false;

        let { grid, input, selection } = this;
        let newValue = input.val();

        input.hide();
        input.val('');
        grid.focus();

        if (commit && !!selection.length)
        {
            this.commitUniform(selection.slice(0, 1), newValue);
        }

        this.isEditing = false;
        this.isEditingDetailed = false;

        return true;
    }

    private endEditToNeighbor(vector:Point, commit:boolean = true):boolean
    {
        if (this.endEdit(commit))
        {
            this.grid.kernel.commands.exec('selectNeighbor', vector);
            return true;
        }

        return false;
    }

    @command()
    @routine()
    private erase():void
    {
        let { grid, selection } = this;

        if (this.isEditing)
            return;

        selection = selection.filter(x => !is_readonly(grid.model.findCell(x)));

        this.commitUniform(selection, '');
    }

    @command()
    private commitUniform(cells:string[], uniformValue:any):void
    {
        let changes = new GridChangeSet();
        for (let ref of cells)
        {
            changes.put(ref, uniformValue, false);
        }

        this.commit(changes);
    }

    @command()
    @routine()
    private commit(changes:GridChangeSet):void
    {
        let grid = this.grid;
        let compiled = changes.compile(grid.model);
        if (compiled.length)
        {
            grid.emit('input', { changes: compiled });
        }
    }
}

class Input extends AbsWidgetBase<HTMLInputElement>
{
    public static create(container:HTMLElement):Input
    {
        let root = document.createElement('input');
        root.type = 'text';
        root.className = 'grid-input';
        container.appendChild(root);

        Dom.css(root, {
            pointerEvents: 'auto',
            display: 'none',
            position: 'absolute',
            left: '0px',
            top: '0px',
            padding: '0',
            margin: '0',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
        });

        return new Input(root);
    }

    public goto(viewRect:RectLike, autoShow:boolean = true):void
    {
        super.goto(viewRect);

        Dom.css(this.root, {
            left: `${viewRect.left + 2}px`,
            top: `${viewRect.top + 2}px`,
            width: `${viewRect.width}px`,
            height: `${viewRect.height}px`,
        });
    }

    public focus():void
    {
        let root = this.root;
        setTimeout(() =>
        {
            root.focus();
            root.setSelectionRange(root.value.length, root.value.length);
        }, 0);
    }

    public val(value?:string):string
    {
        if (value !== undefined)
        {
            this.root.value = value;
        }

        return this.root.value;
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['mutable'] === false;
}