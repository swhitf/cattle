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
var click = function (x, h) { return document.getElementById(x).addEventListener('click', h); };
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
var model = GridModel_1.GridModel.dim(26 * 5, 50 * 10);
model.cells.forEach(function (x) { return x.value = x.ref; });
var grid = GridElement_1.GridElement
    .createDefault(document.getElementById('x'), model)
    .mergeInterface();
//debug_events(grid);
//debug_events(grid.surface);
//debug_events(grid.surface.cameras);
//grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(KeyExpression.create(e)));
window['grid'] = grid;
window['surface'] = grid.surface;
window['pt'] = Point_1.Point.create;
window['vq'] = function (s) { return vq.select(grid.surface.root, s); };
console.dir(GridRef_1.GridRef.unmake('BF250'));
grid.model.cells[0].style = GridCellStyle_1.GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';
var nets = grid.get('nets');
// nets.create('test', 'default', 'B2', 'E4');
grid.freezeMargin = new Point_1.Point(0, 0);
click('useExcel', function () { return grid.useTheme(MicrosoftExcelTheme_1.MicrosoftExcelTheme); });
click('useGoogle', function () { return grid.useTheme(GoogleSheetsTheme_1.GoogleSheetsTheme); });
//# sourceMappingURL=main.js.map