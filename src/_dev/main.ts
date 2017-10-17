import { KeyTracker } from '../vom/input/KeyTracker';
import { KeyExpression } from '../vom/input/KeyExpression';
import { VisualKeyboardEvent } from '../vom/events/VisualKeyboardEvent';
import { SelectorExtension } from '../extensions/selector/SelectorExtension';
import { GridModel } from '../model/GridModel';
import { MouseExpression } from '../vom/input/MouseExpression';
import { MouseGesture } from '../vom/input/MouseGesture';
import { NetManager } from '../extensions/nets/NetManager';
import { NetExtension } from '../extensions/nets/NetExtension';
import { NetHandle } from '../extensions/nets/NetHandle';
import { Border } from '../vom/styling/Border';
import { DefaultNetManager } from '../extensions/nets/DefaultNetManager';
import { Base26 } from '../misc/Base26';
import { select } from '../vom/VisualQuery';
import { debug_events } from '../base/EventEmitter';
import { Theme } from '../vom/styling/Theme';
import { GridCellStyle } from '../model/GridCellStyle';
import { GridElement } from '../core/GridElement';
import { Point, PointInput } from '../geom/Point';
import { Keys } from '../vom/input/Keys';


// const seq = {
//     length: 2,    
//     item: (index:number) => {
//         switch (index) {
//             case 0: return Keys.CTRL;
//             case 1: return Keys.SHIFT;
//             default: return undefined;
//         }
//     },
//     contains: (key:number) => key == Keys.CTRL || key == Keys.SHIFT,
//     toArray: () => [Keys.CTRL, Keys.SHIFT],
// }

// const expr = KeyExpression.parse('CTRL+SHIFT+RIGHT');
// const evt = new VisualKeyboardEvent('keydown', null, Keys.RIGHT_ARROW, seq);

// console.log(expr.matches(evt));

let model = GridModel.dim(26, 50);
model.cells.forEach(x => x.value = x.ref);

let grid = GridElement
   .create(document.getElementById('x'), model)
   .extend(new NetExtension())
   .extend(new SelectorExtension())
//    .extend(new EditingExtension())
//    .extend(new ClipboardExtension())
//    .extend(new HistoryExtension(history))
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
   .mergeInterface()
;

debug_events(grid);
//debug_events(grid.surface);
// debug_events(grid.surface.cameras);

grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(`${e.key} -> ${e.modifiers.toArray().join('+')}`));

window['grid'] = grid;
window['surface'] = grid.surface;
window['pt'] = Point.create;

grid.model.cells[0].style = GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';

let theme = new Theme('Test');
theme.extend('net.input', {
    background: 'rgba(160, 195, 255, 0.2)',
    border: new Border(2, '#4285f4'),
    zIndex: 2000,
});
theme.extend('net.selection', {
    background: 'rgba(160, 195, 255, 0.2)',
    zIndex: 1000,
});

grid.surface.theme = theme;

let nets = grid.get('nets') as NetManager;
nets.create('test', 'default', 'B2', 'E4');

grid.freezeMargin = new Point(2, 2);

