import { ObjectMap } from '../global';
import { CellModel } from '../model/CellModel';
import { GridKernel } from './../ui/GridKernel';
import { GridElement, GridKeyboardEvent } from './../ui/GridElement';
import { GridModelIndex } from '../model/GridModelIndex';
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
    north: new Point(0, -1),
    south: new Point(0, 1),
    east: new Point(1, 0),
    west: new Point(-1, 0),
};

export interface GridEditEvent
{
    changes:GridEditIntent[];
}

export interface GridEditIntent
{
    cell:CellModel;
    value:string;
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
            .on('!ENTER', () => this.endEditToNeighbor(Vectors.east))
            .on('!TAB', () => this.endEditToNeighbor(Vectors.east))
            .on('!SHIFT+TAB', () => this.endEditToNeighbor(Vectors.west))
            .on('UP_ARROW', () => this.endEditToNeighbor(Vectors.north))
            .on('DOWN_ARROW', () => this.endEditToNeighbor(Vectors.south))
            .on('RIGHT_ARROW', () => { if (!this.isEditingDetailed) { this.endEditToNeighbor(Vectors.east); } })
            .on('LEFT_ARROW', () => { if (!this.isEditingDetailed) { this.endEditToNeighbor(Vectors.west); } })
        ;

        MouseInput.for(this.input.root)
            .on('DOWN:PRIMARY', () => this.isEditingDetailed = true)
        ;

        KeyInput.for(this.grid.root)
            .on('!DELETE', () => this.erase())
            .on('!BACKSPACE', () => this.beginEdit(''))
        ;

        MouseInput.for(this.grid.root)
            .on('DBLCLICK:PRIMARY', () => this.beginEdit())
        ;

        grid.on('keypress', (e:GridKeyboardEvent) => this.beginEdit(String.fromCharCode(e.charCode)));

        kernel.routines.hook('before:doSelect', () => this.endEdit(true));
    }

    private get modelIndex():GridModelIndex
    {
        return this.grid.kernel.variables.get('modelIndex');
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
        layer.style.pointerEvents = 'none';
        layer.style.width = target.clientWidth + 'px';
        layer.style.height = target.clientHeight + 'px';
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });

        t.position();

        this.layer = layer;
        this.input = Input.create(layer);
    }

    @command()
    @routine()
    private beginEdit(override:string = null):boolean
    {
        if (this.isEditing)
            return false;

        let { input } = this;
        let cell = this.modelIndex.findCell(this.selection[0]);

        if (!!override)
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
        let changes = _.zipPairs(cells.map(x => [x, uniformValue]));
        this.commit(changes);
    }

    @command()
    @routine()
    private commit(changes:ObjectMap<string>):void
    {
        let { grid, modelIndex } = this;

        let evt:GridEditEvent = {
            changes: _.unzipPairs(changes).map(x => ({
                cell: modelIndex.findCell(x[0]),
                value: x[1],
            }))
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