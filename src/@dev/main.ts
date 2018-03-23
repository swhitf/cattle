//@no-export
import 'es5-shim';
import 'es6-shim';
import 'reflect-metadata';

import { GridElement } from '../core/GridElement';
import { Point } from '../geom/Point';
import { GridCellStyle } from '../model/GridCellStyle';
import { GridModel } from '../model/GridModel';
import { GridRef } from '../model/GridRef';
import { GoogleSheetsTheme } from '../themes/GoogleSheetsTheme';
import { MicrosoftExcelTheme } from '../themes/MicrosoftExcelTheme';
import * as vq from '../vom/VisualQuery';




const click = (x, h) => {
    document.getElementById(x).addEventListener('click', h);
    return () => document.getElementById(x).removeEventListener('click', h)
};


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

const state = {} as any;

state.model = GridModel.dim(26 * 5, 50 * 10);
state.model.cells.forEach(x => x.value = x.ref);

state.grid = GridElement
    .createDefault(document.getElementById('x'), state.model)
    .mergeInterface()
;

//debug_events(grid);
//debug_events(grid.surface);
//debug_events(grid.surface.cameras);

//grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(KeyExpression.create(e)));

window['grid'] = state.grid;
window['surface'] = state.grid.surface;
window['pt'] = Point.create;
window['vq'] = s => vq.select(state.grid.surface.root, s);

console.dir(GridRef.unmake('BF250'));

state.grid.model.cells[0].style = GridCellStyle.get('test');
state.grid.model.cells[0].value = 'Test';

const lsnrs = [
    click('useExcel', () => state.grid.useTheme(MicrosoftExcelTheme)),
    click('useGoogle', () => state.grid.useTheme(GoogleSheetsTheme)),
    click('destroy', () => {
        lsnrs.forEach(x => x());
        lsnrs.splice(0, lsnrs.length);
        state.grid.destroy();
        state.grid = null;
        state.model = null;
        window['grid'] = null;
        window['surface'] = null;
        window['vq'] = null;
        window['pt'] = null;
    }),
];