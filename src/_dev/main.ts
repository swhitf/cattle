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


let model = GridModel.dim(26, 50);
model.cells.forEach(x => x.value = x.ref);

let grid = GridElement
   .create(document.getElementById('x'), model)
   .extend(new NetExtension())
//    .extend(new SelectorExtension())
//    .extend(new EditingExtension())
//    .extend(new ClipboardExtension())
//    .extend(new HistoryExtension(history))
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
   .mergeInterface()
;

debug_events(grid.surface);
debug_events(grid.surface.cameras);

window['grid'] = grid;
window['surface'] = grid.surface;
window['pt'] = Point.create;

grid.model.cells[0].style = GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';

let theme = new Theme('Test');

grid.surface.theme = theme;

let nets = grid.get('nets') as NetManager;
nets.create('test', 'default', 'B2', 'E4');

let test = [
    'LEFT.DOWN',
    'LEFT.DOWN+CTRL',
    'LEFT.DOWN+SHIFT', 
    'RIGHT.UP',
]

let mg = MouseGesture.for(grid.surface);
test.forEach(x => mg.on(x, () => console.info(x)));

// .on('DOWN:SHIFT+PRIMARY', (e:GridMouseEvent) => this.selectLine(new Point(e.gridX, e.gridY)))
// .on('DOWN:PRIMARY', (e:GridMouseEvent) => this.beginSelectGesture(e.gridX, e.gridY))
// .on('DRAG:PRIMARY', (e:GridMouseDragEvent) => this.updateSelectGesture(e.gridX, e.gridY))
// .on('UP:PRIMARY', (e:GridMouseDragEvent) => this.endSelectGesture(/*e.gridX, e.gridY*/))

//
// LEFT+CTRL
// LEFT.DOWN+CTRL
//
//

grid.freezeMargin = new Point(2, 0);