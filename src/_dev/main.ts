import { DefaultHistoryManager, GridExtension, GridKernel } from '../';
import { ClickZoneExtension } from '../extensions/extra/ClickZoneExtension';
import { EditingExtension, GridEditEvent } from '../extensions/common/EditingExtension';
import { GridElement } from '../ui/GridElement';
import { SelectorExtension } from '../extensions/common/SelectorExtension';
import { ScrollerExtension } from '../extensions/common/ScrollerExtension';
import { ClipboardExtension } from '../extensions/common/ClipboardExtension';
import { HistoryExtension } from '../extensions/history/HistoryExtension';
import { ComputeExtension } from '../extensions/compute/ComputeExtension';
import { BaseStyle, Style } from '../model/styled/Style';
import { Base26 } from '../misc/Base26';
import { DefaultGridCell } from '../model/default/DefaultGridCell';
import { DefaultGridModel } from '../model/default/DefaultGridModel';
import { GridRange } from '../model/GridRange';


class TestExtension implements GridExtension
{
    public init(grid:GridElement, kernel:GridKernel):void
    {
    }
}


let history = new DefaultHistoryManager();

let grid = GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new ClipboardExtension())
    .extend(new HistoryExtension(history))
    .extend(new ComputeExtension())
    .extend(new ClickZoneExtension())
    .mergeInterface()
;

grid.on('input', (e:GridEditEvent) =>
{
    e.changes.forEach(x =>
    {
        let ln = Base26.num(x.cell.colRef).str + (x.cell.rowRef + 1);

        console.log('change:', ln, 'from', x.cell.value, 'to', x.value, '- cascaded: ', x.cascaded);
        x.cell.value = x.value;
    });

    grid.redraw(true);
});

grid.on('click', (e:any) =>
{
    console.log(Base26.num(e.cell.colRef).str + (e.cell.rowRef + 1));
});

grid.on('zoneenter', e => console.log(e.type, e.zone.type));
grid.on('zoneexit', e => console.log(e.type, e.zone.type));
grid.on('zoneclick', e => console.log(e.type, e.zone.type));

grid.model = make_model(26 * 5, 250);
grid.model.cells[0]['formula'] = '=SUM(B1:B10)';
grid.model.cells[0]['readonly'] = true;
grid.model.cells[0]['zones'] = [
    {
        mode: 'rel',
        left: 0,
        top: 0,
        width: 50,
        height: 100,
        type: 'test1',
    },
    {
        mode: 'rel',
        left: 50,
        top: 0,
        width: 50,
        height: 100,
        type: 'test2',
    }
];

grid.invalidate();
history.clear();
history.push({
    apply: () => alert('Forward!'),
    rollback: () => alert('Backward!'),
});

window['GridRange'] = GridRange;
window['grid'] = grid;

function make_model(cols:number, rows:number)
{
    let cells = [];
    
    for (let c = 0; c < cols; c++)
    {
        for (let r = 0; r < rows; r++)
        {
            cells.push(new DefaultGridCell({
                colRef: c,
                rowRef: r,
                value: '123',
            }));
        }   
    }
    
    return new DefaultGridModel(cells, [], [])
}