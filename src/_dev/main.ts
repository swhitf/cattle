import { GridElement } from '../ui/GridElement';
import { SelectorExtension } from '../extensions/SelectorExtension';
import { ScrollerExtension } from '../extensions/ScrollerExtension';
import { EditingExtension, GridEditEvent } from '../extensions/EditingExtension';
import { ClipboardExtension } from '../extensions/ClipboardExtension';
import { HistoryExtension } from '../extensions/HistoryExtension';
import { PanExtension } from '../extensions/PanExtension';
import { ComputeExtension } from '../extensions/ComputeExtension';
import { BaseStyle, Style } from '../model/styled/Style';


let grid = GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new ClipboardExtension())
    .extend(new HistoryExtension())
    .extend(new PanExtension())
    .extend(new ComputeExtension())
    .mergeInterface()
;

grid.on('input', (e:GridEditEvent) =>
{
    e.changes.forEach(x =>
    {
        x.cell.value = x.value;
    });

    grid.redraw();
});

let model = grid.model;
model.locateCell(0, 0)['formula'] = '=B1+1';
model.locateCell(1, 0)['formula'] = '=E5';
model.locateCell(2, 0)['formula'] = '=A1+B1';
model.locateCell(4, 4)['value'] = '99';
grid.invalidate();

window['grid'] = grid;