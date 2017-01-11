import { DefaultGrid } from './../model/default/DefaultGrid';
import { FlexCell } from './../model/flexi/FlexCell';
import { DefaultRow } from './../model/default/DefaultRow';
import { GridModel } from './../model/GridModel';
import { GridRow } from '../model/GridRow';
import { GridCell } from '../model/GridCell';


export class ExampleGridBuilder
{
    constructor(private lines:number = 100, private cols:number = 52)
    {
    }

    public build():GridModel
    {
        let model = new DefaultGrid();

        this.createColumnRow(model.cells);

        for (let i = 0; i < this.lines; i++)
        {
            this.createResourceRow(model.cells, i);
        }

        return model;
    }

    private createColumnRow(cells:GridCell[]):void
    {
        cells.push(new FlexCell(0, 0, null, '+'));

        for (let i = 0; i < this.cols; i++)
        {
            let cell = new FlexCell(i + 1, 0);
            cell.value = 'Vertical #' + (i + 1);
            cells.push(cell);
        }
    }

    private createResourceRow(cells:GridCell[], line:number):void
    {
        cells.push(new FlexCell(0, line + 1, null, `Horizontal #${line}`));

        for (let i = 0; i < this.cols; i++)
        {
            let cell = new FlexCell(i + 1, line + 1);
            cell.value = (line + i).toString();
            cells.push(cell);
        }
    }
}