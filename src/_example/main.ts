import { GridBuilder } from './../model/GridBuilder';
import { TimelineGridBuilder } from './TimelineGridBuilder';
import { DefaultGrid } from '../model/default/DefaultGrid';
import { DefaultColumn } from '../model/default/DefaultColumn';
import { DefaultRow } from '../model/default/DefaultRow';
import { FlexCell } from '../model/flexi/FlexCell';
import { GridElement, GridMouseEvent } from '../ui/GridElement';
import { FlexGridBuilder } from '../model/flexi/FlexGridBuilder';
import { SelectorExtension } from '../extensions/SelectorExtension';
import { ScrollerExtension } from '../extensions/ScrollerExtension';
import { TestExtension } from '../extensions/TestExtension';
import { EditingExtension, GridInputEvent } from '../extensions/EditingExtension';
import { CopyPasteModule } from '../extensions/CopyPasteModule';

let builder: GridBuilder = new FlexGridBuilder(1, 1);
builder = new FlexGridBuilder(52 * 5, 250);
builder = new TimelineGridBuilder();

let model = builder.build();

let grid = GridElement
    .create(document.getElementById('x'))
    //.extend(new ScrollerExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new CopyPasteModule())
;

grid.model = model;
grid.on('input', (e:GridInputEvent) =>
{
    e.changes.forEach(x =>
    {
        x.cell.value = x.value;
    });

    grid.redraw();
});


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