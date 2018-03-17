import 'es5-shim';
import 'es6-shim';
import 'reflect-metadata';

import { GridElement } from '../core/GridElement';
import { EditingExtension } from '../extensions/editing/EditingExtension';
import { NetExtension } from '../extensions/nets/NetExtension';
import { NetManager } from '../extensions/nets/NetManager';
import { ScrollerExtension } from '../extensions/scrolling/ScrollingExtension';
import { SelectorExtension } from '../extensions/selector/SelectorExtension';
import { Point } from '../geom/Point';
import { GridCellStyle } from '../model/GridCellStyle';
import { GridModel } from '../model/GridModel';
import { GoogleSheetsTheme } from '../themes/GoogleSheetsTheme';
import { MicrosoftExcelTheme } from '../themes/MicrosoftExcelTheme';
import * as vq from '../vom/VisualQuery';

const click = (x, h) => document.getElementById(x).addEventListener('click', h);


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

let model = GridModel.dim(26 * 5, 50 * 10);
model.cells.forEach(x => x.value = x.ref);

let grid = GridElement
    .create(document.getElementById('x'), model)
    .extend(new NetExtension())
    .extend(new SelectorExtension())
    .extend(new EditingExtension())
    .extend(new ScrollerExtension())
//    .extend(new ClipboardExtension())
//    .extend(new HistoryExtension(history))
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
    .useTheme(GoogleSheetsTheme)
    .mergeInterface()
;

//debug_events(grid);
//debug_events(grid.surface);
//debug_events(grid.surface.cameras);

//grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(KeyExpression.create(e)));

window['grid'] = grid;
window['surface'] = grid.surface;
window['pt'] = Point.create;
window['vq'] = s => vq.select(grid.surface.root, s);

grid.model.cells[0].style = GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';

let nets = grid.get('nets') as NetManager;
// nets.create('test', 'default', 'B2', 'E4');

grid.freezeMargin = new Point(0, 0);

click('useExcel', () => grid.useTheme(MicrosoftExcelTheme));
click('useGoogle', () => grid.useTheme(GoogleSheetsTheme));