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

    @Variable(false)
    private canSelect:boolean = true;

    @Variable(false)
    private selections:Selection[] = [];

    public init(grid:GridElement, kernel:GridKernel)
    {
        this.grid = grid;

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

        // grid.on('invalidate', () => this.reselect(false));
        // grid.on('scroll', () => this.alignSelectors(false));

        kernel.variables.define('primarySelection', {
            get: () => this.primarySelection
        });
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

    @Command()
    private select(from:string, to:string, ...hints:SelectHints[]):void
    {
        this.doSelect(from, to, hints);
        //this.alignSelectors(true);
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

    // @command()
    // private selectNeighbor(vector:Point, autoScroll = true):void
    // {
    //     let { grid } = this;

    //     vector = vector.normalize();

    //     let ref = this.selection[0] || null;
    //     if (ref)
    //     {
    //         let cell = grid.model.findCellNeighbor(ref, vector);
    //         if (cell)
    //         {
    //             this.select([cell.ref], autoScroll);
    //         }
    //     }
    // }

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

        const from = args[0] || null;
        const to = typeof(args[1]) === 'string' ? args[1] : from;
        const hints = args.slice(typeof(args[1]) === 'string' ? 2 : 1);

        const { model, view } = this.grid;

        if (from)
        {
            const range = GridRange.expand(model, cellRefs);
            const selection = new SelectionImpl(range);

            if (!!~hints.indexOf(SelectHints.AutoScroll))
            {
                //NO I NEED THE FUCKING START -> END

                //view.measure
            }

            if (autoScroll)
            {
                grid.layout

                let primaryRect = grid.getCellViewRect(cellRefs[0]);
                grid.scrollTo(primaryRect);
            }
        }
        else
        {
            alert('Deselect');
            // this.selection = [];
            // this.selectGesture = null;
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
    constructor(private range:GridRange)
    {
        super();
    }

    public get ltr():GridCell[]
    {
        return this.range.ltr;
    }
    
    public get ttb():GridCell[]
    {
        return this.range.ttb;
    }

    public get width():number
    {
        return this.range.width;
    }

    public get height():number
    {
        return this.range.height;
    }

    public get length():number
    {
        return this.range.length;
    }
}