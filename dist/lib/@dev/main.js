"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("es5-shim");
require("es6-shim");
require("reflect-metadata");
var EventEmitter_1 = require("../base/EventEmitter");
var GridElement_1 = require("../core/GridElement");
var EditingExtension_1 = require("../extensions/editing/EditingExtension");
var NetExtension_1 = require("../extensions/nets/NetExtension");
var SelectorExtension_1 = require("../extensions/selector/SelectorExtension");
var Point_1 = require("../geom/Point");
var GridCellStyle_1 = require("../model/GridCellStyle");
var GridModel_1 = require("../model/GridModel");
var Border_1 = require("../vom/styling/Border");
var Theme_1 = require("../vom/styling/Theme");
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
var model = GridModel_1.GridModel.dim(26, 50);
model.cells.forEach(function (x) { return x.value = x.ref; });
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'), model)
    .extend(new NetExtension_1.NetExtension())
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .mergeInterface();
EventEmitter_1.debug_events(grid);
//debug_events(grid.surface);
// debug_events(grid.surface.cameras);
//grid.surface.on('keydown', (e:VisualKeyboardEvent) => console.log(KeyExpression.create(e)));
window['grid'] = grid;
window['surface'] = grid.surface;
window['pt'] = Point_1.Point.create;
grid.model.cells[0].style = GridCellStyle_1.GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';
var theme = new Theme_1.Theme('Test');
theme.extend('net.input', {
    border: new Border_1.Border(2, '#4285f4'),
    zIndex: 2000,
});
theme.extend('net.selection', {
    background: 'rgba(160, 195, 255, 0.2)',
    zIndex: 1000,
});
grid.surface.theme = theme;
var nets = grid.get('nets');
// nets.create('test', 'default', 'B2', 'E4');
grid.freezeMargin = new Point_1.Point(2, 2);
//# sourceMappingURL=main.js.map