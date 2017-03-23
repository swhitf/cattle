import { GridCell } from '../../model/GridCell';
import { GridRange } from '../../model/GridRange';
import { GridKernel } from '.././../ui/GridKernel';
import { GridElement, GridMouseEvent, GridMouseDragEvent } from '.././../ui/GridElement';
import { KeyInput } from '../../input/KeyInput';
import { Point, PointLike } from '../../geom/Point';
import { RectLike, Rect } from '../../geom/Rect';
import { MouseInput } from '../../input/MouseInput';
import { MouseDragEventSupport } from '../../input/MouseDragEventSupport';
import { Widget, AbsWidgetBase } from '../../ui/Widget';
import { command, routine, variable } from '../../ui/Extensibility';
import * as Tether from 'tether';
import * as Dom from '../../misc/Dom';


const Vectors = {
    nw: new Point(-1, -1),
    n: new Point(0, -1),
    ne: new Point(1, -1),
    e: new Point(1, 0),
    se: new Point(1, 1),
    s: new Point(0, 1),
    sw: new Point(-1, 1),
    w: new Point(-1, 0),
};

interface SelectGesture
{
    start:string;
    end:string;
}

export interface SelectorWidget extends Widget
{

}

export interface SelectorExtensionExports
{
    canSelect:boolean;

    readonly selection:string[]

    readonly primarySelector:SelectorWidget;

    readonly captureSelector:SelectorWidget;

    select(cells:string[], autoScroll?:boolean):void;

    selectAll():void;

    selectBorder(vector:Point, autoScroll?:boolean):void;

    selectEdge(vector:Point, autoScroll?:boolean):void;

    selectLine(gridPt:Point, autoScroll?:boolean):void;

    selectNeighbor(vector:Point, autoScroll?:boolean):void;
}

export class SelectorExtension
{
    private grid:GridElement;
    private layer:HTMLElement;
    private selectGesture:SelectGesture;

    @variable()
    private canSelect:boolean = true;

    @variable(false)
    private selection:string[] = [];

    @variable(false)
    private primarySelector:Selector;

    @variable(false)
    private captureSelector:Selector;

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements(grid.root);

        KeyInput.for(grid)
            .on('!TAB', () => this.selectNeighbor(Vectors.e))
            .on('!SHIFT+TAB', () => this.selectNeighbor(Vectors.w))
            .on('!RIGHT_ARROW', () => this.selectNeighbor(Vectors.e))
            .on('!LEFT_ARROW', () => this.selectNeighbor(Vectors.w))
            .on('!UP_ARROW', () => this.selectNeighbor(Vectors.n))
            .on('!DOWN_ARROW', () => this.selectNeighbor(Vectors.s))
            .on('!CTRL+RIGHT_ARROW', () => this.selectEdge(Vectors.e))
            .on('!CTRL+LEFT_ARROW', () => this.selectEdge(Vectors.w))
            .on('!CTRL+UP_ARROW', () => this.selectEdge(Vectors.n))
            .on('!CTRL+DOWN_ARROW', () => this.selectEdge(Vectors.s))
            .on('!CTRL+A', () => this.selectAll())
            .on('!HOME', () => this.selectBorder(Vectors.w))
            .on('!CTRL+HOME', () => this.selectBorder(Vectors.nw))
            .on('!END', () => this.selectBorder(Vectors.e))
            .on('!CTRL+END', () => this.selectBorder(Vectors.se))
        ;

        MouseDragEventSupport.enable(grid.root);
        MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', (e:GridMouseEvent) => this.selectLine(new Point(e.offsetX, e.offsetY)))
            .on('DOWN:PRIMARY', (e:GridMouseEvent) => this.beginSelectGesture(e.offsetX, e.offsetY))
            .on('DRAG:PRIMARY', (e:GridMouseDragEvent) => this.updateSelectGesture(e.offsetX, e.offsetY))
            .on('UP:PRIMARY', (e:GridMouseDragEvent) => this.endSelectGesture(/*e.gridX, e.gridY*/))
        ;

        grid.on('invalidate', () => this.reselect(false));
        grid.on('scroll', () => this.alignSelectors(false));

        kernel.variables.define('isSelecting', {
            get: () => !!this.selectGesture
        });
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

