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
    // .extend(new PanExtension())
    // .extend(new ComputeExtension())
    .mergeInterface()
;

grid.model.cells[0].value = 'Hi Jamie';
grid.redraw();

grid.on('input', (e:GridEditEvent) =>
{
    e.changes.forEach(x =>
    {
        x.cell.value = x.value;
    });

    grid.redraw();
});

window['grid'] = grid;