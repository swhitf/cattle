import { GridElement } from '../ui/GridElement';
import { SelectorExtension } from '../extensions/common/SelectorExtension';
import { ScrollerExtension } from '../extensions/common/ScrollerExtension';
import { EditingExtension, GridEditEvent } from '../extensions/common/EditingExtension';
import { ClipboardExtension } from '../extensions/common/ClipboardExtension';
import { HistoryExtension } from '../extensions/common/HistoryExtension';
import { ComputeExtension } from '../extensions/compute/ComputeExtension';
import { BaseStyle, Style } from '../model/styled/Style';
import { Base26 } from '../misc/Base26';



let grid = GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new ClipboardExtension())
    .extend(new HistoryExtension())
    //.extend(new PanExtension())
    .extend(new ComputeExtension())
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

let model = grid.model;

model.locateCell(0, 0)['readonly'] = true;
model.locateCell(0, 0)['formula'] = '=B1+1';
model.locateCell(1, 0)['formula'] = '=C1+1';
model.locateCell(2, 0)['formula'] = '=D1+1';
model.locateCell(3, 0)['formula'] = '=10*A2';

model.locateCell(0, 1)['value'] = '10';

grid.invalidate();
grid.exec('clearHistory');
grid.exec('push', {
    apply: () => alert('Forward!'),
    rollback: () => alert('Backward!'),
});

window['grid'] = grid;