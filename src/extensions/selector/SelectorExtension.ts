import { KeyGesture } from '../../vom/input/KeyGesture';
import { CellVisual } from '../../core/CellVisual';
import { VisualMouseEvent } from '../../vom/events/VisualMouseEvent';
import { MouseGesture } from '../../vom/input/MouseGesture';
import { NetManager } from '../nets/NetManager';
import { GridEvent } from '../../core/events/GridEvent';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { GridRange, GridRangeLike } from '../../model/GridRange';
import { Destroyable } from '../../base/Destroyable';
import { select } from '../../vom/VisualQuery';
import { GridElement } from '../../core/GridElement';
import { Command, Routine, Variable } from '../../core/Extensibility';
import { GridKernel, GridVariable } from '../../core/GridKernel';
import { GridCell } from '../../model/GridCell';
import { Point, PointLike } from '../../geom/Point';
import { RectLike, Rect } from '../../geom/Rect';
import * as Tether from 'tether';
import * as Dom from '../../misc/Dom';
import * as u from '../../misc/Util';


let Vectors = {
    nw: new Point(-1, -1),
    n: new Point(0, -1),
    ne: new Point(1, -1),
    e: new Point(1, 0),
    se: new Point(1, 1),
    s: new Point(0, 1),
    sw: new Point(-1, 1),
    w: new Point(-1, 0),
};

export interface SelectorExtensionExports
{
    canSelect:boolean;

    readonly selections:string[][];

    readonly primarySelection:string[]

    select(cells:string[], autoScroll?:boolean):void;

    selectAll():void;

    selectBorder(vector:Point, autoScroll?:boolean):void;

    selectEdge(vector:Point, autoScroll?:boolean):void;

    selectLine(gridPt:Point, autoScroll?:boolean):void;

    selectNeighbor(vector:Point, autoScroll?:boolean):void;
}

export interface Selection extends Destroyable
{
    readonly from:string;

    readonly to:string;
}

export enum SelectHints
{
    AutoScroll,
    Append,
}

export class SelectorExtension
{
    private grid:GridElement;
    private kernel:GridKernel;

    @Variable(false)
    private canSelect:boolean = true;

    @Variable(false)
    private selections:SelectionImpl[] = [];

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;
        this.kernel = kernel;

        /*
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

        MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', (e:GridMouseEvent) => this.selectLine(new Point(e.gridX, e.gridY)))
            .on('DOWN:PRIMARY', (e:GridMouseEvent) => this.beginSelectGesture(e.gridX, e.gridY))
            .on('DRAG:PRIMARY', (e:GridMouseDragEvent) => this.updateSelectGesture(e.gridX, e.gridY))
            .on('UP:PRIMARY', (e:GridMouseDragEvent) => this.endSelectGesture(e.gridX, e.gridY))
        ;
        */

        //event.target to cell ref
        const e2ref = (e:VisualMouseEvent) => {
            let cell = grid.layout.pickCell(e.surfacePoint);
            return !!cell ? cell.ref : null;
        };

        MouseGesture.for(grid.surface)
            .on(['LEFT.DOWN', 'LEFT.DOWN+CTRL+SHIFT'], e => this.select(e2ref(e)))
            .on(['LEFT.DOWN+CTRL'], e => this.select(e2ref(e), null, SelectHints.Append))
            .on(['LEFT.DRAG', 'LEFT.DOWN+SHIFT'], e => this.select((this.primarySelection || {} as any).from, e2ref(e)))
            //.on('LEFT.DRAG', e => this.select(et2ref(e)))
        ;

        KeyGesture.for(grid.surface)
            .on('RIGHT_ARROW', () => this.selectNext(Vectors.e))
            .on('LEFT_ARROW', () => this.selectNext(Vectors.w))
            .on('UP_ARROW', () => this.selectNext(Vectors.n))
            .on('DOWN_ARROW', () => this.selectNext(Vectors.s))
        ;

        // grid.on('invalidate', () => this.reselect(false));
        // grid.on('scroll', () => this.alignSelectors(false));

        //On select visualize selection
        grid.on('select', () => this.doVisualizeSelection());

