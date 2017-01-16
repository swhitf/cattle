import { ExampleGridBuilder } from './ExampleGridBuilder';
import { GridElement } from '../ui/GridElement';
import { SelectorExtension } from '../extensions/SelectorExtension';
import { ScrollerExtension } from '../extensions/ScrollerExtension';
import { EditingExtension, GridEditEvent } from '../extensions/EditingExtension';
import { ClipboardExtension } from '../extensions/ClipboardExtension';
import { HistoryExtension } from '../extensions/HistoryExtension';
import { PanExtension } from '../extensions/PanExtension';
import { ComputeExtension } from '../extensions/ComputeExtension';


//let builder:any = new FlexGridBuilder(1, 1);
//builder = new FlexGridBuilder(52 * 5, 250);
let builder = new ExampleGridBuilder();

let model = builder.build();

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

grid.model = model;
grid.on('input', (e:GridEditEvent) =>
{
    e.changes.forEach(x =>
    {
        x.cell.value = x.value;
    });

    grid.redraw();
});

window['grid'] = grid;


//window.addEventListener('keydown', e =>
//{
//    if (!e.ctrlKey)
//        return;
//
//    if (e.key === 'a')
//    {
//        let v = grid.scrollLeft - 100;
//        //tween.enable(grid, { scrollLeft: v }, .5, () => grid.scrollLeft = v);
//        grid.scrollLeft = v;
//    }
//    if (e.key === 'd')
//    {
//        let v = grid.scrollLeft + 100;
//        //tween.enable(grid, { scrollLeft: v }, .5, () => grid.scrollLeft = v);
//        grid.scrollLeft = v;
//    }
//    if (e.key === 'w')
//    {
//        let v = grid.scrollTop - 100;
//        //tween.enable(grid, { scrollTop: v }, .5, () => grid.scrollTop = v);
//        grid.scrollTop = v;
//    }
//    if (e.key === 's')
//    {
//        let v = grid.scrollTop + 100;
//        //tween.enable(grid, { scrollTop: v }, .5, () => grid.scrollTop = v);
//        grid.scrollTop = v;
//    }
//})