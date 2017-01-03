import { GridBuilder } from '../GridBuilder';
import { GridModel } from '../GridModel';
import { DefaultGrid } from '../default/DefaultGrid';
import { FlexCell } from './FlexCell';
import { CellModel } from '../CellModel';


export class FlexGridBuilder implements GridBuilder
{
    public createHeader:boolean = true;
    public createMargin:boolean = true;

    constructor(public columns:number, public rows:number)
    {
    }

    public build():GridModel
    {
        console.time('FlexGridBuilder.build');

        let hori = this.columns + (this.createMargin ? 1 : 0);
        let vert = this.rows + (this.createHeader ? 1 : 0);

        let grid = new DefaultGrid();

        for (let c = 0; c < hori; c++)
        {
            for (let r = 0; r < vert; r++)
            {
                if ((this.createHeader || this.createMargin) && (c + r) == 0)
                {
                    grid.cells.push(new FlexCell(c, r, null, 'X'));
                }
                else if (this.createHeader && r == 0)
                {
                    grid.cells.push(new FlexCell(c, r, null, String.fromCharCode(64 + c)));
                }
                else if (this.createMargin && c == 0)
                {
                    grid.cells.push(new FlexCell(c, r, null, `${r}`));
                }
                else
                {
                    grid.cells.push(new FlexCell(c, r, null, `Cell ${c}x${r}`));
                }
            }
        }

        console.timeEnd('FlexGridBuilder.build');
        return grid;
    }
}

interface CellFactory
{
    (col:number, row:number):CellModel;
}