        kernel.variables.define('primarySelection', {
            get: () => this.primarySelection
        });
    }

    private get nets():NetManager
    {
        return this.kernel.variables.get('nets');
    }

    private get primarySelection():Selection
    {
        return !!this.selections.length ? this.selections[this.selections.length - 1] : null;
    }

    // private createElements(target:HTMLElement):void
    // {
    //     let layer = document.createElement('div');
    //     layer.className = 'grid-layer';
    //     Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
    //     target.parentElement.insertBefore(layer, target);

    //     let t = new Tether({
    //         element: layer,
    //         target: target,
    //         attachment: 'middle center',
    //         targetAttachment: 'middle center',
    //     });

    //     let onBash = () => {
    //         Dom.fit(layer, target);
    //         t.position();
    //     };

    //     this.grid.on('bash', onBash);
    //     onBash();

    //     this.layer = layer;

    //     this.primarySelector = Selector.create(layer, true);
    //     this.captureSelector = Selector.create(layer, false);
    // }

    private select(from:string, to:string, ...hints:SelectHints[]):void;
    private select(cell:string, ...hints:SelectHints[]):void;

    @Command()
    private select(...args:any[]):void
    {
        this.doSelect.apply(this, args);
    }

    // @command()
    // private selectAll():void
    // {
    //     this.select(this.grid.model.cells.map(x => x.ref));
    // }

    // @command()
    // private selectBorder(vector:Point, autoScroll = true):void
    // {
    //     let { grid } = this;

    //     let ref = this.selection[0] || null;
    //     if (ref)
    //     {
    //         vector = vector.normalize();

    //         let startCell = grid.model.findCell(ref);
    //         let xy = { x: startCell.colRef, y: startCell.rowRef } as PointLike;

    //         if (vector.x < 0)
    //         {
    //             xy.x = 0;
    //         }
    //         if (vector.x > 0)
    //         {
    //             xy.x = grid.modelWidth - 1;
    //         }
    //         if (vector.y < 0)
    //         {
    //             xy.y = 0;
    //         }
    //         if (vector.y > 0)
    //         {
    //             xy.y = grid.modelHeight - 1;
    //         }

    //         let resultCell = grid.model.locateCell(xy.x, xy.y);
    //         if (resultCell)
    //         {
    //             this.select([resultCell.ref], autoScroll);
    //         }
    //     }
    // }

    // @command()
    // private selectEdge(vector:Point, autoScroll = true):void
    // {
    //     let { grid } = this;

    //     vector = vector.normalize();

    //     let empty = (cell:GridCell) => <any>(cell.value === ''  || cell.value === '0' || cell.value === undefined || cell.value === null);

    //     let ref = this.selection[0] || null;
    //     if (ref)
    //     {
    //         let startCell = grid.model.findCell(ref);
    //         let currCell = grid.model.findCellNeighbor(startCell.ref, vector);
    //         let resultCell = <GridCell>null;

    //         if (!currCell)
    //             return;

    //         while (true)
    //         {
    //             let a = currCell;
    //             let b = grid.model.findCellNeighbor(a.ref, vector);

    //             if (!a || !b)
    //             {
    //                 resultCell = !!a ? a : null;
    //                 break;
    //             }

    //             if (empty(a) + empty(b) == 1)
    //             {
    //                 resultCell = empty(a) ? b : a;
    //                 break;
    //             }

    //             currCell = b;
    //         }

    //         if (resultCell)
    //         {
    //             this.select([resultCell.ref], autoScroll);
    //         }
    //     }
    // }

    // @command()
    // private selectLine(gridPt:Point, autoScroll = true):void
    // {
    //     let { grid } = this;

    //     let ref = this.selection[0] || null;
    //     if (!ref)
    //         return;


    //     let startPt = grid.getCellGridRect(ref).topLeft();
    //     let lineRect = Rect.fromPoints(startPt, gridPt);

    //     let cellRefs = grid.getCellsInGridRect(lineRect).map(x => x.ref);
    //     cellRefs.splice(cellRefs.indexOf(ref), 1);
    //     cellRefs.splice(0, 0, ref);

    //     this.select(cellRefs, autoScroll);
    // }

    @Command()
    private selectNext(vector:Point):void
    {
        let { grid, primarySelection } = this;

        vector = vector.normalize();

        if (primarySelection)
        {
            let cell = grid.model.findCellNeighbor(primarySelection.from, vector);
            if (cell)
            {
                this.doSelect(cell.ref);
            }
        }
    }

    // private reselect(autoScroll:boolean = true):void
    // {
    //     let { grid, selection } = this;

    //     let remaining = selection.filter(x => !!grid.model.findCell(x));
    //     if (remaining.length != selection.length)
    //     {
    //         this.select(remaining, autoScroll);
    //     }
    // }

    // private beginSelectGesture(gridX:number, gridY:number):void
    // {
    //     let pt = new Point(gridX, gridY);
    //     let cell = this.grid.getCellAtViewPoint(pt);

    //     if (!cell)
    //         return;

    //     this.selectGesture = {
    //         start: cell.ref,
    //         end: cell.ref,
    //     };

    //     this.select([ cell.ref ]);
    // }

    // private updateSelectGesture(gridX:number, gridY:number):void
    // {
    //     let { grid, selectGesture } = this;

    //     let pt = new Point(gridX, gridY);
    //     let cell = grid.getCellAtViewPoint(pt);

    //     if (!cell || selectGesture.end === cell.ref)
    //         return;

    //     selectGesture.end = cell.ref;

    //     let region = Rect.fromMany([
    //         grid.getCellGridRect(selectGesture.start),
    //         grid.getCellGridRect(selectGesture.end)
    //     ]);

    //     let cellRefs = grid.getCellsInGridRect(region)
    //         .map(x =>x.ref);

    //     if (cellRefs.length > 1)
    //     {
    //         cellRefs.splice(cellRefs.indexOf(selectGesture.start), 1);
    //         cellRefs.splice(0, 0, selectGesture.start);
    //     }

    //     this.select(cellRefs, cellRefs.length == 1);
    // }

    // private endSelectGesture():void 
    // {
    //     this.selectGesture = null;
    // }

    private doSelect(from:string, to:string, ...hints:SelectHints[]):void;
    private doSelect(cell:string, ...hints:SelectHints[]):void;

    @Routine()
    private doSelect(...args:any[]):void
    {
        if (!this.canSelect)
            return;

        while (args[0] === undefined && args.length > 0) 
        {
            args.splice(0, 1);
        }

        let from = args[0] || null;
        let to = typeof(args[1]) === 'string' ? args[1] : from;
        let hints = args.slice(typeof(args[1]) === 'string' ? 2 : 1);

        let selections = this.selections;
        let grid = this.grid;
        let model = grid.model;

        for (let sel of selections) {
            if (sel.from == from && sel.to == to) {
                return;
            }
        }

        if (from && !!model.findCell(from) && !!model.findCell(to))
        {
            let sel = new SelectionImpl(from, to);

            if (!!~hints.indexOf(SelectHints.Append))
            {
                selections.push(sel);
            }
            else
            {
                selections.splice(0, selections.length, sel);
            }

            if (!!~hints.indexOf(SelectHints.AutoScroll))
            {
                // let primaryRect = grid.getCellViewRect(cellRefs[0]);
                // grid.scrollTo(primaryRect);
            }
        }
        else
        {
            // this.selection = [];
            // this.selectGesture = null;
        }

        grid.emit(new GridEvent('select', grid));
    }

    @Routine()
    private doVisualizeSelection():void
    {
        let { primarySelection, selections, nets } = this;

        let selectionMap = u.index(selections, x => x.id);
        let netMap = u.index(nets.toArray(x => x.type == 'selection'), x => x.id);

        //For any selections that do not have nets, create nets
        for (let id in selectionMap)
        {
            let s = selectionMap[id];

            if (!netMap[id])
            {
                netMap[id] = nets.create(id, 'selection', s.from, s.to);
            }
        }

        //For any nets that do not have selections, destroy nets
        for (let id in netMap)
        {
            let n = netMap[id];

            if (!selectionMap[id])
            {
                nets.destroy(id);
                delete netMap[id];
            }
        }

        //If we have selections, show the primary net on the primary selection from cell
        if (primarySelection) {            
            let inputNet = nets.get('input');
            if (inputNet) {
                inputNet.move(primarySelection.from);
            }
            else {
                inputNet = nets.create('input', 'input', primarySelection.from);
            }
        }
        else {
            nets.destroy('input');
        }
    }

    // private alignSelectors(animate:boolean):void
    // {
    //     let { grid, selection, primarySelector, captureSelector } = this;

    //     if (selection.length)
    //     {
    //         let primaryRect = grid.getCellViewRect(selection[0]);
    //         primarySelector.goto(primaryRect, animate);

    //         //TODO: Improve the shit out of this:
    //         let captureRect = Rect.fromMany(selection.map(x => grid.getCellViewRect(x)));
    //         captureSelector.goto(captureRect, animate);
    //         captureSelector.toggle(selection.length > 1);
    //     }
    //     else
    //     {
    //         primarySelector.hide();
    //         captureSelector.hide();
    //     }

        // let { grid, selection, primarySelector, captureSelector } = this;
        
        // if (selection.length)
        // {
        //     let primaryRect = grid.getCellViewRect(selection[0]);
        //     primarySelector.goto(primaryRect, animate);

        //     //TODO: Improve the shit out of this:
        //     let captureRect = Rect.fromMany(selection.map(x => grid.getCellViewRect(x)));
        //     captureSelector.goto(captureRect, animate);
        //     captureSelector.toggle(selection.length > 1);
        // }
        // else
        // {
        //     primarySelector.hide();
        //     captureSelector.hide();
        // }





    // }
}

// class Selector extends AbsWidgetBase<HTMLDivElement>
// {
//     public static create(container:HTMLElement, primary:boolean = false):Selector
//     {
//         let root = document.createElement('div');
//         root.className = 'grid-selector ' + (primary ? 'grid-selector-primary' : '');
//         container.appendChild(root);

//         Dom.css(root, {
//             position: 'absolute',
//             left: '0px',
//             top: '0px',
//             display: 'none',
//         });

//         return new Selector(root);
//     }
// }

class SelectionImpl extends AbstractDestroyable implements Selection
{
    private static tracker:number = 0;

    public readonly id:string;

    constructor(public from:string, public to:string)
    {
        super();

        this.id = `S${++SelectionImpl.tracker}`;
    }

    public toString():string
    {
        if (this.from === this.to)
        {
            return this.from;
        }
        else
        {
            return `${this.from}:${this.to}`;
        }
    }
}