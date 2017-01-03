import { GridModelIndex } from './../model/GridModelIndex';
import { Point } from './../geom/Point';
import { ObjectIndex } from './../global';
import { Keys } from '../input/Keys';
import { EventEmitterBase } from './../ui/internal/EventEmitter';
import { GridMouseEvent, GridKeyboardEvent } from './../ui/GridElement';
import { GridElement } from '../ui/GridElement';
import * as Tether from 'tether';


const ArrowKeys:number[] = [ Keys.LEFT_ARROW, Keys.UP_ARROW, Keys.RIGHT_ARROW, Keys.DOWN_ARROW ];
const ArrowVectors:ObjectIndex<Point> = {};
ArrowVectors[Keys.LEFT_ARROW] = new Point(-1, 0);
ArrowVectors[Keys.UP_ARROW] = new Point(0, -1);
ArrowVectors[Keys.RIGHT_ARROW] = new Point(1, 0);
ArrowVectors[Keys.DOWN_ARROW] = new Point(0, 1);

export class EditBehavior extends EventEmitterBase
{
    private index:GridModelIndex;
    private selection:string[];

    private grid:GridElement;
    private input:HTMLInputElement;
    private selector:HTMLDivElement;

    public init(grid:GridElement):void
    {
        this.grid = grid;
        this.index = new GridModelIndex(grid.model);

        this.createSurface(grid.root);

        grid.on('layout', () => this.index = new GridModelIndex(grid.model));
        grid.on('layout', () => this.reselect());
        grid.on('scroll', () => this.reselect());
        grid.on('mousedown', this.onGridMouseDown.bind(this));
        grid.on('keydown', this.onGridKeyDown.bind(this));
        grid.on('keypress', this.onGridKeyPress.bind(this));
    }

    public select(cells:string[]):void
    {
        let { grid, selector } = this;

        if (!this.endEdit())
            return;

        this.selection = cells;
        let rect = grid.getCellViewRect(this.selection[0]);

        if (rect.left < 0)
        {
            grid.scrollLeft += rect.left;
        }
        if (rect.right > grid.width)
        {
            grid.scrollLeft += rect.right - grid.width;
        }
        if (rect.top < 0)
        {
            grid.scrollTop += rect.top;
        }
        if (rect.bottom > grid.height)
        {
            grid.scrollTop += rect.bottom - grid.height;
        }

        rect = grid.getCellViewRect(this.selection[0]);

        selector.style.width = `${rect.width + 1}px`;
        selector.style.height = `${rect.height + 1}px`;
        selector.style.overflow = `hidden`;
        selector.style.transform = `translate(${rect.left - 1}px, ${rect.top - 1}px)`
    }

    private createSurface(target:HTMLElement):void
    {
        let gridRoot = this.grid.root;

        let editRoot = document.createElement('div');
        editRoot.style.pointerEvents = 'none';
        editRoot.style.width = gridRoot.clientWidth + 'px';
        editRoot.style.height = gridRoot.clientHeight + 'px';
        gridRoot.parentElement.insertBefore(editRoot, gridRoot);

        let t = new Tether({
            element: editRoot,
            target: gridRoot,
            attachment: 'middle center',
            targetAttachment: 'middle center'
        });

        t.position();

        let selector = document.createElement('div');
        selector.className = 'grid-selector';
        editRoot.appendChild(selector);

        let input = document.createElement('input');
        input.type = 'text';
        selector.appendChild(input);

        this.input = input;
        this.selector = selector;
    }

    private onGridMouseDown(e:GridMouseEvent):void
    {
        if (e.cell)
        {
            this.select([e.cell.ref]);
        }
    }

    private onGridKeyDown(e:GridKeyboardEvent):void
    {
        if (ArrowKeys.some(x => x === e.keyCode))
        {
            let vector = ArrowVectors[e.keyCode];
            
            if (e.ctrlKey)
            {
                
            }
            else
            {
                this.selectNeighbor(vector);
            }
        }
        else if (e.keyCode === Keys.TAB)
        {
            e.preventDefault();
            this.selectNeighbor(e.shiftKey ? new Point(-1, 0) : new Point(1, 0));
        }
    }

    private onGridKeyPress(e:GridKeyboardEvent):void
    {
        if (!this.beginEdit(String.fromCharCode(e.charCode)))
        {

        }
    }

    private alignSelector():void
    {

    }

    private reselect():void
    {
        let { index, selection } = this;

        let remaining = selection.filter(x => !!index.findCell(x));
        if (remaining.length != selection.length)
        {
            this.select(remaining);
        }
    }

    private selectNeighbor(vector:Point):void
    {
        let ref = this.selection[0] || null;
        if (ref)
        {
            let cell = this.index.findCellNeighbor(ref, vector);
            if (cell)
            {
                this.select([cell.ref]);
            }
        }
    }

    private isEditing:boolean = false;

    private beginEdit(override:string = null):boolean
    {
        if (this.isEditing)
            return false;

        let { input } = this;
        let cell = this.index.findCell(this.selection[0]);

        if (!!override)
        {
            input.value = override;
        }

        setTimeout(() =>
        {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }, 0);

        return this.isEditing = true;
    }

    private endEdit(commit:boolean = true):boolean
    {
        if (!this.isEditing)
            return true;

        let { grid, input } = this;
        let evt = {
            cell: this.index.findCell(this.selection[0]),
            value: input.value,
        }

        input.value = '';
        grid.focus();
        this.emit('input', evt);

        return !(this.isEditing = false);
    }
}