        this.primarySelector = Selector.create(layer, true);
        this.captureSelector = Selector.create(layer, false);
    }

    @command()
    private select(cells:string[], autoScroll = true):void
    {
        this.doSelect(cells, autoScroll);
        this.alignSelectors(true);
    }

    @command()
    private selectAll():void
    {
        this.select(this.grid.model.cells.map(x => x.ref));
    }

    @command()
    private selectBorder(vector:Point, autoScroll = true):void
    {
        let { grid } = this;

        let ref = this.selection[0] || null;
        if (ref)
        {
            vector = vector.normalize();

            let startCell = grid.model.findCell(ref);
            let xy = { x: startCell.colRef, y: startCell.rowRef } as PointLike;

            if (vector.x < 0)
            {
                xy.x = 0;
            }
            if (vector.x > 0)
            {
                xy.x = grid.modelWidth - 1;
            }
            if (vector.y < 0)
            {
                xy.y = 0;
            }
            if (vector.y > 0)
            {
                xy.y = grid.modelHeight - 1;
            }

            let resultCell = grid.model.locateCell(xy.x, xy.y);
            if (resultCell)
            {
                this.select([resultCell.ref], autoScroll);
            }
        }
    }

    @command()
    private selectEdge(vector:Point, autoScroll = true):void
    {
        let { grid } = this;

        vector = vector.normalize();

        let empty = (cell:GridCell) => <any>(cell.value === ''  || cell.value === '0' || cell.value === undefined || cell.value === null);

        let ref = this.selection[0] || null;
        if (ref)
        {
            let startCell = grid.model.findCell(ref);
            let currCell = grid.model.findCellNeighbor(startCell.ref, vector);
            let resultCell = <GridCell>null;

            if (!currCell)
                return;

            while (true)
            {
                let a = currCell;
                let b = grid.model.findCellNeighbor(a.ref, vector);

                if (!a || !b)
                {
                    resultCell = !!a ? a : null;
                    break;
                }

                if (empty(a) + empty(b) == 1)
                {
                    resultCell = empty(a) ? b : a;
                    break;
                }

                currCell = b;
            }

            if (resultCell)
            {
                this.select([resultCell.ref], autoScroll);
            }
        }
    }

    @command()
    private selectLine(gridPt:Point, autoScroll = true):void
    {
        let { grid } = this;

        let ref = this.selection[0] || null;
        if (!ref)
            return;


        let startPt = grid.getCellGridRect(ref).topLeft();
        let lineRect = Rect.fromPoints(startPt, gridPt);

        let cellRefs = grid.getCellsInGridRect(lineRect).map(x => x.ref);
        cellRefs.splice(cellRefs.indexOf(ref), 1);
        cellRefs.splice(0, 0, ref);

        this.select(cellRefs, autoScroll);
    }

    @command()
    private selectNeighbor(vector:Point, autoScroll = true):void
    {
        let { grid } = this;

        vector = vector.normalize();

        let ref = this.selection[0] || null;
        if (ref)
        {
            let cell = grid.model.findCellNeighbor(ref, vector);
            if (cell)
            {
                this.select([cell.ref], autoScroll);
            }
        }
    }

    private reselect(autoScroll:boolean = true):void
    {
        let { grid, selection } = this;

        let remaining = selection.filter(x => !!grid.model.findCell(x));
        if (remaining.length != selection.length)
        {
            this.select(remaining, autoScroll);
        }
    }

    private beginSelectGesture(gridX:number, gridY:number):void
    {
        let pt = new Point(gridX, gridY);
        let cell = this.grid.getCellAtViewPoint(pt);

        if (!cell)
            return;

        this.selectGesture = {
            start: cell.ref,
            end: cell.ref,
        };

        this.select([ cell.ref ]);
    }

    private updateSelectGesture(gridX:number, gridY:number):void
    {
        let { grid, selectGesture } = this;

        let pt = new Point(gridX, gridY);
        let cell = grid.getCellAtViewPoint(pt);

        if (!cell || selectGesture.end === cell.ref)
            return;

        selectGesture.end = cell.ref;

        let region = Rect.fromMany([
            grid.getCellGridRect(selectGesture.start),
            grid.getCellGridRect(selectGesture.end)
        ]);

        let cellRefs = grid.getCellsInGridRect(region)
            .map(x =>x.ref);

        if (cellRefs.length > 1)
        {
            cellRefs.splice(cellRefs.indexOf(selectGesture.start), 1);
            cellRefs.splice(0, 0, selectGesture.start);
        }

        this.select(cellRefs, cellRefs.length == 1);
    }

    private endSelectGesture():void 
    {
        this.selectGesture = null;
    }

    @routine()
    private doSelect(cells:string[] = [], autoScroll:boolean = true):void
    {
        let { grid } = this;

        if (!this.canSelect)
            return;

        if (cells.length)
        {
            this.selection = cells;

            if (autoScroll)
            {
                grid.scrollToCell(cells[0]);
            }
        }
        else
        {
            this.selection = [];
            this.selectGesture = null;
        }
    }

    private alignSelectors(animate:boolean):void
    {
        let { grid, selection, primarySelector, captureSelector } = this;

        if (selection.length)
        {
            let primaryRect = grid.getCellViewRect(selection[0]);
            primarySelector.goto(primaryRect, animate);

            //Take upper left most and lower right most
            let range = GridRange.create(grid.model, selection);
            let tl = grid.getCellViewRect(range.ltr[0].ref);
            let br = grid.getCellViewRect(range.ltr[range.ltr.length - 1].ref);

            console.log(tl);
            console.log(br);

            let captureRect = Rect.fromMany([tl, br]);
            captureSelector.goto(captureRect, animate);
            captureSelector.toggle(selection.length > 1);
        }
        else
        {
            primarySelector.hide();
            captureSelector.hide();
        }
    }
}

class Selector extends AbsWidgetBase<HTMLDivElement>
{
    public static create(container:HTMLElement, primary:boolean = false):Selector
    {
        let root = document.createElement('div');
        root.className = 'grid-selector ' + (primary ? 'grid-selector-primary' : '');
        container.appendChild(root);

        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });

        return new Selector(root);
    }
}