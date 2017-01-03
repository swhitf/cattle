import { DefaultGrid } from './../model/default/DefaultGrid';
import { FlexCell } from './../model/flexi/FlexCell';
import { DefaultRow } from './../model/default/DefaultRow';
import { GridBuilder } from './../model/GridBuilder';
import { GridModel } from './../model/GridModel';
import { RowModel } from './../model/RowModel';
import { CellModel } from './../model/CellModel';


export class TimelineGridBuilder implements GridBuilder
{
    constructor(private resources:number = 100, private weeks:number = 108)
    {
    }

    public build():GridModel
    {
        let model = new DefaultGrid();

        this.createColumnRow(model.cells);

        for (let i = 0; i < this.resources; i++)
        {
            this.createResourceRow(model.cells, i);
        }

        return model;
    }

    private createColumnRow(cells:CellModel[]):void
    {
        cells.push(new FlexCell(0, 0, null, '+'));

        let date = monday();

        for (let i = 0; i < this.weeks; i++)
        {
            let cell = new FlexCell(i + 1, 0);
            cell.value = date.toLocaleDateString();
            cells.push(cell);

            date.setDate(date.getDate() + 7);
        }
    }

    private createResourceRow(cells:CellModel[], resource:number):void
    {
        cells.push(new FlexCell(0, resource + 1, null, `Resource #${resource}`));

        for (let i = 0; i < this.weeks; i++)
        {
            let cell = new FlexCell(i + 1, resource + 1);
            cell.value = '';
            cells.push(cell);
        }
    }
}

function monday():Date
{
    let d = new Date(),
        day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}