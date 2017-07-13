"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _1 = require("../");
var ClickZoneExtension_1 = require("../extensions/extra/ClickZoneExtension");
var EditingExtension_1 = require("../extensions/common/EditingExtension");
var GridElement_1 = require("../ui/GridElement");
var SelectorExtension_1 = require("../extensions/common/SelectorExtension");
var ScrollerExtension_1 = require("../extensions/common/ScrollerExtension");
var ClipboardExtension_1 = require("../extensions/common/ClipboardExtension");
var HistoryExtension_1 = require("../extensions/history/HistoryExtension");
var ComputeExtension_1 = require("../extensions/compute/ComputeExtension");
var Base26_1 = require("../misc/Base26");
var DefaultGridCell_1 = require("../model/default/DefaultGridCell");
var DefaultGridModel_1 = require("../model/default/DefaultGridModel");
var GridRange_1 = require("../model/GridRange");
var TestExtension = (function () {
    function TestExtension() {
    }
    TestExtension.prototype.init = function (grid, kernel) {
    };
    return TestExtension;
}());
var history = new _1.DefaultHistoryManager();
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'), make_model(0, 0))
    .extend(new ScrollerExtension_1.ScrollerExtension())
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .extend(new ClipboardExtension_1.ClipboardExtension())
    .extend(new HistoryExtension_1.HistoryExtension(history))
    .extend(new ComputeExtension_1.ComputeExtension())
    .extend(new ClickZoneExtension_1.ClickZoneExtension())
    .extend(new ComputeExtension_1.ComputeExtension())
    .extend(new ClickZoneExtension_1.ClickZoneExtension())
    .mergeInterface();
grid.on('input', function (e) {
    e.changes.forEach(function (x) {
        var ln = Base26_1.Base26.num(x.cell.colRef).str + (x.cell.rowRef + 1);
        console.log('change:', ln, 'from', x.cell.value, 'to', x.value, '- cascaded: ', x.cascaded);
        x.cell.value = x.value;
    });
    grid.redraw(true);
});
grid.on('click', function (e) {
    if (e.cell) {
        console.log(Base26_1.Base26.num(e.cell.colRef).str + (e.cell.rowRef + 1));
    }
});
grid.on('zoneenter', function (e) { return console.log(e.type, e.zone.type); });
grid.on('zoneexit', function (e) { return console.log(e.type, e.zone.type); });
grid.on('zoneclick', function (e) { return console.log(e.type, e.zone.type); });
//grid.model = make_model(26 * 5, 250);
grid.model = make_model(5, 5);
grid.model.cells.push(new DefaultGridCell_1.DefaultGridCell({
    colRef: 0,
    rowRef: 5,
    value: 'Hello...',
    colSpan: 5,
}));
grid.model.refresh();
grid.invalidate();
history.clear();
history.push({
    apply: function () { return alert('Forward!'); },
    rollback: function () { return alert('Backward!'); },
});
window['GridRange'] = GridRange_1.GridRange;
window['grid'] = grid;
function make_model(cols, rows) {
    var cells = [];
    for (var c = 0; c < cols; c++) {
        for (var r = 0; r < rows; r++) {
            cells.push(new DefaultGridCell_1.DefaultGridCell({
                colRef: c,
                rowRef: r,
                value: Base26_1.Base26.num(c).str + (r + 1),
            }));
        }
    }
    return new DefaultGridModel_1.DefaultGridModel(cells, [], []);
}
//# sourceMappingURL=main-old.js.map