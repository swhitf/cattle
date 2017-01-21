import { cascade, GridModel } from '../../export/lib/_export';
import { GridCell } from '../model/GridCell';
import { GridKernel } from './../ui/GridKernel';
import { GridElement, GridKeyboardEvent } from './../ui/GridElement';
import { SelectorWidget } from './SelectorExtension';
import { KeyInput } from '../input/KeyInput';
import { MouseInput } from '../input/MouseInput';
import { Point } from '../geom/Point';
import { RectLike, Rect } from '../geom/Rect';
import * as _ from '../misc/Util';
import * as Tether from 'tether';
import * as Dom from '../misc/Dom';
import { AbsWidgetBase, Widget } from '../ui/Widget';
import { command, routine, variable } from '../ui/Extensibility';


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

export interface GridChangeSetVisitor
{
    (ref:string, val:string, cascaded:boolean):void;
}

export class GridChangeSet
{
    private data:ObjectMap<any> = {};

    public get(ref:string):string
    {
        let entry = this.data[ref];
        return !!entry ? entry.value : null;
    }

    public put(ref:string, value:string, cascaded?:boolean):GridChangeSet
    {
        this.data[ref] = {
            ref: ref,
            value: value,
            cascaded: cascaded,
        };

        return this;
    }

    public refs():string[]
    {
        return _.keys(this.data);
    }

    public compile(model:GridModel):GridChange[]
    {
        return _.values(this.data)
            .map(x => ({
                cell: model.findCell(x.ref),
                value: x.value,
                cascaded: x.cascaded,
            }));
    }

    public visit(visitor:GridChangeSetVisitor):GridChangeSet
    {
        for (let ref in this.data)
        {
            let x = this.data[ref];

            visitor(x.ref, x.value, !!x.cascaded);
        }

        return this;
    }
}

export interface GridChange
{
    cell:GridCell;
    value:string;
    cascaded?:boolean;
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
            return false;

        let { input } = this;
        let cell = this.grid.model.findCell(this.selection[0]);

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
        let { selection } = this;

        if (this.isEditing)
            return;

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
        let { grid } = this;

        let evt:GridEditEvent = {
            changes: changes.compile(grid.model)
        };

        grid.emit('input', evt);
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