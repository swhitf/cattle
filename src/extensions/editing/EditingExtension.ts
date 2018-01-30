import { GridWalk } from '../../model/GridWalk';
import { Point } from '../../geom/Point';
import { Vectors } from '../../misc/Vectors';
import { KeyBehavior } from '../../vom/input/KeyBehavior';
import { KeyExpression } from '../../vom/input/KeyExpression';
import { SimpleEventEmitter } from '../../base/SimpleEventEmitter';
import { NetVisual } from '../nets/NetVisual';
import { Rect, RectLike } from '../../geom/Rect';
import { MouseGesture } from '../../vom/input/MouseGesture';
import {GridRange} from '../../model/GridRange';
import {GridCell} from '../../model/GridCell';
import {Command, Routine,  Variable} from '../../core/Extensibility';
import {GridElement} from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { GridChangeSet } from './GridChangeSet';
import { GridChangeEvent } from './GridChangeEvent';
import { Selection } from '../selector/SelectorExtension';
import * as dom from '../../misc/Dom';


enum State
{
    Idle = 'idle',
    Editing = 'editing',
    EditingDetailed = 'editingDetailed',
}

export class EditingExtension
{
    private grid:GridElement;
    private input:InputHandle;
    private state:State = State.Idle;

    constructor(private autoApply:boolean = true)
    {
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.input = InputHandle.create(grid.container);

        MouseGesture.for(grid.surface)
            .on(['LEFT.DBLCLICK/e'], e => this.doBeginEdit())
        ;

        KeyBehavior.for(this.input.elmt)
            .on('ESCAPE/e/x', () => this.doEndEdit(false))
            .on('ENTER/e/x', () => this.endEditToNeighbor(Vectors.e))
            .on('TAB/e/x', () => this.endEditToNeighbor(Vectors.e))
            .on('SHIFT+TAB/e/x', () => this.endEditToNeighbor(Vectors.w))
            .on('UP_ARROW/e/x', () => this.endEditToNeighbor(Vectors.n))
            .on('DOWN_ARROW/e/x', () => this.endEditToNeighbor(Vectors.s))
            .on('RIGHT_ARROW/e/x', () => this.endEditToNeighbor(Vectors.e))
            .on('LEFT_ARROW/e/x', () => this.endEditToNeighbor(Vectors.w))
            .on([
                'SHIFT+UP_ARROW/e', 'CTRL+UP_ARROW/e',
                'SHIFT+DOWN_ARROW/e', 'CTRL+DOWN_ARROW/e',
                'SHIFT+RIGHT_ARROW/e', 'CTRL+RIGHT_ARROW/e',
                'SHIFT+LEFT_ARROW/e', 'CTRL+LEFT_ARROW/e',
            ], () => this.state = State.EditingDetailed)
        ;

        //Before select commit pending edit
        kernel.routines.hook('before:doSelect', () => this.doEndEdit(true));
    }

    private get primarySelection():Selection
    {
        return this.grid.kernel.variables.get('primarySelection');
    }

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
        this.doCommit(changes);
    }

    @Routine()
    private doBeginEdit(override?:string):boolean
    {
        let { grid, input, primarySelection } = this;

        if (this.state != State.Idle || !primarySelection)
            return false;

        let cell = grid.model.findCell(primarySelection.from);

        if (!cell || is_readonly(cell))
            return false;

        let inputRect = this.computeInputRect();
        if (!inputRect) 
            return false;

        if (!!override || override === '')
        {
            input.val(override);
        }
        else
        {
            input.val(cell.value);
        }

        input.goto(inputRect);
        input.focus();

        this.state = State.Editing;

        return true;
    }

    @Routine()
    private doEndEdit(commit?:boolean):boolean
    {
        let { grid, input, primarySelection } = this;

        if (this.state == State.Idle)
            return false;

        let newValue = input.val();

        input.visible = false;
        input.val('');
        grid.focus();

        if (commit && !!primarySelection)
        {
            this.commitUniform([primarySelection.from], newValue);
        }

        this.state = State.Idle;

        return true;
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
            grid.forceUpdate();
        }
    }

    private computeInputRect():Rect
    {
        let { surface } = this.grid;

        let inputNet = surface.query('net.input')[0] as NetVisual;
        let inputArea = inputNet.absoluteBounds;
        let inputBorder = inputNet.border.width;
        
        for (let i = 0; i < surface.cameras.count; i++)
        {
            let camera = surface.cameras.item(i);
            if (inputArea.intersects(camera.area))
            {
                //Deflate for border
                inputArea = inputArea.inflate([inputBorder * -1, inputBorder * -1]);
                //Convert to view point
                return Rect.fromPoints(
                    camera.toViewPoint('surface', inputArea.topLeft()),
                    camera.toViewPoint('surface', inputArea.bottomRight()),
                );
            }
        }

        return null;
    }

    private endEditToNeighbor(vector:Point):boolean
    {
        let { grid, primarySelection } = this;

        if (this.doEndEdit(true))
        {   
            grid.exec('selectNext', 'cell', vector);
            return true;
        }

        return false;
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['editable'] === false;
}

class InputHandle extends SimpleEventEmitter
{
    public static create(root:HTMLElement):InputHandle
    {
        let text = document.createElement('input');
        text.type = 'text';
        text.className = 'grid-input';

        dom.css(text, {
            pointerEvents: 'auto',
            display: 'block',
            position: 'absolute',
            left: '0px',
            top: '0px',
            padding: '0',
            margin: '0',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
        });

        return new InputHandle(root, text);
    }

    private constructor(private root:HTMLElement, private text:HTMLInputElement) 
    {
        super();
    }

    public get elmt():HTMLInputElement
    {
        return this.text;
    }

    public get visible():boolean
    {
        return !!this.text.parentElement;
    }

    public set visible(value:boolean)
    {
        if (value == this.visible)
            return;

        if (value)
        {
            this.root.ownerDocument.body.appendChild(this.text);
        }
        else
        {
            this.text.parentElement.removeChild(this.text);
        }
    }

    public goto(relativeRect:RectLike, autoShow:boolean = true):void
    {
        if (autoShow)
        {
            this.visible = true;
        }

        let rootOffset = dom.cumulativeOffset(this.root);
        let textRect = Rect.fromLike(relativeRect).offset(rootOffset);

        dom.css(this.text, {
            left: `${textRect.left}px`,
            top: `${textRect.top}px`,
            width: `${textRect.width}px`,
            height: `${textRect.height}px`,
        });
    }

    public focus():void
    {
        let { text } = this;

        setTimeout(() =>
        {
            text.focus();
            text.setSelectionRange(text.value.length, text.value.length);
        }, 0);
    }

    public val(value?:string):string
    {
        if (value !== undefined)
        {
            this.text.value = value;
        }

        return this.text.value;
    }
}