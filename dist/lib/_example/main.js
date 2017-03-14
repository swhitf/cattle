"use strict";
var ExampleGridBuilder_1 = require("./ExampleGridBuilder");
var GridElement_1 = require("../ui/GridElement");
var SelectorExtension_1 = require("../extensions/SelectorExtension");
var ScrollerExtension_1 = require("../extensions/ScrollerExtension");
var EditingExtension_1 = require("../extensions/EditingExtension");
var ClipboardExtension_1 = require("../extensions/ClipboardExtension");
var HistoryExtension_1 = require("../extensions/HistoryExtension");
var PanExtension_1 = require("../extensions/PanExtension");
var ComputeExtension_1 = require("../extensions/ComputeExtension");
var Style_1 = require("../model/styled/Style");
//let builder:any = new FlexGridBuilder(1, 1);
//builder = new FlexGridBuilder(52 * 5, 250);
var builder = new ExampleGridBuilder_1.ExampleGridBuilder(100, 52, new Style_1.Style(Style_1.BaseStyle, {
    textAlignment: 'right'
}));
var model = builder.build();
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'))
    .extend(new ScrollerExtension_1.ScrollerExtension())
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .extend(new ClipboardExtension_1.ClipboardExtension())
    .extend(new HistoryExtension_1.HistoryExtension())
    .extend(new PanExtension_1.PanExtension())
    .extend(new ComputeExtension_1.ComputeExtension())
    .mergeInterface();
grid.model = model;
grid.on('input', function (e) {
    e.changes.forEach(function (x) {
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
//# sourceMappingURL=main.js.map