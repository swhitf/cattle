import { Padding } from '../geom/Padding';
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
    .create(document.getElementById('x'), make_model(0, 0))
    .extend(new ScrollerExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new ClipboardExtension())
    .extend(new HistoryExtension(history))
    .extend(new ComputeExtension())
    .extend(new ClickZoneExtension())
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
    if (e.cell) {
        console.log(Base26.num(e.cell.colRef).str + (e.cell.rowRef + 1));
    }
});

grid.on('zoneenter', e => console.log(e.type, e.zone.type));
grid.on('zoneexit', e => console.log(e.type, e.zone.type));
grid.on('zoneclick', e => console.log(e.type, e.zone.type));

//grid.model = make_model(26 * 5, 250);

grid.model = make_model(5, 5);
grid.model.cells.push(new DefaultGridCell({
    colRef: 0,
    rowRef: 5,
    value: 'Hello...',
    colSpan: 5,
}));
(grid.model as DefaultGridModel).refresh();

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
                value: Base26.num(c).str  + (r + 1),
            }));
        }   
    }
    
    return new DefaultGridModel(cells, [], [])
}