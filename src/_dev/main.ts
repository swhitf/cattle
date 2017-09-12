import { NetHandle } from '../extensions/nets/NetHandle';
import { Border } from '../vom/styling/Border';
import { DefaultNetManager } from '../extensions/nets/DefaultNetManager';
import { Base26 } from '../misc/Base26';
import { select } from '../vom/VisualQuery';
import { debug_events } from '../eventing/EventEmitter';
import { Theme } from '../vom/styling/Theme';
import { GridCellStyle } from '../model/GridCellStyle';
import { GridElement } from '../core/GridElement';


let grid = window['grid'] = GridElement.create(document.getElementById('x'));

//let grid = GridElement
//    .create(document.getElementById('x'), make_model(0, 0))
//    .extend(new ScrollerExtension())
//    .extend(new SelectorExtension())
//    .extend(new EditingExtension())
//    .extend(new ClipboardExtension())
//    .extend(new HistoryExtension(history))
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .mergeInterface()
;

grid.model.cells[0].style = GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';

let theme = new Theme('Test');
theme.extend('cell.test', {
    color: 'blue'
});

theme.extend('net.test', {
    border: new Border(2, 'green'),
});


grid.surface.theme = theme;

let i = 1;

grid.surface.on('keydown', e => {
    if (e.key == 65) {
        grid.surface.scrollLeft -= 10;
    }
    if (e.key == 68) {
        grid.surface.scrollLeft += 10;        
    }   
    if (e.key == 87) {
        grid.surface.scrollTop -= 10;
    }
    if (e.key == 83) {
        grid.surface.scrollTop += 10;        
    }
    if (e.key == 32) {
        grid.model.cells[i].value = Math.random() + '!';
        i++;
    }
});

let from = '';
let to = '';
let nh = null as NetHandle;

let nm = new DefaultNetManager(grid);

grid.surface.on('mousedown', e => 
{
    if (!e.target || !e.target.ref)
        return;

    from = e.target.ref;

    if (nh)
    {
        nh.destroy();
        nh = null;
    }

    if (!nh)
    {
        nh = window['nh'] = nm.create('test', 'test', from, to);
    }
});

grid.surface.on('mousemove', e => 
{
    if (!nh || !e.target || !e.target.ref)
        return;

    to = e.target.ref;
    nh.move(from, to);
});

grid.surface.on('mouseup', e => 
{
    if (!e.target || !e.target.ref)
        return;

    to = e.target.ref;
    nh.move(from, to);
});

//debug_events(grid.surface);

// grid.model = make_model(5, 5);
// grid.model.cells.push(new DefaultGridCell({
//     colRef: 0,
//     rowRef: 5,
//     value: 'Hello...',
//     colSpan: 5,
// }));
// (grid.model as DefaultGridModel).refresh();

// grid.invalidate();

// window['GridRange'] = GridRange;
// window['grid'] = grid;

// function make_model(cols:number, rows:number)
// {
//     let cells = [];
    
//     for (let c = 0; c < cols; c++)
//     {
//         for (let r = 0; r < rows; r++)
//         {
//             cells.push(new DefaultGridCell({
//                 colRef: c,
//                 rowRef: r,
//                 value: Base26.num(c).str  + (r + 1),
//             }));
//         }   
//     }
    
//     return new DefaultGridModel(cells, [], [])
// }