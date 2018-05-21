import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridCellEvent } from '../../core/events/GridCellEvent';
import { GridChangeEvent } from '../../core/events/GridChangeEvent';
import { Command, Routine } from '../../core/Extensibility';
import { GridElement } from '../../core/GridElement';
import { GridKernel } from '../../core/GridKernel';
import { Point } from '../../geom/Point';
import { Rect, RectLike } from '../../geom/Rect';
import * as dom from '../../misc/Dom';
import { Vectors } from '../../misc/Vectors';
import { GridCell } from '../../model/GridCell';
import { GridRange } from '../../model/GridRange';
import { KeyBehavior } from '../../vom/input/KeyBehavior';
import { MouseBehavior } from '../../vom/input/MouseBehavior';
import { NetVisual } from '../nets/NetVisual';
import { Selection } from '../selector/SelectorExtension';
import { ExternalInput } from './ExternalInput';
import { GridChangeSet } from './GridChangeSet';
import { GridCommitEvent } from './GridCommitEvent';


enum State
{
    Idle = 'idle',
    Editing = 'editing',
    EditingPrecise = 'editingPrecice',
}

export class EditingExtension extends AbstractDestroyable
{
    public static linkStaticInput(grid:GridElement, input:HTMLInputElement):void
    {
        ExternalInput.create(grid, input);
    }

    private grid:GridElement;
    private inputHandle:InputHandle;
    private state:State = State.Idle;

    constructor(private autoApply:boolean = true)
    {
        super();
    }

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.inputHandle = InputHandle.create(grid.container);

        MouseBehavior.for(grid.surface)
            .on(['LEFT.DBLCLICK/e'], () => this.doBeginEdit())
        ;
 
        KeyBehavior.for(grid.surface)
            .when(() => this.state == State.Idle, x => x
                .on('BACKSPACE/e/x', () => this.doBeginEdit(''))
                .on('DELETE', () => this.erase())
                .on('*.PRESS', e => !!e.char && !e.modifiers.ctrl && !e.modifiers.alt ? this.doBeginEdit(e.char) : true)                
            )
        ;

        MouseBehavior.for(this.inputHandle.elmt)
            .on(['LEFT', 'MIDDLE', 'RIGHT'], () => this.state = State.EditingPrecise)
        ;

        KeyBehavior.for(this.inputHandle.elmt)
            .on('ESCAPE/e/x', () => this.doEndEdit(false))
            .on('ENTER/e/x', () => this.endEditToNeighbor(Vectors.e))
            .on('TAB/e/x', () => this.endEditToNeighbor(Vectors.e))
            .on('SHIFT+TAB/e/x', () => this.endEditToNeighbor(Vectors.w))
            .when(() => this.state == State.Editing, x => x
                .on('UP_ARROW/e/x', () => this.endEditToNeighbor(Vectors.n))
                .on('DOWN_ARROW/e/x', () => this.endEditToNeighbor(Vectors.s))
                .on('RIGHT_ARROW/e/x', () => this.endEditToNeighbor(Vectors.e))
                .on('LEFT_ARROW/e/x', () => this.endEditToNeighbor(Vectors.w))
            )          
            .on([
                    'SHIFT+UP_ARROW/e', 'CTRL+UP_ARROW/e',
                    'SHIFT+DOWN_ARROW/e', 'CTRL+DOWN_ARROW/e',
                    'SHIFT+RIGHT_ARROW/e', 'CTRL+RIGHT_ARROW/e',
                    'SHIFT+LEFT_ARROW/e', 'CTRL+LEFT_ARROW/e',
                ], () => this.state = State.EditingPrecise)
            .on('*.UP', e => this.grid.emit(new GridChangeEvent(this.grid, 'editValue')))
        ;

        //Before select commit pending edit
        kernel.routines.hook('before:doSelect', () => this.doEndEdit(true));
    
        //Export input element and edit value for other modules
        kernel.variables.define('editInput', { get: () => this.inputHandle.elmt } );
        kernel.variables.define('editValue', { get: () => this.inputHandle.elmt.value, } );
    }

    private get primarySelection():Selection
    {
        return this.grid.kernel.variables.get('primarySelection');
    }

    private get selections():Selection[]
    {
        return this.grid.kernel.variables.get('selections');
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

    @Command('beginEdit')
    @Routine()
    private doBeginEdit(override?:string, autoFocus:boolean = true):boolean
    {
        let { grid, inputHandle, primarySelection } = this;

        if (this.state != State.Idle || !primarySelection) return false;

        let cell = grid.model.findCell(primarySelection.from);
        if (!cell || is_readonly(cell)) return false;

        let inputRect = this.computeInputRect();
        if (!inputRect) return false;

        if (!!override || override === '')
        {
            inputHandle.val(override);
        }
        else
        {
            inputHandle.val(cell.value);
        }

        inputHandle.goto(inputRect);

        if (autoFocus)
        {
            inputHandle.focus();
        }

        this.state = State.Editing;

        grid.emit(new GridCellEvent('beginEdit', grid, primarySelection.from));
        grid.emit(new GridChangeEvent(grid, 'editValue'));
        
        return true;
    }

    @Routine()
    private doEndEdit(commit?:boolean):boolean
    {
        let { grid, inputHandle, primarySelection } = this;

        if (this.state == State.Idle)
            return false;

        let newValue = inputHandle.val();

        inputHandle.visible = false;
        inputHandle.val('');
        grid.focus();

        if (commit && !!primarySelection)
        {
            this.commitUniform([primarySelection.from], newValue);
        }

        this.state = State.Idle;

        grid.emit(new GridChangeEvent(grid, 'editValue'));
        grid.emit(new GridCellEvent('endEdit', grid, primarySelection.from));

        return true;
    }

    @Command()
    private erase():void
    {
        let { grid, selections } = this;

        if (this.state != State.Idle)
            return;

        let changes = new GridChangeSet();
        
        for (let s of selections)
        {
            let range = GridRange.fromRefs(grid.model, [s.from, s.to]);
            let cells = range.ltr.filter(x => !is_readonly(x));    

            cells.forEach(c => changes.set(c.ref, '', false));
        }

        this.commit(changes);
    }

    @Routine()
    private doCommit(changes:GridChangeSet):void
    {
        let { autoApply, grid } = this;

        if (changes.length)
        {
            if (autoApply)
            {
                changes.apply(grid.model);
                // grid.forceUpdate();
            }
            
            grid.emit(new GridCommitEvent(grid, changes));
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

class InputHandle
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
        let { text, visible } = this;
        if (!visible) return;

        setTimeout(() =>
        {
            text.focus();
            text.setSelectionRange(text.value.length, text.value.length);
        }, 0);
    }

    public val(value?:string):string
    {
        let { text } = this;
        
        if (value !== undefined)
        {
            text.value = value;
        }

        return text.value;
    }
}