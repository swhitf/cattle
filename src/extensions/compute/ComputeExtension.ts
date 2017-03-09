import { ComputeEngine } from './ComputeEngine';
import { JavaScriptComputeEngine } from './JavaScriptComputeEngine';
import { GridExtension, GridElement } from '../../ui/GridElement';
import { GridKernel } from '../../ui/GridKernel';
import { GridChangeSet } from '../common/EditingExtension';
import { GridRange } from '../../model/GridRange';
import { GridCell } from '../../model/GridCell';
import { Point } from '../../geom/Point';
import { extend, flatten, zipPairs } from '../../misc/Util';


export interface GridCellWithFormula extends GridCell
{
    formula:string;
}

export class ComputeExtension implements GridExtension
{
    protected readonly engine:ComputeEngine;

    private noCapture:boolean = false;
    private grid:GridElement;

    constructor(engine?:ComputeEngine)
    {
        this.engine = engine || new JavaScriptComputeEngine();
    }

    private get selection():string
    {
        return this.grid.kernel.variables.get('selection');
    }

    public init?(grid:GridElement, kernel:GridKernel):void
    {
        this.grid = grid;
        this.engine.connect(grid);

        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));

        grid.on('invalidate', this.reload.bind(this));
    }

    private reload():void
    {
        let { engine, grid } = this;
        let program = {} as any;

        engine.clear();
                
        for (let cell of grid.model.cells) 
        {
            let formula = cell['formula'] as string;
            if (!!formula)
            {
                engine.program(cell.ref, formula);
            }
        }

        this.noCapture = true;
        grid.exec('commit', engine.compute());
        this.noCapture = false;
    }

    private beginEditOverride(override:string, impl:any):boolean
    {
        let { engine, selection } = this;

        if (!selection[0])
        {
            return false;
        }

        if (!override && override !== '')
        {
            override = engine.getFormula(selection[0]) || null;
        }

        return impl(override);
    }

    private commitOverride(changes:GridChangeSet, impl:any):void
    {
        let { engine, grid } = this;

        if (!this.noCapture)
        {
            let scope = new GridChangeSet();
            let computeList = [] as string[];

            for (let tm of changes.contents())
            {
                let cell = grid.model.findCell(tm.ref);
                if (cell['readonly'] !== true && cell['mutable'] !== false)
                {
                    if (tm.value.length > 0 && tm.value[0] === '=')
                    {
                        engine.program(tm.ref, tm.value);
                    }
                    else
                    {
                        engine.clear([tm.ref]);
                        scope.put(tm.ref, tm.value, tm.cascaded);
                    }                
                }

                computeList.push(tm.ref);
            }
            
            if (computeList.length)
            {
                changes = engine.compute(computeList, scope);
            }
        }
        
        impl(changes);
    }
}