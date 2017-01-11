import { CellModel } from '../model/CellModel';
import { GridKernel } from './../ui/GridKernel';
import { GridElement, GridMouseEvent, GridMouseDragEvent } from './../ui/GridElement';
import { GridModelIndex } from '../model/GridModelIndex';
import { KeyInput } from '../input/KeyInput';
import { Point } from '../geom/Point';
import { RectLike, Rect } from '../geom/Rect';
import { MouseInput } from '../input/MouseInput';
import { MouseDragEventSupport } from '../input/MouseDragEventSupport';
import { command, routine } from '../ui/Extensibility';
import { Widget, AbsWidgetBase } from '../ui/Widget';
import * as Tether from 'tether';
import * as Dom from '../misc/Dom';


const Vectors = {
    north: new Point(0, -1),
    south: new Point(0, 1),
    east: new Point(1, 0),
    west: new Point(-1, 0),
};

interface SelectGesture
{
    start:string;
    end:string;
}

export interface SelectorWidget extends Widget
{

}

export class SelectorExtension
{
    private grid:GridElement;
    private layer:HTMLElement;

    private selection:string[] = [];
    private primarySelector:Selector;
    private captureSelector:Selector;
    private selectGesture:SelectGesture;

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.createElements(grid.root);

        KeyInput.for(grid)
            .on('!TAB', () => this.selectNeighbor(Vectors.east))
            .on('!SHIFT+TAB', () => this.selectNeighbor(Vectors.west))
            .on('RIGHT_ARROW', () => this.selectNeighbor(Vectors.east))
            .on('LEFT_ARROW', () => this.selectNeighbor(Vectors.west))
            .on('UP_ARROW', () => this.selectNeighbor(Vectors.north))
            .on('DOWN_ARROW', () => this.selectNeighbor(Vectors.south))
            .on('CTRL+RIGHT_ARROW', () => this.selectEdge(Vectors.east))
            .on('CTRL+LEFT_ARROW', () => this.selectEdge(Vectors.west))
            .on('CTRL+UP_ARROW', () => this.selectEdge(Vectors.north))
            .on('CTRL+DOWN_ARROW', () => this.selectEdge(Vectors.south))
            .on('CTRL+A', () => this.selectAll())
        ;

        MouseDragEventSupport.enable(grid.root);
        MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', (e:GridMouseEvent) => this.selectLine(new Point(e.gridX, e.gridY)))
            .on('DOWN:PRIMARY', (e:GridMouseEvent) => this.beginSelectGesture(e.gridX, e.gridY))
            .on('DRAG:PRIMARY', (e:GridMouseDragEvent) => this.updateSelectGesture(e.gridX, e.gridY))
        ;

        grid.on('invalidate', () => this.reselect(false));
        grid.on('scroll', () => this.alignSelectors(false));

        kernel.variables.define('selection', { get: () => this.selection });
        kernel.variables.define('primarySelector', { get: () => this.primarySelector });
        kernel.variables.define('captureSelector', { get: () => this.captureSelector });
    }

    private get index():GridModelIndex
    {
        return this.grid.kernel.variables.get('modelIndex');
    }

    private createElements(target:HTMLElement):void
    {
        let layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, {
            pointerEvents: 'none',
            overflow: 'hidden',
            width: target.clientWidth + 'px',
            height: target.clientHeight + 'px',
        });
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });

        t.position();

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
    private selectEdge(vector:Point, autoScroll = true):void
    {
        vector = vector.normalize();

        let empty = (cell:CellModel) => <any>(cell.value === '' || cell.value === undefined || cell.value === null);

        let ref = this.selection[0] || null;
        if (ref)
        {
            let startCell = this.index.findCell(ref);
            let currCell = this.index.findCellNeighbor(startCell.ref, vector);
            let resultCell = <CellModel>null;

            if (!currCell)
                return;

            while (true)
            {
                let a = currCell;
                let b = this.index.findCellNeighbor(a.ref, vector);

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
        vector = vector.normalize();

        let ref = this.selection[0] || null;
        if (ref)
        {
            let cell = this.index.findCellNeighbor(ref, vector);
            if (cell)
            {
                this.select([cell.ref], autoScroll);
            }
        }
    }

    private reselect(autoScroll:boolean = true):void
    {
        let { index, selection } = this;

        let remaining = selection.filter(x => !!index.findCell(x));
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

    @routine()
    private doSelect(cells:string[] = [], autoScroll:boolean = true):void
    {
        let { grid } = this;

        if (cells.length)
        {
            this.selection = cells;

            if (autoScroll)
            {
                let primaryRect = grid.getCellViewRect(cells[0]);
                grid.scrollTo(primaryRect);
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

            //TODO: Improve the shit out of this:
            let captureRect = Rect.fromMany(selection.map(x => grid.getCellViewRect(x)));
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