"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//@no-export
require("es5-shim");
require("es6-shim");
require("reflect-metadata");
var GridElement_1 = require("../core/GridElement");
var Point_1 = require("../geom/Point");
var GridCellStyle_1 = require("../model/GridCellStyle");
var GridModel_1 = require("../model/GridModel");
var GridRef_1 = require("../model/GridRef");
var GoogleSheetsTheme_1 = require("../themes/GoogleSheetsTheme");
var MicrosoftExcelTheme_1 = require("../themes/MicrosoftExcelTheme");
var vq = require("../vom/VisualQuery");
var click = function (x, h) {
    document.getElementById(x).addEventListener('click', h);
    return function () { return document.getElementById(x).removeEventListener('click', h); };
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
var state = {};
state.model = GridModel_1.GridModel.dim(26 * 5, 50 * 10);
state.model.cells.forEach(function (x) { return x.value = x.ref; });
state.grid = GridElement_1.GridElement
    .createDefault(document.getElementById('x'), state.model)
    .mergeInterface();
//debug_events(grid);
//debug_events(grid.surface);
//debug_events(grid.surface.cameras);
//grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(KeyExpression.create(e)));
window['grid'] = state.grid;
window['surface'] = state.grid.surface;
window['pt'] = Point_1.Point.create;
window['vq'] = function (s) { return vq.select(state.grid.surface.root, s); };
console.dir(GridRef_1.GridRef.unmake('BF250'));
state.grid.model.cells[0].style = GridCellStyle_1.GridCellStyle.get('test');
state.grid.model.cells[0].value = 'Test';
var lsnrs = [
    click('useExcel', function () { return state.grid.useTheme(MicrosoftExcelTheme_1.MicrosoftExcelTheme); }),
    click('useGoogle', function () { return state.grid.useTheme(GoogleSheetsTheme_1.GoogleSheetsTheme); }),
    click('destroy', function () {
        lsnrs.forEach(function (x) { return x(); });
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
//# sourceMappingURL=main.js.map