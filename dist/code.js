(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var DefaultGrid_1 = require("./../model/default/DefaultGrid");
var FlexCell_1 = require("./../model/flexi/FlexCell");
var TimelineGridBuilder = (function () {
    function TimelineGridBuilder(resources, weeks) {
        if (resources === void 0) { resources = 100; }
        if (weeks === void 0) { weeks = 108; }
        this.resources = resources;
        this.weeks = weeks;
    }
    TimelineGridBuilder.prototype.build = function () {
        var model = new DefaultGrid_1.DefaultGrid();
        this.createColumnRow(model.cells);
        for (var i = 0; i < this.resources; i++) {
            this.createResourceRow(model.cells, i);
        }
        return model;
    };
    TimelineGridBuilder.prototype.createColumnRow = function (cells) {
        cells.push(new FlexCell_1.FlexCell(0, 0, null, '+'));
        var date = monday();
        for (var i = 0; i < this.weeks; i++) {
            var cell = new FlexCell_1.FlexCell(i + 1, 0);
            cell.value = date.toLocaleDateString();
            cells.push(cell);
            date.setDate(date.getDate() + 7);
        }
    };
    TimelineGridBuilder.prototype.createResourceRow = function (cells, resource) {
        cells.push(new FlexCell_1.FlexCell(0, resource + 1, null, "Resource #" + resource));
        for (var i = 0; i < this.weeks; i++) {
            var cell = new FlexCell_1.FlexCell(i + 1, resource + 1);
            cell.value = '';
            cells.push(cell);
        }
    };
    return TimelineGridBuilder;
}());
exports.TimelineGridBuilder = TimelineGridBuilder;
function monday() {
    var d = new Date(), day = d.getDay(), diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

},{"./../model/default/DefaultGrid":24,"./../model/flexi/FlexCell":26}],2:[function(require,module,exports){
"use strict";
var TimelineGridBuilder_1 = require("./TimelineGridBuilder");
var GridElement_1 = require("../ui/GridElement");
var FlexGridBuilder_1 = require("../model/flexi/FlexGridBuilder");
var SelectorExtension_1 = require("../extensions/SelectorExtension");
var EditingExtension_1 = require("../extensions/EditingExtension");
var CopyPasteModule_1 = require("../extensions/CopyPasteModule");
var builder = new FlexGridBuilder_1.FlexGridBuilder(1, 1);
builder = new FlexGridBuilder_1.FlexGridBuilder(52 * 5, 250);
builder = new TimelineGridBuilder_1.TimelineGridBuilder();
var model = builder.build();
var grid = GridElement_1.GridElement
    .create(document.getElementById('x'))
    .extend(new SelectorExtension_1.SelectorExtension())
    .extend(new EditingExtension_1.EditingExtension())
    .extend(new CopyPasteModule_1.CopyPasteModule());
grid.model = model;
grid.on('input', function (e) {
    e.changes.forEach(function (x) {
        x.cell.value = x.value;
    });
    grid.invalidate();
});
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

},{"../extensions/CopyPasteModule":3,"../extensions/EditingExtension":4,"../extensions/SelectorExtension":5,"../model/flexi/FlexGridBuilder":27,"../ui/GridElement":29,"./TimelineGridBuilder":1}],3:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var clipboard_1 = require("../vendor/clipboard");
var Widget_1 = require("../ui/Widget");
var Extensibility_1 = require("../ui/Extensibility");
var Rect_1 = require("../geom/Rect");
var Range_1 = require("../model/Range");
var Tether = require("tether");
var _ = require("../misc/Util");
var Dom = require("../misc/Dom");
var Papa = require("papaparse");
var Query_1 = require("../model/Query");
var Point_1 = require("../geom/Point");
//I know... :(
var NewLine = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
var CopyPasteModule = (function () {
    function CopyPasteModule() {
        this.copyList = [];
        this.copyRange = Range_1.Range.empty();
    }
    CopyPasteModule.prototype.init = function (grid) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_C', function (e) { return _this.copySelection(); });
        window.addEventListener('paste', this.onWindowPaste.bind(this));
        grid.on('scroll', function () { return _this.alignNet(); });
        grid.kernel.routines.hook('before:beginEdit', function () { return _this.resetCopy(); });
        grid.kernel.routines.hook('before:commit', function () { return _this.resetCopy(); });
    };
    Object.defineProperty(CopyPasteModule.prototype, "modelIndex", {
        get: function () {
            return this.grid.kernel.variables.get('modelIndex');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CopyPasteModule.prototype, "captureSelector", {
        get: function () {
            return this.grid.kernel.variables.get('captureSelector');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CopyPasteModule.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    CopyPasteModule.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, {
            pointerEvents: 'none',
            overflow: 'hidden',
            width: target.clientWidth + 'px',
            height: target.clientHeight + 'px',
        });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
        this.layer = layer;
        this.copyNet = CopyNet.create(layer);
    };
    CopyPasteModule.prototype.copySelection = function () {
        this.doCopy(this.selection);
        this.alignNet();
    };
    CopyPasteModule.prototype.resetCopy = function () {
        this.doCopy([]);
        this.alignNet();
    };
    CopyPasteModule.prototype.doCopy = function (cells, delimiter) {
        if (delimiter === void 0) { delimiter = '\t'; }
        this.copyList = cells;
        var range = this.copyRange = Range_1.Range.create(this.grid.model, cells);
        var text = '';
        if (!cells.length)
            return;
        var rr = range.ltr[0].rowRef;
        for (var i = 0; i < range.ltr.length; i++) {
            var c = range.ltr[i];
            if (rr !== c.rowRef) {
                text += NewLine;
                rr = c.rowRef;
            }
            text += c.value;
            if (i < (range.ltr.length - 1) && range.ltr[i + 1].rowRef === rr) {
                text += delimiter;
            }
        }
        clipboard_1.Clipboard.copy(text);
    };
    CopyPasteModule.prototype.doPaste = function (text) {
        var _a = this, grid = _a.grid, modelIndex = _a.modelIndex, selection = _a.selection;
        if (!selection.length)
            return;
        var focusedCell = modelIndex.findCell(selection[0]);
        var parsed = Papa.parse(text, {
            delimiter: text.indexOf('\t') >= 0 ? '\t' : undefined,
        });
        var data = parsed.data.filter(function (x) { return x.length > 1 || (x.length == 1 && !!x[0]); });
        if (!data.length)
            return;
        var width = _.max(data, function (x) { return x.length; }).length;
        var height = data.length;
        var startVector = new Point_1.Point(focusedCell.colRef, focusedCell.rowRef);
        var endVector = startVector.add(new Point_1.Point(width, height));
        var pasteRange = Query_1.Query.over(grid.model).vector(startVector, endVector);
        var changes = {};
        for (var _i = 0, _b = pasteRange.ltr; _i < _b.length; _i++) {
            var cell = _b[_i];
            var xy = new Point_1.Point(cell.colRef, cell.rowRef).subtract(startVector);
            var value = data[xy.y][xy.x] || '';
            changes[cell.ref] = value;
        }
        this.grid.kernel.commands.exec('commit', changes);
        this.grid.kernel.commands.exec('select', pasteRange.ltr.map(function (x) { return x.ref; }));
    };
    CopyPasteModule.prototype.alignNet = function () {
        var _a = this, grid = _a.grid, copyList = _a.copyList, copyNet = _a.copyNet;
        if (copyList.length) {
            //TODO: Improve the shit out of this:
            var netRect = Rect_1.Rect.fromMany(copyList.map(function (x) { return grid.getCellViewRect(x); }));
            copyNet.goto(netRect);
        }
        else {
            copyNet.hide();
        }
    };
    CopyPasteModule.prototype.onWindowPaste = function (e) {
        var ae = document.activeElement;
        while (!!ae) {
            if (!!ae.className && ae.className.indexOf('grid') >= 0)
                break;
            ae = ae.parentElement;
        }
        if (!ae)
            return;
        var text = e.clipboardData.getData('text/plain');
        if (text !== null && text !== undefined) {
            this.doPaste(text);
        }
    };
    return CopyPasteModule;
}());
__decorate([
    Extensibility_1.variable(),
    __metadata("design:type", CopyNet)
], CopyPasteModule.prototype, "copyNet", void 0);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CopyPasteModule.prototype, "copySelection", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CopyPasteModule.prototype, "resetCopy", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", void 0)
], CopyPasteModule.prototype, "doCopy", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CopyPasteModule.prototype, "doPaste", null);
exports.CopyPasteModule = CopyPasteModule;
var CopyNet = (function (_super) {
    __extends(CopyNet, _super);
    function CopyNet() {
        return _super.apply(this, arguments) || this;
    }
    CopyNet.create = function (container) {
        var root = document.createElement('div');
        root.className = 'grid-net grid-net-copy';
        container.appendChild(root);
        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });
        return new CopyNet(root);
    };
    return CopyNet;
}(Widget_1.AbsWidgetBase));
exports.CopyNet = CopyNet;

},{"../geom/Point":6,"../geom/Rect":7,"../input/KeyInput":10,"../misc/Dom":15,"../misc/Util":17,"../model/Query":20,"../model/Range":21,"../ui/Extensibility":28,"../ui/Widget":32,"../vendor/clipboard":36,"papaparse":38,"tether":50}],4:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var MouseInput_1 = require("../input/MouseInput");
var Point_1 = require("../geom/Point");
var _ = require("../misc/Util");
var Tether = require("tether");
var Dom = require("../misc/Dom");
var Widget_1 = require("../ui/Widget");
var Extensibility_1 = require("../ui/Extensibility");
var Vectors = {
    north: new Point_1.Point(0, -1),
    south: new Point_1.Point(0, 1),
    east: new Point_1.Point(1, 0),
    west: new Point_1.Point(-1, 0),
};
var EditingExtension = (function () {
    function EditingExtension() {
        this.isEditing = false;
        this.isEditingDetailed = false;
    }
    EditingExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(this.input.root)
            .on('!ESCAPE', function () { return _this.endEdit(false); })
            .on('!ENTER', function () { return _this.endEditToNeighbor(Vectors.east); })
            .on('!TAB', function () { return _this.endEditToNeighbor(Vectors.east); })
            .on('!SHIFT+TAB', function () { return _this.endEditToNeighbor(Vectors.west); })
            .on('UP_ARROW', function () { return _this.endEditToNeighbor(Vectors.north); })
            .on('DOWN_ARROW', function () { return _this.endEditToNeighbor(Vectors.south); })
            .on('RIGHT_ARROW', function () { if (!_this.isEditingDetailed) {
            _this.endEditToNeighbor(Vectors.east);
        } })
            .on('LEFT_ARROW', function () { if (!_this.isEditingDetailed) {
            _this.endEditToNeighbor(Vectors.west);
        } });
        MouseInput_1.MouseInput.for(this.input.root)
            .on('DOWN:PRIMARY', function () { return _this.isEditingDetailed = true; });
        KeyInput_1.KeyInput.for(this.grid.root)
            .on('!DELETE', function () { return _this.erase(); })
            .on('!BACKSPACE', function () { return _this.beginEdit(''); });
        MouseInput_1.MouseInput.for(this.grid.root)
            .on('DBLCLICK:PRIMARY', function () { return _this.beginEdit(); });
        grid.on('keypress', function (e) { return _this.beginEdit(String.fromCharCode(e.charCode)); });
        kernel.routines.hook('before:doSelect', function () { return _this.endEdit(true); });
    };
    Object.defineProperty(EditingExtension.prototype, "modelIndex", {
        get: function () {
            return this.grid.kernel.variables.get('modelIndex');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EditingExtension.prototype, "primarySelector", {
        get: function () {
            return this.grid.kernel.variables.get('primarySelector');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EditingExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    EditingExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        layer.style.pointerEvents = 'none';
        layer.style.width = target.clientWidth + 'px';
        layer.style.height = target.clientHeight + 'px';
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
        this.layer = layer;
        this.input = Input.create(layer);
    };
    EditingExtension.prototype.beginEdit = function (override) {
        if (override === void 0) { override = null; }
        if (this.isEditing)
            return false;
        var input = this.input;
        var cell = this.modelIndex.findCell(this.selection[0]);
        if (!!override) {
            input.val(override);
        }
        else {
            input.val(cell.value);
        }
        input.goto(this.primarySelector.viewRect);
        input.focus();
        this.isEditingDetailed = false;
        this.isEditing = true;
        return true;
    };
    EditingExtension.prototype.endEdit = function (commit) {
        if (commit === void 0) { commit = true; }
        if (!this.isEditing)
            return false;
        var _a = this, grid = _a.grid, input = _a.input, selection = _a.selection;
        var newValue = input.val();
        input.hide();
        input.val('');
        grid.focus();
        if (commit && !!selection.length) {
            this.commitUniform(selection.slice(0, 1), newValue);
        }
        this.isEditing = false;
        this.isEditingDetailed = false;
        return true;
    };
    EditingExtension.prototype.endEditToNeighbor = function (vector, commit) {
        if (commit === void 0) { commit = true; }
        if (this.endEdit(commit)) {
            this.grid.kernel.commands.exec('selectNeighbor', vector);
            return true;
        }
        return false;
    };
    EditingExtension.prototype.erase = function () {
        var selection = this.selection;
        if (this.isEditing)
            return;
        this.commitUniform(selection, '');
    };
    EditingExtension.prototype.commitUniform = function (cells, uniformValue) {
        var changes = _.zipPairs(cells.map(function (x) { return [x, uniformValue]; }));
        this.commit(changes);
    };
    EditingExtension.prototype.commit = function (changes) {
        var _a = this, grid = _a.grid, modelIndex = _a.modelIndex;
        var evt = {
            changes: _.unzipPairs(changes).map(function (x) { return ({
                cell: modelIndex.findCell(x[0]),
                value: x[1],
            }); })
        };
        grid.emit('input', evt);
    };
    return EditingExtension;
}());
__decorate([
    Extensibility_1.variable(),
    __metadata("design:type", Input)
], EditingExtension.prototype, "input", void 0);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Boolean)
], EditingExtension.prototype, "beginEdit", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Boolean]),
    __metadata("design:returntype", Boolean)
], EditingExtension.prototype, "endEdit", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "erase", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "commitUniform", null);
__decorate([
    Extensibility_1.command(),
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EditingExtension.prototype, "commit", null);
exports.EditingExtension = EditingExtension;
var Input = (function (_super) {
    __extends(Input, _super);
    function Input() {
        return _super.apply(this, arguments) || this;
    }
    Input.create = function (container) {
        var root = document.createElement('input');
        root.type = 'text';
        root.className = 'grid-input';
        container.appendChild(root);
        Dom.css(root, {
            pointerEvents: 'auto',
            display: 'none',
            position: 'absolute',
            left: '0px',
            top: '0px',
            padding: '0',
            margin: '0',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
        });
        return new Input(root);
    };
    Input.prototype.goto = function (viewRect, autoShow) {
        if (autoShow === void 0) { autoShow = true; }
        _super.prototype.goto.call(this, viewRect);
        Dom.css(this.root, {
            left: viewRect.left + 2 + "px",
            top: viewRect.top + 2 + "px",
            width: viewRect.width + "px",
            height: viewRect.height + "px",
        });
    };
    Input.prototype.focus = function () {
        var root = this.root;
        setTimeout(function () {
            root.focus();
            root.setSelectionRange(root.value.length, root.value.length);
        }, 0);
    };
    Input.prototype.val = function (value) {
        if (value !== undefined) {
            this.root.value = value;
        }
        return this.root.value;
    };
    return Input;
}(Widget_1.AbsWidgetBase));

},{"../geom/Point":6,"../input/KeyInput":10,"../input/MouseInput":14,"../misc/Dom":15,"../misc/Util":17,"../ui/Extensibility":28,"../ui/Widget":32,"tether":50}],5:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var KeyInput_1 = require("../input/KeyInput");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var MouseInput_1 = require("../input/MouseInput");
var MouseDragEventSupport_1 = require("../input/MouseDragEventSupport");
var Extensibility_1 = require("../ui/Extensibility");
var Widget_1 = require("../ui/Widget");
var Tether = require("tether");
var Dom = require("../misc/Dom");
var Vectors = {
    north: new Point_1.Point(0, -1),
    south: new Point_1.Point(0, 1),
    east: new Point_1.Point(1, 0),
    west: new Point_1.Point(-1, 0),
};
var SelectorExtension = (function () {
    function SelectorExtension() {
        this.selection = [];
    }
    SelectorExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.createElements(grid.root);
        KeyInput_1.KeyInput.for(grid)
            .on('!TAB', function () { return _this.selectNeighbor(Vectors.east); })
            .on('!SHIFT+TAB', function () { return _this.selectNeighbor(Vectors.west); })
            .on('RIGHT_ARROW', function () { return _this.selectNeighbor(Vectors.east); })
            .on('LEFT_ARROW', function () { return _this.selectNeighbor(Vectors.west); })
            .on('UP_ARROW', function () { return _this.selectNeighbor(Vectors.north); })
            .on('DOWN_ARROW', function () { return _this.selectNeighbor(Vectors.south); })
            .on('CTRL+RIGHT_ARROW', function () { return _this.selectEdge(Vectors.east); })
            .on('CTRL+LEFT_ARROW', function () { return _this.selectEdge(Vectors.west); })
            .on('CTRL+UP_ARROW', function () { return _this.selectEdge(Vectors.north); })
            .on('CTRL+DOWN_ARROW', function () { return _this.selectEdge(Vectors.south); })
            .on('CTRL+A', function () { return _this.selectAll(); });
        MouseDragEventSupport_1.MouseDragEventSupport.enable(grid.root);
        MouseInput_1.MouseInput.for(grid)
            .on('DOWN:PRIMARY+SHIFT', function (e) { return _this.selectLine(new Point_1.Point(e.gridX, e.gridY)); })
            .on('DOWN:PRIMARY', function (e) { return _this.beginSelectGesture(e.gridX, e.gridY); })
            .on('DRAG:PRIMARY', function (e) { return _this.updateSelectGesture(e.gridX, e.gridY); });
        grid.on('invalidate', function () { return _this.reselect(false); });
        grid.on('scroll', function () { return _this.alignSelectors(false); });
        kernel.variables.define('selection', { get: function () { return _this.selection; } });
        kernel.variables.define('primarySelector', { get: function () { return _this.primarySelector; } });
        kernel.variables.define('captureSelector', { get: function () { return _this.captureSelector; } });
    };
    Object.defineProperty(SelectorExtension.prototype, "index", {
        get: function () {
            return this.grid.kernel.variables.get('modelIndex');
        },
        enumerable: true,
        configurable: true
    });
    SelectorExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, {
            pointerEvents: 'none',
            overflow: 'hidden',
            width: target.clientWidth + 'px',
            height: target.clientHeight + 'px',
        });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        t.position();
        this.layer = layer;
        this.primarySelector = Selector.create(layer, true);
        this.captureSelector = Selector.create(layer, false);
    };
    SelectorExtension.prototype.select = function (cells, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        this.doSelect(cells, autoScroll);
        this.alignSelectors(true);
    };
    SelectorExtension.prototype.selectAll = function () {
        this.select(this.grid.model.cells.map(function (x) { return x.ref; }));
    };
    SelectorExtension.prototype.selectEdge = function (vector, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        vector = vector.normalize();
        var empty = function (cell) { return (cell.value === '' || cell.value === undefined || cell.value === null); };
        var ref = this.selection[0] || null;
        if (ref) {
            var startCell = this.index.findCell(ref);
            var currCell = this.index.findCellNeighbor(startCell.ref, vector);
            var resultCell = null;
            if (!currCell)
                return;
            while (true) {
                var a = currCell;
                var b = this.index.findCellNeighbor(a.ref, vector);
                if (!a || !b) {
                    resultCell = !!a ? a : null;
                    break;
                }
                if (empty(a) + empty(b) == 1) {
                    resultCell = empty(a) ? b : a;
                    break;
                }
                currCell = b;
            }
            if (resultCell) {
                this.select([resultCell.ref], autoScroll);
            }
        }
    };
    SelectorExtension.prototype.selectLine = function (gridPt, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        var ref = this.selection[0] || null;
        if (!ref)
            return;
        var startPt = grid.getCellGridRect(ref).topLeft();
        var lineRect = Rect_1.Rect.fromPoints(startPt, gridPt);
        var cellRefs = grid.getCellsInGridRect(lineRect).map(function (x) { return x.ref; });
        cellRefs.splice(cellRefs.indexOf(ref), 1);
        cellRefs.splice(0, 0, ref);
        this.select(cellRefs, autoScroll);
    };
    SelectorExtension.prototype.selectNeighbor = function (vector, autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        vector = vector.normalize();
        var ref = this.selection[0] || null;
        if (ref) {
            var cell = this.index.findCellNeighbor(ref, vector);
            if (cell) {
                this.select([cell.ref], autoScroll);
            }
        }
    };
    SelectorExtension.prototype.reselect = function (autoScroll) {
        if (autoScroll === void 0) { autoScroll = true; }
        var _a = this, index = _a.index, selection = _a.selection;
        var remaining = selection.filter(function (x) { return !!index.findCell(x); });
        if (remaining.length != selection.length) {
            this.select(remaining, autoScroll);
        }
    };
    SelectorExtension.prototype.beginSelectGesture = function (gridX, gridY) {
        var pt = new Point_1.Point(gridX, gridY);
        var cell = this.grid.getCellAtViewPoint(pt);
        if (!cell)
            return;
        this.selectGesture = {
            start: cell.ref,
            end: cell.ref,
        };
        this.select([cell.ref]);
    };
    SelectorExtension.prototype.updateSelectGesture = function (gridX, gridY) {
        var _a = this, grid = _a.grid, selectGesture = _a.selectGesture;
        var pt = new Point_1.Point(gridX, gridY);
        var cell = grid.getCellAtViewPoint(pt);
        if (!cell || selectGesture.end === cell.ref)
            return;
        selectGesture.end = cell.ref;
        var region = Rect_1.Rect.fromMany([
            grid.getCellGridRect(selectGesture.start),
            grid.getCellGridRect(selectGesture.end)
        ]);
        var cellRefs = grid.getCellsInGridRect(region)
            .map(function (x) { return x.ref; });
        if (cellRefs.length > 1) {
            cellRefs.splice(cellRefs.indexOf(selectGesture.start), 1);
            cellRefs.splice(0, 0, selectGesture.start);
        }
        this.select(cellRefs, cellRefs.length == 1);
    };
    SelectorExtension.prototype.doSelect = function (cells, autoScroll) {
        if (cells === void 0) { cells = []; }
        if (autoScroll === void 0) { autoScroll = true; }
        var grid = this.grid;
        if (cells.length) {
            this.selection = cells;
            if (autoScroll) {
                var primaryRect = grid.getCellViewRect(cells[0]);
                grid.scrollTo(primaryRect);
            }
        }
        else {
            this.selection = [];
            this.selectGesture = null;
        }
    };
    SelectorExtension.prototype.alignSelectors = function (animate) {
        var _a = this, grid = _a.grid, selection = _a.selection, primarySelector = _a.primarySelector, captureSelector = _a.captureSelector;
        if (selection.length) {
            var primaryRect = grid.getCellViewRect(selection[0]);
            primarySelector.goto(primaryRect, animate);
            //TODO: Improve the shit out of this:
            var captureRect = Rect_1.Rect.fromMany(selection.map(function (x) { return grid.getCellViewRect(x); }));
            captureSelector.goto(captureRect, animate);
            captureSelector.toggle(selection.length > 1);
        }
        else {
            primarySelector.hide();
            captureSelector.hide();
        }
    };
    return SelectorExtension;
}());
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "select", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectAll", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectEdge", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectLine", null);
__decorate([
    Extensibility_1.command(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Point_1.Point, Object]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "selectNeighbor", null);
__decorate([
    Extensibility_1.routine(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Boolean]),
    __metadata("design:returntype", void 0)
], SelectorExtension.prototype, "doSelect", null);
exports.SelectorExtension = SelectorExtension;
var Selector = (function (_super) {
    __extends(Selector, _super);
    function Selector() {
        return _super.apply(this, arguments) || this;
    }
    Selector.create = function (container, primary) {
        if (primary === void 0) { primary = false; }
        var root = document.createElement('div');
        root.className = 'grid-selector ' + (primary ? 'grid-selector-primary' : '');
        container.appendChild(root);
        Dom.css(root, {
            position: 'absolute',
            left: '0px',
            top: '0px',
            display: 'none',
        });
        return new Selector(root);
    };
    return Selector;
}(Widget_1.AbsWidgetBase));

},{"../geom/Point":6,"../geom/Rect":7,"../input/KeyInput":10,"../input/MouseDragEventSupport":12,"../input/MouseInput":14,"../misc/Dom":15,"../ui/Extensibility":28,"../ui/Widget":32,"tether":50}],6:[function(require,module,exports){
"use strict";
var Point = (function () {
    function Point(x, y) {
        this.x = 0;
        this.y = 0;
        if (Array.isArray(x)) {
            this.x = (x[0]);
            this.y = (x[1]);
        }
        else {
            this.x = x;
            this.y = (y);
        }
    }
    Point.average = function (points) {
        if (!points.length) {
            return Point.empty;
        }
        var x = 0, y = 0;
        points.forEach(function (p) {
            x += p.x;
            y += p.y;
        });
        return new Point(x / points.length, y / points.length);
    };
    Point.direction = function (from, to) {
        return ptArg(to).subtract(from).normalize();
    };
    Point.create = function (source) {
        return ptArg(source);
    };
    Point.fromBuffer = function (buffer, index) {
        if (index === void 0) { index = 0; }
        return new Point(buffer[index], buffer[index + 1]);
    };
    //region Geometry
    Point.prototype.angle = function () {
        return (this.x < 0)
            ? 360 - Math.atan2(this.x, -this.y) * Point.rad2deg * -1
            : Math.atan2(this.x, -this.y) * Point.rad2deg;
    };
    Point.prototype.angleAbout = function (val) {
        var pt = ptArg(val);
        return Math.atan2(pt.cross(this), pt.dot(this));
    };
    Point.prototype.cross = function (val) {
        var pt = ptArg(val);
        return this.x * pt.y - this.y * pt.x;
    };
    Point.prototype.distance = function (to) {
        var pt = ptArg(to);
        var a = this.x - pt.x;
        var b = this.y - pt.y;
        return Math.sqrt(a * a + b * b);
    };
    Point.prototype.dot = function (val) {
        var pt = ptArg(val);
        return this.x * pt.x + this.y * pt.y;
    };
    Point.prototype.length = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Point.prototype.normalize = function () {
        var len = this.length();
        if (len > 0.00001) {
            return this.multiply(1 / len);
        }
        return this.clone();
    };
    Point.prototype.perp = function () {
        return new Point(this.y * -1, this.x);
    };
    Point.prototype.rperp = function () {
        return this.reverse().perp();
    };
    Point.prototype.inverse = function () {
        return new Point(this.x * -1, this.y * -1);
    };
    Point.prototype.reverse = function () {
        return new Point(this.x * -1, this.y * -1);
    };
    Point.prototype.rotate = function (radians) {
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = this.x * cos - this.y * sin;
        var ny = this.y * cos + this.x * sin;
        return new Point(nx, ny);
    };
    //endregion
    //region Arithmetic
    Point.prototype.add = function (val) {
        var pt = ptArg(val);
        if (!pt) {
            throw 'add: pt required.';
        }
        return new Point(this.x + pt.x, this.y + pt.y);
    };
    Point.prototype.divide = function (divisor) {
        return new Point(this.x / divisor, this.y / divisor);
    };
    Point.prototype.multiply = function (multipler) {
        return new Point(this.x * multipler, this.y * multipler);
    };
    Point.prototype.round = function () {
        return new Point(Math.round(this.x), Math.round(this.y));
    };
    Point.prototype.subtract = function (val) {
        var pt = ptArg(val);
        if (!pt) {
            throw 'subtract: pt required.';
        }
        return this.add(pt.reverse());
    };
    //endregion
    //region Conversion
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.equals = function (another) {
        return this.x === another.x && this.y === another.y;
    };
    Point.prototype.toArray = function () {
        return [this.x, this.y];
    };
    Point.prototype.toString = function () {
        return "[" + this.x + ", " + this.y + "]";
    };
    return Point;
}());
Point.rad2deg = 360 / (Math.PI * 2);
Point.deg2rad = (Math.PI * 2) / 360;
Point.empty = new Point(0, 0);
Point.max = new Point(2147483647, 2147483647);
Point.min = new Point(-2147483647, -2147483647);
Point.up = new Point(0, -1);
exports.Point = Point;
function ptArg(val) {
    if (val !== null || val !== undefined) {
        if (val instanceof Point) {
            return val;
        }
        if (val.x !== undefined && val.y !== undefined) {
            return new Point(val.x, val.y);
        }
        if (val.left !== undefined && val.top !== undefined) {
            return new Point(val.left, val.top);
        }
        if (Array.isArray(val)) {
            return new Point(val);
        }
        if (typeof (val) === 'string') {
            val = parseInt(val);
        }
        if (typeof (val) === 'number') {
            return new Point(val, val);
        }
    }
    return Point.empty;
}

},{}],7:[function(require,module,exports){
"use strict";
var Point_1 = require("./Point");
var Rect = (function () {
    function Rect(left, top, width, height) {
        this.left = 0;
        this.top = 0;
        this.width = 0;
        this.height = 0;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    Rect.fromEdges = function (left, top, right, bottom) {
        return new Rect(left, top, right - left, bottom - top);
    };
    Rect.fromLike = function (like) {
        return new Rect(like.left, like.top, like.width, like.height);
    };
    Rect.fromMany = function (rects) {
        var points = [].concat.apply([], rects.map(function (x) { return x.points(); }));
        return Rect.fromPointBuffer(points);
    };
    Rect.fromPoints = function () {
        var points = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            points[_i] = arguments[_i];
        }
        return Rect.fromPointBuffer(points);
    };
    Rect.fromPointBuffer = function (points, index, length) {
        if (index !== undefined) {
            points = points.slice(index);
        }
        if (length !== undefined) {
            points = points.slice(0, length);
        }
        return Rect.fromEdges(Math.min.apply(Math, points.map(function (p) { return p.x; })), Math.min.apply(Math, points.map(function (p) { return p.y; })), Math.max.apply(Math, points.map(function (p) { return p.x; })), Math.max.apply(Math, points.map(function (p) { return p.y; })));
    };
    Object.defineProperty(Rect.prototype, "right", {
        get: function () {
            return this.left + this.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Rect.prototype, "bottom", {
        get: function () {
            return this.top + this.height;
        },
        enumerable: true,
        configurable: true
    });
    Rect.prototype.center = function () {
        return new Point_1.Point(this.left + (this.width / 2), this.top + (this.height / 2));
    };
    Rect.prototype.topLeft = function () {
        return new Point_1.Point(this.left, this.top);
    };
    Rect.prototype.points = function () {
        return [
            new Point_1.Point(this.left, this.top),
            new Point_1.Point(this.right, this.top),
            new Point_1.Point(this.right, this.bottom),
            new Point_1.Point(this.left, this.bottom),
        ];
    };
    Rect.prototype.size = function () {
        return new Point_1.Point(this.width, this.height);
    };
    Rect.prototype.offset = function (pt) {
        return new Rect(this.left + pt.x, this.top + pt.y, this.width, this.height);
    };
    Rect.prototype.contains = function (input) {
        if (input['x'] !== undefined && input['y'] !== undefined) {
            var pt = input;
            return (pt.x >= this.left
                && pt.y >= this.top
                && pt.x <= this.left + this.width
                && pt.y <= this.top + this.height);
        }
        else {
            var rect = input;
            return (rect.left >= this.left &&
                rect.top >= this.top &&
                rect.left + rect.width <= this.left + this.width &&
                rect.top + rect.height <= this.top + this.height);
        }
    };
    Rect.prototype.inflate = function (size) {
        return new Rect(this.left - size.x, this.top - size.y, this.width + size.x, this.height + size.y);
    };
    Rect.prototype.intersects = function (rect) {
        return rect.left + rect.width > this.left
            && rect.top + rect.height > this.top
            && rect.left < this.left + this.width
            && rect.top < this.top + this.height;
    };
    Rect.prototype.normalize = function () {
        if (this.width >= 0 && this.height >= 0) {
            return this;
        }
        var x = this.left;
        var y = this.top;
        var w = this.width;
        var h = this.height;
        if (w < 0) {
            x += w;
            w = Math.abs(w);
        }
        if (h < 0) {
            y += h;
            h = Math.abs(h);
        }
        return new Rect(x, y, w, h);
    };
    Rect.prototype.toString = function () {
        return "[" + this.left + ", " + this.top + ", " + this.width + ", " + this.height + "]";
    };
    return Rect;
}());
Rect.empty = new Rect(0, 0, 0, 0);
exports.Rect = Rect;

},{"./Point":6}],8:[function(require,module,exports){
"use strict";
var _ = require("../misc/Util");
var EventTargetEventEmitterAdapter = (function () {
    function EventTargetEventEmitterAdapter(target) {
        this.target = target;
    }
    EventTargetEventEmitterAdapter.wrap = function (target) {
        if (!!target['addEventListener']) {
            return new EventTargetEventEmitterAdapter(target);
        }
        return target;
    };
    EventTargetEventEmitterAdapter.prototype.on = function (event, callback) {
        var _this = this;
        this.target.addEventListener(event, callback);
        return {
            cancel: function () { return _this.off(event, callback); },
        };
    };
    EventTargetEventEmitterAdapter.prototype.off = function (event, callback) {
        this.target.removeEventListener(event, callback);
    };
    EventTargetEventEmitterAdapter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.target.dispatchEvent(_.extend(new Event(event), { args: args }));
    };
    return EventTargetEventEmitterAdapter;
}());
exports.EventTargetEventEmitterAdapter = EventTargetEventEmitterAdapter;

},{"../misc/Util":17}],9:[function(require,module,exports){
"use strict";
var Keys_1 = require("./Keys");
var KeyExpression = (function () {
    function KeyExpression(keys, exclusive) {
        this.exclusive = exclusive;
        this.ctrl = keys.some(function (x) { return x === Keys_1.Keys.CTRL; });
        this.alt = keys.some(function (x) { return x === Keys_1.Keys.ALT; });
        this.shift = keys.some(function (x) { return x === Keys_1.Keys.SHIFT; });
        this.key = keys.filter(function (x) { return x !== Keys_1.Keys.CTRL && x !== Keys_1.Keys.ALT && x !== Keys_1.Keys.SHIFT; })[0] || null;
    }
    KeyExpression.parse = function (input) {
        var exclusive = input[0] === '!';
        if (exclusive) {
            input = input.substr(1);
        }
        var keys = input
            .split(/[\s\-\+]+/)
            .map(function (x) { return Keys_1.Keys.parse(x); });
        return new KeyExpression(keys, exclusive);
    };
    KeyExpression.prototype.matches = function (keyData) {
        if (keyData instanceof KeyExpression) {
            return (this.ctrl == keyData.ctrl &&
                this.alt == keyData.alt &&
                this.shift == keyData.shift &&
                this.key == keyData.key);
        }
        else if (keyData instanceof KeyboardEvent) {
            return (this.ctrl == keyData.ctrlKey &&
                this.alt == keyData.altKey &&
                this.shift == keyData.shiftKey &&
                this.key == keyData.keyCode);
        }
        throw 'KeyExpression.matches: Invalid input';
    };
    return KeyExpression;
}());
exports.KeyExpression = KeyExpression;

},{"./Keys":11}],10:[function(require,module,exports){
"use strict";
var KeyExpression_1 = require("./KeyExpression");
var EventTargetEventEmitterAdapter_1 = require("./EventTargetEventEmitterAdapter");
var KeyInput = (function () {
    function KeyInput(emitters) {
        this.emitters = emitters;
        this.subs = [];
    }
    KeyInput.for = function () {
        var elmts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elmts[_i] = arguments[_i];
        }
        return new KeyInput(normalize(elmts));
    };
    KeyInput.prototype.on = function (exprs, callback) {
        var _this = this;
        if (!Array.isArray(exprs)) {
            return this.on([exprs], callback);
        }
        var _loop_1 = function (re) {
            var ss = this_1.emitters.map(function (ee) { return _this.createListener(ee, KeyExpression_1.KeyExpression.parse(re), callback); });
            this_1.subs = this_1.subs.concat(ss);
        };
        var this_1 = this;
        for (var _i = 0, exprs_1 = exprs; _i < exprs_1.length; _i++) {
            var re = exprs_1[_i];
            _loop_1(re);
        }
        return this;
    };
    KeyInput.prototype.createListener = function (ee, ke, callback) {
        return ee.on('keydown', function (evt) {
            if (ke.matches(evt)) {
                if (ke.exclusive) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                callback();
            }
        });
    };
    return KeyInput;
}());
exports.KeyInput = KeyInput;
function normalize(kms) {
    return kms
        .map(function (x) { return (!!x['addEventListener'])
        ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
        : x; });
}

},{"./EventTargetEventEmitterAdapter":8,"./KeyExpression":9}],11:[function(require,module,exports){
"use strict";
var Keys = (function () {
    function Keys() {
    }
    Keys.parse = function (input, thrownOnFail) {
        if (thrownOnFail === void 0) { thrownOnFail = true; }
        switch (input.trim()) {
            case 'BACKSPACE': return Keys.BACKSPACE;
            case 'TAB': return Keys.TAB;
            case 'ENTER': return Keys.ENTER;
            case 'SHIFT': return Keys.SHIFT;
            case 'CTRL': return Keys.CTRL;
            case 'ALT': return Keys.ALT;
            case 'PAUSE': return Keys.PAUSE;
            case 'CAPS_LOCK': return Keys.CAPS_LOCK;
            case 'ESCAPE': return Keys.ESCAPE;
            case 'SPACE': return Keys.SPACE;
            case 'PAGE_UP': return Keys.PAGE_UP;
            case 'PAGE_DOWN': return Keys.PAGE_DOWN;
            case 'END': return Keys.END;
            case 'HOME': return Keys.HOME;
            case 'LEFT_ARROW': return Keys.LEFT_ARROW;
            case 'UP_ARROW': return Keys.UP_ARROW;
            case 'RIGHT_ARROW': return Keys.RIGHT_ARROW;
            case 'DOWN_ARROW': return Keys.DOWN_ARROW;
            case 'INSERT': return Keys.INSERT;
            case 'DELETE': return Keys.DELETE;
            case 'KEY_0': return Keys.KEY_0;
            case 'KEY_1': return Keys.KEY_1;
            case 'KEY_2': return Keys.KEY_2;
            case 'KEY_3': return Keys.KEY_3;
            case 'KEY_4': return Keys.KEY_4;
            case 'KEY_5': return Keys.KEY_5;
            case 'KEY_6': return Keys.KEY_6;
            case 'KEY_7': return Keys.KEY_7;
            case 'KEY_8': return Keys.KEY_8;
            case 'KEY_9': return Keys.KEY_9;
            case 'KEY_A': return Keys.KEY_A;
            case 'KEY_B': return Keys.KEY_B;
            case 'KEY_C': return Keys.KEY_C;
            case 'KEY_D': return Keys.KEY_D;
            case 'KEY_E': return Keys.KEY_E;
            case 'KEY_F': return Keys.KEY_F;
            case 'KEY_G': return Keys.KEY_G;
            case 'KEY_H': return Keys.KEY_H;
            case 'KEY_I': return Keys.KEY_I;
            case 'KEY_J': return Keys.KEY_J;
            case 'KEY_K': return Keys.KEY_K;
            case 'KEY_L': return Keys.KEY_L;
            case 'KEY_M': return Keys.KEY_M;
            case 'KEY_N': return Keys.KEY_N;
            case 'KEY_O': return Keys.KEY_O;
            case 'KEY_P': return Keys.KEY_P;
            case 'KEY_Q': return Keys.KEY_Q;
            case 'KEY_R': return Keys.KEY_R;
            case 'KEY_S': return Keys.KEY_S;
            case 'KEY_T': return Keys.KEY_T;
            case 'KEY_U': return Keys.KEY_U;
            case 'KEY_V': return Keys.KEY_V;
            case 'KEY_W': return Keys.KEY_W;
            case 'KEY_X': return Keys.KEY_X;
            case 'KEY_Y': return Keys.KEY_Y;
            case 'KEY_Z': return Keys.KEY_Z;
            case '0': return Keys.KEY_0;
            case '1': return Keys.KEY_1;
            case '2': return Keys.KEY_2;
            case '3': return Keys.KEY_3;
            case '4': return Keys.KEY_4;
            case '5': return Keys.KEY_5;
            case '6': return Keys.KEY_6;
            case '7': return Keys.KEY_7;
            case '8': return Keys.KEY_8;
            case '9': return Keys.KEY_9;
            case 'A': return Keys.KEY_A;
            case 'B': return Keys.KEY_B;
            case 'C': return Keys.KEY_C;
            case 'D': return Keys.KEY_D;
            case 'E': return Keys.KEY_E;
            case 'F': return Keys.KEY_F;
            case 'G': return Keys.KEY_G;
            case 'H': return Keys.KEY_H;
            case 'I': return Keys.KEY_I;
            case 'J': return Keys.KEY_J;
            case 'K': return Keys.KEY_K;
            case 'L': return Keys.KEY_L;
            case 'M': return Keys.KEY_M;
            case 'N': return Keys.KEY_N;
            case 'O': return Keys.KEY_O;
            case 'P': return Keys.KEY_P;
            case 'Q': return Keys.KEY_Q;
            case 'R': return Keys.KEY_R;
            case 'S': return Keys.KEY_S;
            case 'T': return Keys.KEY_T;
            case 'U': return Keys.KEY_U;
            case 'V': return Keys.KEY_V;
            case 'W': return Keys.KEY_W;
            case 'X': return Keys.KEY_X;
            case 'Y': return Keys.KEY_Y;
            case 'Z': return Keys.KEY_Z;
            case 'LEFT_META': return Keys.LEFT_META;
            case 'RIGHT_META': return Keys.RIGHT_META;
            case 'SELECT': return Keys.SELECT;
            case 'NUMPAD_0': return Keys.NUMPAD_0;
            case 'NUMPAD_1': return Keys.NUMPAD_1;
            case 'NUMPAD_2': return Keys.NUMPAD_2;
            case 'NUMPAD_3': return Keys.NUMPAD_3;
            case 'NUMPAD_4': return Keys.NUMPAD_4;
            case 'NUMPAD_5': return Keys.NUMPAD_5;
            case 'NUMPAD_6': return Keys.NUMPAD_6;
            case 'NUMPAD_7': return Keys.NUMPAD_7;
            case 'NUMPAD_8': return Keys.NUMPAD_8;
            case 'NUMPAD_9': return Keys.NUMPAD_9;
            case 'MULTIPLY': return Keys.MULTIPLY;
            case 'ADD': return Keys.ADD;
            case 'SUBTRACT': return Keys.SUBTRACT;
            case 'DECIMAL': return Keys.DECIMAL;
            case 'DIVIDE': return Keys.DIVIDE;
            case 'F1': return Keys.F1;
            case 'F2': return Keys.F2;
            case 'F3': return Keys.F3;
            case 'F4': return Keys.F4;
            case 'F5': return Keys.F5;
            case 'F6': return Keys.F6;
            case 'F7': return Keys.F7;
            case 'F8': return Keys.F8;
            case 'F9': return Keys.F9;
            case 'F10': return Keys.F10;
            case 'F11': return Keys.F11;
            case 'F12': return Keys.F12;
            case 'NUM_LOCK': return Keys.NUM_LOCK;
            case 'SCROLL_LOCK': return Keys.SCROLL_LOCK;
            case 'SEMICOLON': return Keys.SEMICOLON;
            case 'EQUALS': return Keys.EQUALS;
            case 'COMMA': return Keys.COMMA;
            case 'DASH': return Keys.DASH;
            case 'PERIOD': return Keys.PERIOD;
            case 'FORWARD_SLASH': return Keys.FORWARD_SLASH;
            case 'GRAVE_ACCENT': return Keys.GRAVE_ACCENT;
            case 'OPEN_BRACKET': return Keys.OPEN_BRACKET;
            case 'BACK_SLASH': return Keys.BACK_SLASH;
            case 'CLOSE_BRACKET': return Keys.CLOSE_BRACKET;
            case 'SINGLE_QUOTE': return Keys.SINGLE_QUOTE;
            default:
                if (thrownOnFail)
                    throw 'Invalid key: ' + input;
                else
                    return null;
        }
    };
    return Keys;
}());
Keys.BACKSPACE = 8;
Keys.TAB = 9;
Keys.ENTER = 13;
Keys.SHIFT = 16;
Keys.CTRL = 17;
Keys.ALT = 18;
Keys.PAUSE = 19;
Keys.CAPS_LOCK = 20;
Keys.ESCAPE = 27;
Keys.SPACE = 32;
Keys.PAGE_UP = 33;
Keys.PAGE_DOWN = 34;
Keys.END = 35;
Keys.HOME = 36;
Keys.LEFT_ARROW = 37;
Keys.UP_ARROW = 38;
Keys.RIGHT_ARROW = 39;
Keys.DOWN_ARROW = 40;
Keys.INSERT = 45;
Keys.DELETE = 46;
Keys.KEY_0 = 48;
Keys.KEY_1 = 49;
Keys.KEY_2 = 50;
Keys.KEY_3 = 51;
Keys.KEY_4 = 52;
Keys.KEY_5 = 53;
Keys.KEY_6 = 54;
Keys.KEY_7 = 55;
Keys.KEY_8 = 56;
Keys.KEY_9 = 57;
Keys.KEY_A = 65;
Keys.KEY_B = 66;
Keys.KEY_C = 67;
Keys.KEY_D = 68;
Keys.KEY_E = 69;
Keys.KEY_F = 70;
Keys.KEY_G = 71;
Keys.KEY_H = 72;
Keys.KEY_I = 73;
Keys.KEY_J = 74;
Keys.KEY_K = 75;
Keys.KEY_L = 76;
Keys.KEY_M = 77;
Keys.KEY_N = 78;
Keys.KEY_O = 79;
Keys.KEY_P = 80;
Keys.KEY_Q = 81;
Keys.KEY_R = 82;
Keys.KEY_S = 83;
Keys.KEY_T = 84;
Keys.KEY_U = 85;
Keys.KEY_V = 86;
Keys.KEY_W = 87;
Keys.KEY_X = 88;
Keys.KEY_Y = 89;
Keys.KEY_Z = 90;
Keys.LEFT_META = 91;
Keys.RIGHT_META = 92;
Keys.SELECT = 93;
Keys.NUMPAD_0 = 96;
Keys.NUMPAD_1 = 97;
Keys.NUMPAD_2 = 98;
Keys.NUMPAD_3 = 99;
Keys.NUMPAD_4 = 100;
Keys.NUMPAD_5 = 101;
Keys.NUMPAD_6 = 102;
Keys.NUMPAD_7 = 103;
Keys.NUMPAD_8 = 104;
Keys.NUMPAD_9 = 105;
Keys.MULTIPLY = 106;
Keys.ADD = 107;
Keys.SUBTRACT = 109;
Keys.DECIMAL = 110;
Keys.DIVIDE = 111;
Keys.F1 = 112;
Keys.F2 = 113;
Keys.F3 = 114;
Keys.F4 = 115;
Keys.F5 = 116;
Keys.F6 = 117;
Keys.F7 = 118;
Keys.F8 = 119;
Keys.F9 = 120;
Keys.F10 = 121;
Keys.F11 = 122;
Keys.F12 = 123;
Keys.NUM_LOCK = 144;
Keys.SCROLL_LOCK = 145;
Keys.SEMICOLON = 186;
Keys.EQUALS = 187;
Keys.COMMA = 188;
Keys.DASH = 189;
Keys.PERIOD = 190;
Keys.FORWARD_SLASH = 191;
Keys.GRAVE_ACCENT = 192;
Keys.OPEN_BRACKET = 219;
Keys.BACK_SLASH = 220;
Keys.CLOSE_BRACKET = 221;
Keys.SINGLE_QUOTE = 222;
exports.Keys = Keys;

},{}],12:[function(require,module,exports){
"use strict";
var Point_1 = require("../geom/Point");
var MouseDragEventSupport = (function () {
    function MouseDragEventSupport(elmt) {
        this.elmt = elmt;
        this.shouldDrag = false;
        this.isDragging = false;
        this.elmt.addEventListener('mousedown', this.listener = this.onTargetMouseDown.bind(this));
    }
    MouseDragEventSupport.check = function (elmt) {
        return elmt.dataset['MouseDragEventSupport'] === 'true';
    };
    MouseDragEventSupport.enable = function (elmt) {
        elmt.dataset['MouseDragEventSupport'] = 'true';
        return new MouseDragEventSupport(elmt);
    };
    MouseDragEventSupport.prototype.destroy = function () {
        this.elmt.removeEventListener('mousedown', this.listener);
    };
    MouseDragEventSupport.prototype.onTargetMouseDown = function (e) {
        //e.preventDefault();
        //e.stopPropagation();
        this.shouldDrag = true;
        this.isDragging = false;
        this.startPoint = this.lastPoint = new Point_1.Point(e.clientX, e.clientY);
        var moveHandler = this.onWindowMouseMove.bind(this);
        var upHandler = this.onWindowMouseUp.bind(this);
        this.cancel = function () {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
        };
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    };
    MouseDragEventSupport.prototype.onWindowMouseMove = function (e) {
        e.preventDefault();
        e.stopPropagation();
        var newPoint = new Point_1.Point(e.clientX, e.clientY);
        if (this.shouldDrag) {
            if (!this.isDragging) {
                this.elmt.dispatchEvent(this.createEvent('dragbegin', e));
                this.isDragging = true;
            }
            else {
                this.elmt.dispatchEvent(this.createEvent('drag', e, newPoint.subtract(this.lastPoint)));
            }
        }
        this.lastPoint = newPoint;
    };
    MouseDragEventSupport.prototype.onWindowMouseUp = function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.isDragging) {
            this.elmt.dispatchEvent(this.createEvent('dragend', e));
        }
        this.shouldDrag = false;
        this.isDragging = false;
        this.lastPoint = new Point_1.Point(e.clientX, e.clientY);
        if (this.cancel) {
            this.cancel();
        }
    };
    MouseDragEventSupport.prototype.createEvent = function (type, source, dist) {
        var event = (new MouseEvent(type, source));
        event.startX = this.startPoint.x;
        event.startY = this.startPoint.y;
        if (dist) {
            event.distX = dist.x;
            event.distY = dist.y;
        }
        return event;
    };
    return MouseDragEventSupport;
}());
exports.MouseDragEventSupport = MouseDragEventSupport;

},{"../geom/Point":6}],13:[function(require,module,exports){
"use strict";
var Keys_1 = require("./Keys");
var _ = require("../misc/Util");
function parse_event(value) {
    value = (value || '').trim().toLowerCase();
    switch (value) {
        case 'down':
        case 'move':
        case 'up':
            return ('mouse' + value);
        case 'click':
        case 'dblclick':
        case 'down':
        case 'move':
        case 'up':
        case 'dragbegin':
        case 'drag':
        case 'dragend':
            return value;
        default:
            throw 'Invalid MouseEventType: ' + value;
    }
}
function parse_button(value) {
    value = (value || '').trim().toLowerCase();
    switch (value) {
        case 'primary':
        case 'button1':
            return 0;
        case 'secondary':
        case 'button2':
            return 1;
        case 'button3':
            return 2;
        default:
            throw 'Invalid MouseButton: ' + value;
    }
}
function divide_expression(value) {
    var parts = value.split(':');
    if (parts.length == 1) {
        parts.splice(0, 0, 'down');
    }
    return parts.slice(0, 2);
}
var MouseExpression = (function () {
    function MouseExpression(cfg) {
        this.event = null;
        this.button = null;
        this.ctrl = false;
        this.alt = false;
        this.shift = false;
        this.exclusive = false;
        _.extend(this, cfg);
    }
    MouseExpression.parse = function (input) {
        var cfg = {};
        cfg.exclusive = input[0] === '!';
        if (cfg.exclusive) {
            input = input.substr(1);
        }
        var _a = divide_expression(input), left = _a[0], right = _a[1];
        cfg.event = parse_event(left);
        right.split(/[\s\-\+]+/)
            .forEach(function (x) {
            var key = Keys_1.Keys.parse(x, false);
            if (key !== null) {
                switch (key) {
                    case Keys_1.Keys.CTRL:
                        cfg.ctrl = true;
                        break;
                    case Keys_1.Keys.ALT:
                        cfg.alt = true;
                        break;
                    case Keys_1.Keys.SHIFT:
                        cfg.shift = true;
                        break;
                }
            }
            else {
                cfg.button = parse_button(x);
            }
        });
        return new MouseExpression(cfg);
    };
    MouseExpression.prototype.matches = function (mouseData) {
        return (this.event == mouseData.type &&
            this.ctrl == mouseData.ctrlKey &&
            this.alt == mouseData.altKey &&
            this.shift == mouseData.shiftKey &&
            (this.button == null || this.button == mouseData.button));
    };
    return MouseExpression;
}());
exports.MouseExpression = MouseExpression;

},{"../misc/Util":17,"./Keys":11}],14:[function(require,module,exports){
"use strict";
var EventTargetEventEmitterAdapter_1 = require("./EventTargetEventEmitterAdapter");
var MouseExpression_1 = require("./MouseExpression");
var MouseInput = (function () {
    function MouseInput(emitters) {
        this.emitters = emitters;
        this.subs = [];
    }
    MouseInput.for = function () {
        var elmts = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elmts[_i] = arguments[_i];
        }
        return new MouseInput(normalize(elmts));
    };
    MouseInput.prototype.on = function (expr, callback) {
        var _this = this;
        var ss = this.emitters.map(function (ee) { return _this.createListener(ee, MouseExpression_1.MouseExpression.parse(expr), callback); });
        this.subs = this.subs.concat(ss);
        return this;
    };
    MouseInput.prototype.createListener = function (target, expr, callback) {
        return target.on(expr.event, function (evt) {
            if (expr.matches(evt)) {
                if (expr.exclusive) {
                    evt.preventDefault();
                    evt.stopPropagation();
                }
                callback(evt);
            }
        });
    };
    return MouseInput;
}());
exports.MouseInput = MouseInput;
function normalize(kms) {
    return kms
        .map(function (x) { return (!!x['addEventListener'])
        ? new EventTargetEventEmitterAdapter_1.EventTargetEventEmitterAdapter(x)
        : x; });
}

},{"./EventTargetEventEmitterAdapter":8,"./MouseExpression":13}],15:[function(require,module,exports){
"use strict";
function parse(html) {
    var frag = document.createDocumentFragment();
    var body = document.createElement('body');
    frag.appendChild(body);
    body.innerHTML = html;
    return body.firstElementChild;
}
exports.parse = parse;
function css(e, styles) {
    for (var prop in styles) {
        e.style[prop] = styles[prop];
    }
    return e;
}
exports.css = css;
function hide(e) {
    return css(e, { display: 'none' });
}
exports.hide = hide;
function show(e) {
    return css(e, { display: 'block' });
}
exports.show = show;
function toggle(e, visible) {
    return visible ? show(e) : hide(e);
}
exports.toggle = toggle;
function singleTransition(e, prop, millis, ease) {
    if (ease === void 0) { ease = 'linear'; }
    e.style.transition = prop + " " + millis + "ms " + ease;
    console.log(e.style.transition);
    setTimeout(function () { return e.style.transition = ''; }, millis);
}
exports.singleTransition = singleTransition;

},{}],16:[function(require,module,exports){
"use strict";
function property(defaultValue, filter) {
    return function (ctor, propName) {
        Object.defineProperty(ctor, propName, {
            configurable: false,
            enumerable: true,
            get: function () {
                var val = this['__' + propName];
                return (val === undefined) ? defaultValue : val;
            },
            set: function (newVal) {
                this['__' + propName] = newVal;
                filter(this, newVal);
            }
        });
    };
}
exports.property = property;

},{}],17:[function(require,module,exports){
"use strict";
function extend(target, data) {
    for (var k in data) {
        target[k] = data[k];
    }
    return target;
}
exports.extend = extend;
function index(arr, indexer) {
    var obj = {};
    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
        var tm = arr_1[_i];
        obj[indexer(tm)] = tm;
    }
    return obj;
}
exports.index = index;
function values(ix) {
    var a = [];
    for (var k in ix) {
        a.push(ix[k]);
    }
    return a;
}
exports.values = values;
function zipPairs(pairs) {
    var obj = {};
    for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
        var pair = pairs_1[_i];
        obj[pair[0]] = pair[1];
    }
    return obj;
}
exports.zipPairs = zipPairs;
function unzipPairs(pairs) {
    var arr = [];
    for (var key in pairs) {
        arr.push([key, pairs[key]]);
    }
    return arr;
}
exports.unzipPairs = unzipPairs;
function max(arr, selector) {
    if (arr.length === 0)
        return null;
    var t = arr[0];
    for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
        var x = arr_2[_i];
        if (selector(t) < selector(x)) {
            t = x;
        }
    }
    return t;
}
exports.max = max;

},{}],18:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],19:[function(require,module,exports){
"use strict";
var util = require("../misc/Util");
var GridModelIndex = (function () {
    function GridModelIndex(model) {
        this.refs = util.index(model.cells, function (x) { return x.ref; });
        this.coords = {};
        for (var _i = 0, _a = model.cells; _i < _a.length; _i++) {
            var c = _a[_i];
            var x = this.coords[c.colRef] || (this.coords[c.colRef] = {});
            x[c.rowRef] = c;
        }
    }
    GridModelIndex.prototype.findCell = function (ref) {
        return this.refs[ref] || null;
    };
    GridModelIndex.prototype.findCellNeighbor = function (ref, vector) {
        var cell = this.findCell(ref);
        var col = cell.colRef + vector.x;
        var row = cell.rowRef + vector.y;
        return this.locateCell(col, row);
    };
    GridModelIndex.prototype.locateCell = function (col, row) {
        return (this.coords[col] || {})[row] || null;
    };
    return GridModelIndex;
}());
exports.GridModelIndex = GridModelIndex;

},{"../misc/Util":17}],20:[function(require,module,exports){
"use strict";
var GridModelIndex_1 = require("./GridModelIndex");
var Range_1 = require("./Range");
var Rect_1 = require("../geom/Rect");
var Query = (function () {
    function Query(model) {
        this.model = model;
    }
    Query.over = function (model) {
        return new Query(model);
    };
    Query.prototype.vector = function (from, to, toInclusive) {
        if (toInclusive === void 0) { toInclusive = false; }
        if (toInclusive) {
            to = to.add(1);
        }
        var index = new GridModelIndex_1.GridModelIndex(this.model);
        var dims = Rect_1.Rect.fromPoints(from, to);
        var results = [];
        for (var r = dims.top; r < dims.bottom; r++) {
            for (var c = dims.left; c < dims.right; c++) {
                var cell = index.locateCell(c, r);
                if (cell) {
                    results.push(cell.ref);
                }
            }
        }
        return Range_1.Range.create(this.model, results);
    };
    return Query;
}());
exports.Query = Query;

},{"../geom/Rect":7,"./GridModelIndex":19,"./Range":21}],21:[function(require,module,exports){
"use strict";
var _ = require("../misc/util");
var Range = (function () {
    function Range(values) {
        _.extend(this, values);
    }
    Range.create = function (model, cellRefs) {
        var lookup = _.index(cellRefs, function (x) { return x; });
        var cells = [];
        var lc = Number.MAX_VALUE, lr = Number.MAX_VALUE;
        var hc = Number.MIN_VALUE, hr = Number.MIN_VALUE;
        for (var _i = 0, _a = model.cells; _i < _a.length; _i++) {
            var c = _a[_i];
            if (!lookup[c.ref])
                continue;
            cells.push(c);
            if (lc > c.colRef)
                lc = c.colRef;
            if (hc < c.colRef)
                hc = c.colRef;
            if (lr > c.rowRef)
                lr = c.rowRef;
            if (hr < c.rowRef)
                hr = c.rowRef;
        }
        var ltr = cells.sort(ltr_sort);
        var ttb = cells.slice(0).sort(ttb_sort);
        return new Range({
            ltr: ltr,
            ttb: ttb,
            width: hc - lc,
            height: hr - lr,
            length: (hc - lc) * (hr - lr),
            count: cells.length,
        });
    };
    Range.empty = function () {
        return new Range({
            ltr: [],
            ttb: [],
            width: 0,
            height: 0,
            length: 0,
            count: 0,
        });
    };
    return Range;
}());
exports.Range = Range;
function ltr_sort(a, b) {
    var n = 0;
    n = a.rowRef - b.rowRef;
    if (n === 0) {
        n = a.colRef - b.colRef;
    }
    return n;
}
function ttb_sort(a, b) {
    var n = 0;
    n = a.colRef - b.colRef;
    if (n === 0) {
        n = a.rowRef - b.rowRef;
    }
    return n;
}

},{"../misc/util":18}],22:[function(require,module,exports){
"use strict";
var shortid = require("shortid");
var DefaultCell = (function () {
    function DefaultCell(colRef, rowRef, ref, value) {
        if (ref === void 0) { ref = null; }
        if (value === void 0) { value = null; }
        this.colSpan = 1;
        this.rowSpan = 1;
        this.value = '';
        this.colRef = colRef;
        this.rowRef = rowRef;
        this.ref = ref || shortid.generate();
        this.value = value;
    }
    return DefaultCell;
}());
exports.DefaultCell = DefaultCell;

},{"shortid":41}],23:[function(require,module,exports){
"use strict";
var DefaultColumn = (function () {
    function DefaultColumn(ref, width) {
        if (width === void 0) { width = 100; }
        this.ref = ref;
        this.width = width;
    }
    return DefaultColumn;
}());
exports.DefaultColumn = DefaultColumn;

},{}],24:[function(require,module,exports){
"use strict";
var DefaultGrid = (function () {
    function DefaultGrid() {
        this.cells = [];
        this.columns = [];
        this.rows = [];
    }
    return DefaultGrid;
}());
exports.DefaultGrid = DefaultGrid;

},{}],25:[function(require,module,exports){
"use strict";
var DefaultRow = (function () {
    function DefaultRow(ref, height) {
        if (height === void 0) { height = 21; }
        this.ref = ref;
        this.height = height;
    }
    return DefaultRow;
}());
exports.DefaultRow = DefaultRow;

},{}],26:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DefaultCell_1 = require("../default/DefaultCell");
var Renderer_1 = require("../../ui/Renderer");
var FlexCell = (function (_super) {
    __extends(FlexCell, _super);
    function FlexCell() {
        return _super.apply(this, arguments) || this;
    }
    return FlexCell;
}(DefaultCell_1.DefaultCell));
FlexCell = __decorate([
    Renderer_1.renderer(draw),
    __metadata("design:paramtypes", [])
], FlexCell);
exports.FlexCell = FlexCell;
function draw(gfx, region, cell) {
    gfx.fillStyle = 'white';
    gfx.strokeStyle = 'lightgray';
    gfx.lineWidth = 1;
    var av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;
    gfx.fillRect(-av, -av, region.width, region.height);
    gfx.strokeRect(-av, -av, region.width, region.height);
    gfx.fillStyle = 'black';
    gfx.textBaseline = 'middle';
    gfx.font = '13px Segoe UI';
    gfx.fillText(cell.value, 3, 0 + (region.height / 2));
}

},{"../../ui/Renderer":31,"../default/DefaultCell":22}],27:[function(require,module,exports){
"use strict";
var DefaultGrid_1 = require("../default/DefaultGrid");
var FlexCell_1 = require("./FlexCell");
var FlexGridBuilder = (function () {
    function FlexGridBuilder(columns, rows) {
        this.columns = columns;
        this.rows = rows;
        this.createHeader = true;
        this.createMargin = true;
    }
    FlexGridBuilder.prototype.build = function () {
        console.time('FlexGridBuilder.build');
        var hori = this.columns + (this.createMargin ? 1 : 0);
        var vert = this.rows + (this.createHeader ? 1 : 0);
        var grid = new DefaultGrid_1.DefaultGrid();
        for (var c = 0; c < hori; c++) {
            for (var r = 0; r < vert; r++) {
                if ((this.createHeader || this.createMargin) && (c + r) == 0) {
                    grid.cells.push(new FlexCell_1.FlexCell(c, r, null, 'X'));
                }
                else if (this.createHeader && r == 0) {
                    grid.cells.push(new FlexCell_1.FlexCell(c, r, null, String.fromCharCode(64 + c)));
                }
                else if (this.createMargin && c == 0) {
                    grid.cells.push(new FlexCell_1.FlexCell(c, r, null, "" + r));
                }
                else {
                    grid.cells.push(new FlexCell_1.FlexCell(c, r, null, "Cell " + c + "x" + r));
                }
            }
        }
        console.timeEnd('FlexGridBuilder.build');
        return grid;
    };
    return FlexGridBuilder;
}());
exports.FlexGridBuilder = FlexGridBuilder;

},{"../default/DefaultGrid":24,"./FlexCell":26}],28:[function(require,module,exports){
"use strict";
/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs some task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
function command(name) {
    return function (ctor, key, descriptor) {
        var mdk = 'grid:commands';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            impl: descriptor.value,
        });
    };
}
exports.command = command;
;
/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
function routine(name) {
    return function (ctor, key, descriptor) {
        var routine = descriptor.value;
        var wrapper = function () {
            var kernel = (this['__kernel'] || this['kernel']);
            return kernel.routines.signal(key, Array.prototype.slice.call(arguments, 0), routine.bind(this));
        };
        return { value: wrapper };
    };
}
exports.routine = routine;
;
/**
 * A decorator that marks a field as a _variable_; a readable and optionally writable value that can be consumed by
 * modules.  A name for the variable can be optionally specified, otherwise the name of the field being exported
 * as the variable will be used.
 * @param name The optional variable name
 * @returns decorator
 */
function variable(name, mutable) {
    if (mutable === void 0) { mutable = true; }
    return function (ctor, key) {
        var mdk = 'grid:variables';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            mutable: mutable,
        });
        //let valStoreKey = !!name ? key : `__${key}`;
        //let useAltValueStore = !name;
        //
        //Object.defineProperty(ctor, name || key, {
        //    configurable: false,
        //    enumerable: true,
        //    get: function() { return this[valStoreKey]; },
        //    set: function(newVal) { this[valStoreKey] = newVal; }
        //});
    };
}
exports.variable = variable;
;

},{}],29:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GridKernel_1 = require("./GridKernel");
var DefaultGrid_1 = require("./../model/default/DefaultGrid");
var GridModelIndex_1 = require("./../model/GridModelIndex");
var DefaultCellVisual_1 = require("./internal/DefaultCellVisual");
var EventEmitter_1 = require("./internal/EventEmitter");
var GridLayout_1 = require("./internal/GridLayout");
var Property_1 = require("../misc/Property");
var Rect_1 = require("../geom/Rect");
var Point_1 = require("../geom/Point");
var GridElement = (function (_super) {
    __extends(GridElement, _super);
    function GridElement(canvas) {
        var _this = _super.call(this) || this;
        _this.canvas = canvas;
        _this.dirty = false;
        _this.buffers = {};
        _this.visuals = {};
        _this.root = canvas;
        var kernel = _this.kernel = new GridKernel_1.GridKernel(_this.emit.bind(_this));
        ['mousedown', 'mousemove', 'mouseup', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
            .forEach(function (x) { return _this.forwardMouseEvent(x); });
        ['keydown', 'keypress', 'keyup']
            .forEach(function (x) { return _this.forwardKeyEvent(x); });
        kernel.variables.define('width', { get: function () { return _this.width; } });
        kernel.variables.define('height', { get: function () { return _this.height; } });
        kernel.variables.define('modelIndex', { get: function () { return _this.modelIndex; } });
        return _this;
    }
    GridElement.create = function (target) {
        var canvas = target.ownerDocument.createElement('canvas');
        canvas.id = target.id;
        canvas.className = target.className = ' grid';
        canvas.tabIndex = 0;
        canvas.width = target.clientWidth;
        canvas.height = target.clientHeight;
        target.parentNode.insertBefore(canvas, target);
        target.remove();
        return new GridElement(canvas);
    };
    Object.defineProperty(GridElement.prototype, "width", {
        get: function () {
            return this.root.clientWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "height", {
        get: function () {
            return this.root.clientHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "virtualWidth", {
        get: function () {
            return this.layout.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "virtualHeight", {
        get: function () {
            return this.layout.height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "scroll", {
        get: function () {
            return new Point_1.Point(this.scrollLeft, this.scrollTop);
        },
        enumerable: true,
        configurable: true
    });
    GridElement.prototype.extend = function (ext) {
        this.kernel.install(ext);
        if (ext.init) {
            ext.init(this, this.kernel);
        }
        return this;
    };
    GridElement.prototype.focus = function () {
        this.root.focus();
    };
    GridElement.prototype.scrollTo = function (ptOrRect) {
        var dest = ptOrRect;
        if (dest.width === undefined && dest.height === undefined) {
            dest = new Rect_1.Rect(dest.x, dest.y, 1, 1);
        }
        if (dest.left < 0) {
            this.scrollLeft += dest.left;
        }
        if (dest.right > this.width) {
            this.scrollLeft += dest.right - this.width;
        }
        if (dest.top < 0) {
            this.scrollTop += dest.top;
        }
        if (dest.bottom > this.height) {
            this.scrollTop += dest.bottom - this.height;
        }
    };
    GridElement.prototype.getCellAtGridPoint = function (pt) {
        var refs = this.layout.captureCells(new Rect_1.Rect(pt.x, pt.y, 1, 1));
        if (refs.length) {
            return this.modelIndex.findCell(refs[0]);
        }
        return null;
    };
    GridElement.prototype.getCellAtViewPoint = function (pt) {
        var viewport = this.computeViewport();
        var gpt = Point_1.Point.create(pt).add(viewport.topLeft());
        return this.getCellAtGridPoint(gpt);
    };
    GridElement.prototype.getCellsInGridRect = function (rect) {
        var _this = this;
        var refs = this.layout.captureCells(rect);
        return refs.map(function (x) { return _this.modelIndex.findCell(x); });
    };
    GridElement.prototype.getCellsInViewRect = function (rect) {
        var viewport = this.computeViewport();
        var grt = Rect_1.Rect.fromLike(rect).offset(viewport.topLeft());
        return this.getCellsInGridRect(grt);
    };
    GridElement.prototype.getCellGridRect = function (ref) {
        var region = this.layout.queryCell(ref);
        return !!region ? Rect_1.Rect.fromLike(region) : null;
    };
    GridElement.prototype.getCellViewRect = function (ref) {
        var rect = this.getCellGridRect(ref);
        if (rect) {
            rect = rect.offset(this.scroll.inverse());
        }
        return rect;
    };
    GridElement.prototype.invalidate = function () {
        this.buffers = {};
        this.modelIndex = new GridModelIndex_1.GridModelIndex(this.model);
        this.layout = GridLayout_1.GridLayout.compute(this.model);
        this.redraw();
        this.emit('invalidate');
    };
    GridElement.prototype.redraw = function () {
        if (!this.dirty) {
            this.dirty = true;
            requestAnimationFrame(this.draw.bind(this));
        }
    };
    GridElement.prototype.draw = function () {
        this.updateVisuals();
        this.drawVisuals();
        this.dirty = false;
        this.emit('draw');
    };
    GridElement.prototype.computeViewport = function () {
        return new Rect_1.Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
    };
    GridElement.prototype.updateVisuals = function () {
        console.time('GridElement.updateVisuals');
        var viewport = this.computeViewport();
        var visibleCells = this.layout.captureCells(viewport);
        var visuals = {};
        var apply = function (visual, region) {
            visual.left = region.left;
            visual.top = region.top;
            visual.width = region.width;
            visual.height = region.height;
            return visual;
        };
        for (var _i = 0, visibleCells_1 = visibleCells; _i < visibleCells_1.length; _i++) {
            var vcr = visibleCells_1[_i];
            var region = this.layout.queryCell(vcr);
            //If visual already exists, update and add existing
            if (this.visuals[vcr]) {
                visuals[vcr] = apply(this.visuals[vcr], region);
            }
            else {
                visuals[vcr] = apply(this.createVisual(), region);
            }
        }
        console.timeEnd('GridElement.updateVisuals');
        this.visuals = visuals;
    };
    GridElement.prototype.drawVisuals = function () {
        console.time('GridElement.drawVisuals');
        var viewport = this.computeViewport();
        var gfx = this.canvas.getContext('2d', { alpha: true });
        gfx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        gfx.save();
        gfx.translate(viewport.left * -1, viewport.top * -1);
        for (var cr in this.visuals) {
            var cell = this.modelIndex.findCell(cr);
            var visual = this.visuals[cr];
            if (!viewport.intersects(visual)) {
                continue;
            }
            var buffer = this.buffers[cell.ref];
            if (!buffer) {
                buffer = this.buffers[cell.ref] = this.createBuffer(visual.width, visual.height);
                //noinspection TypeScriptUnresolvedFunction
                var renderer = Reflect.getMetadata('custom:renderer', cell.constructor);
                renderer(buffer.gfx, visual, cell);
            }
            gfx.drawImage(buffer.canvas, visual.left - buffer.inflation, visual.top - buffer.inflation);
        }
        gfx.restore();
        console.timeEnd('GridElement.drawVisuals');
    };
    GridElement.prototype.createBuffer = function (width, height) {
        return new Buffer(width, height, 25);
    };
    GridElement.prototype.createVisual = function () {
        return new DefaultCellVisual_1.DefaultCellVisual();
    };
    GridElement.prototype.forwardMouseEvent = function (event) {
        var _this = this;
        this.canvas.addEventListener(event, function (ne) {
            var pt = new Point_1.Point(ne.offsetX, ne.offsetY);
            var cell = _this.getCellAtViewPoint(pt);
            var ge = ne;
            ge.cell = cell || null;
            ge.gridX = pt.x;
            ge.gridY = pt.y;
            _this.emit(event, ge);
        });
    };
    GridElement.prototype.forwardKeyEvent = function (event) {
        var _this = this;
        this.canvas.addEventListener(event, function (ne) {
            _this.emit(event, ne);
        });
    };
    return GridElement;
}(EventEmitter_1.EventEmitterBase));
__decorate([
    Property_1.property(new DefaultGrid_1.DefaultGrid(), function (t) { return t.invalidate(); }),
    __metadata("design:type", Object)
], GridElement.prototype, "model", void 0);
__decorate([
    Property_1.property(0, function (t) { t.redraw(); t.emit('scroll'); }),
    __metadata("design:type", Number)
], GridElement.prototype, "scrollLeft", void 0);
__decorate([
    Property_1.property(0, function (t) { t.redraw(); t.emit('scroll'); }),
    __metadata("design:type", Number)
], GridElement.prototype, "scrollTop", void 0);
exports.GridElement = GridElement;
var Buffer = (function () {
    function Buffer(width, height, inflation) {
        this.width = width;
        this.height = height;
        this.inflation = inflation;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width + (inflation * 2);
        this.canvas.height = height + (inflation * 2);
        this.gfx = this.canvas.getContext('2d');
        this.gfx.translate(inflation, inflation);
    }
    return Buffer;
}());

},{"../geom/Point":6,"../geom/Rect":7,"../misc/Property":16,"./../model/GridModelIndex":19,"./../model/default/DefaultGrid":24,"./GridKernel":30,"./internal/DefaultCellVisual":33,"./internal/EventEmitter":34,"./internal/GridLayout":35}],30:[function(require,module,exports){
"use strict";
/**
 * Implements the core of the Grid extensibility system.
 */
var GridKernel = (function () {
    function GridKernel(emitter) {
        this.emitter = emitter;
        this.commands = new GridKernelCommandHubImpl();
        this.routines = new GridKernelRoutineHubImpl();
        this.variables = new GridKernelVariableHubImpl();
    }
    GridKernel.prototype.install = function (ext) {
        var _a = this, commands = _a.commands, variables = _a.variables;
        if (ext['__kernel']) {
            throw 'Extension appears to have already been installed into this or another grid...?';
        }
        ext['__kernel'] = this;
        var cmds = Reflect.getMetadata('grid:commands', ext) || [];
        for (var _i = 0, cmds_1 = cmds; _i < cmds_1.length; _i++) {
            var c = cmds_1[_i];
            commands.define(c.name, c.impl.bind(ext));
        }
        var vars = Reflect.getMetadata('grid:variables', ext) || [];
        var _loop_1 = function (v) {
            variables.define(v.name, {
                get: (function () { return this[v.key]; }).bind(ext),
                set: !!v.mutable ? (function (val) { this[v.key] = val; }).bind(ext) : undefined,
            });
        };
        for (var _b = 0, vars_1 = vars; _b < vars_1.length; _b++) {
            var v = vars_1[_b];
            _loop_1(v);
        }
    };
    return GridKernel;
}());
exports.GridKernel = GridKernel;
var GridKernelCommandHubImpl = (function () {
    function GridKernelCommandHubImpl() {
        this.store = {};
    }
    /**
     * Defines the specified command for extensions or consumers to use.
     */
    GridKernelCommandHubImpl.prototype.define = function (command, impl) {
        if (this.store[command]) {
            throw 'Command with name already registered: ' + command;
        }
        this.store[command] = impl;
    };
    /**
     * Executes the specified grid command.
     */
    GridKernelCommandHubImpl.prototype.exec = function (command) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var impl = this.store[command];
        if (impl) {
            impl.apply(this, args);
        }
        else {
            throw 'Unrecognized command: ' + command;
        }
    };
    return GridKernelCommandHubImpl;
}());
var GridKernelRoutineHubImpl = (function () {
    function GridKernelRoutineHubImpl() {
        this.hooks = {};
        this.overrides = {};
    }
    /**
     * Adds a hook to the specified signal that enables extensions to override grid behavior
     * defined in the core or other extensions.
     */
    GridKernelRoutineHubImpl.prototype.hook = function (routine, callback) {
        var list = this.hooks[routine] || (this.hooks[routine] = []);
        list.push(callback);
    };
    GridKernelRoutineHubImpl.prototype.override = function (routine, callback) {
        this.overrides[routine] = callback;
    };
    /**
     * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
     * should be supporting data or relevant objects to the routine.  The value returned will be `true`
     * if the routine has been overridden by an extension.
     */
    GridKernelRoutineHubImpl.prototype.signal = function (routine, args, impl) {
        this.invokeHooks("before:" + routine, args);
        if (!!this.overrides[routine]) {
            args.push(impl);
            impl = this.overrides[routine];
        }
        var result = impl.apply(this, args);
        this.invokeHooks(routine, args);
        this.invokeHooks("after:" + routine, args);
        return result;
    };
    GridKernelRoutineHubImpl.prototype.invokeHooks = function (routine, args) {
        var list = this.hooks[routine];
        if (list) {
            for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
                var hook = list_1[_i];
                hook.apply(this, args);
            }
        }
    };
    return GridKernelRoutineHubImpl;
}());
var GridKernelVariableHubImpl = (function () {
    function GridKernelVariableHubImpl() {
        this.store = {};
    }
    /**
     * Defines the specified variable for extensions or consumers to use.
     */
    GridKernelVariableHubImpl.prototype.define = function (variable, impl) {
        if (this.store[variable]) {
            throw 'Variable with name already registered: ' + variable;
        }
        this.store[variable] = impl;
    };
    /**
     * Gets the value of the specified variable.
     */
    GridKernelVariableHubImpl.prototype.get = function (variable) {
        var impl = this.store[variable];
        if (impl) {
            return impl.get();
        }
        throw 'Unrecognized variable: ' + variable;
    };
    /**
     * Sets the value of the specified variable.
     */
    GridKernelVariableHubImpl.prototype.set = function (variable, value) {
        var impl = this.store[variable];
        if (impl) {
            if (impl.set) {
                impl.set(value);
            }
            else {
                throw 'Cannot set readonly variable: ' + variable;
            }
        }
        else {
            throw 'Unrecognized variable: ' + variable;
        }
    };
    return GridKernelVariableHubImpl;
}());

},{}],31:[function(require,module,exports){
"use strict";
function renderer(func) {
    return function (ctor) {
        //noinspection TypeScriptUnresolvedFunction
        Reflect.defineMetadata('custom:renderer', func, ctor);
    };
}
exports.renderer = renderer;

},{}],32:[function(require,module,exports){
"use strict";
var Rect_1 = require("../geom/Rect");
var Dom = require("../misc/Dom");
/**
 * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
 * absolutely positioned root elements.
 */
var AbsWidgetBase = (function () {
    function AbsWidgetBase(root) {
        this.root = root;
    }
    Object.defineProperty(AbsWidgetBase.prototype, "viewRect", {
        /**
         * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
         */
        get: function () {
            return new Rect_1.Rect(parseInt(this.root.style.left), parseInt(this.root.style.top), this.root.clientWidth, this.root.clientHeight);
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Moves the Widget to the specified position relative to the viewport of the grid.
     *
     * @param viewRect
     * @param animate
     */
    AbsWidgetBase.prototype.goto = function (viewRect, autoShow) {
        if (autoShow === void 0) { autoShow = true; }
        if (autoShow) {
            Dom.show(this.root);
        }
        Dom.css(this.root, {
            left: viewRect.left - 1 + "px",
            top: viewRect.top - 1 + "px",
            width: viewRect.width + 1 + "px",
            height: viewRect.height + 1 + "px",
            overflow: "hidden",
        });
    };
    /**
     * Hides the whole widget.
     */
    AbsWidgetBase.prototype.hide = function () {
        Dom.hide(this.root);
    };
    /**
     * Shows the whole widget.
     */
    AbsWidgetBase.prototype.show = function () {
        Dom.show(this.root);
    };
    /**
     * Toggles the visibility of the whole widget.
     *
     * @param visible
     */
    AbsWidgetBase.prototype.toggle = function (visible) {
        Dom.toggle(this.root, visible);
    };
    return AbsWidgetBase;
}());
exports.AbsWidgetBase = AbsWidgetBase;

},{"../geom/Rect":7,"../misc/Dom":15}],33:[function(require,module,exports){
"use strict";
var DefaultCellVisual = (function () {
    function DefaultCellVisual(left, top, width, height) {
        if (left === void 0) { left = 0; }
        if (top === void 0) { top = 0; }
        if (width === void 0) { width = 0; }
        if (height === void 0) { height = 0; }
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }
    DefaultCellVisual.prototype.draw = function (gfx, model) {
        gfx.strokeStyle = 'black';
        gfx.strokeRect(this.left, this.top, this.width, this.height);
    };
    return DefaultCellVisual;
}());
exports.DefaultCellVisual = DefaultCellVisual;

},{}],34:[function(require,module,exports){
"use strict";
var EventEmitterBase = (function () {
    function EventEmitterBase() {
        this.buckets = {};
    }
    EventEmitterBase.prototype.on = function (event, callback) {
        var _this = this;
        this.getCallbackList(event).push(callback);
        return { cancel: function () { return _this.off(event, callback); } };
    };
    EventEmitterBase.prototype.off = function (event, callback) {
        var list = this.getCallbackList(event);
        var idx = list.indexOf(callback);
        if (idx >= 0) {
            list.splice(idx, 1);
        }
    };
    EventEmitterBase.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var list = this.getCallbackList(event);
        for (var _a = 0, list_1 = list; _a < list_1.length; _a++) {
            var callback = list_1[_a];
            callback.apply(null, args);
        }
    };
    EventEmitterBase.prototype.getCallbackList = function (event) {
        return this.buckets[event] || (this.buckets[event] = []);
    };
    return EventEmitterBase;
}());
exports.EventEmitterBase = EventEmitterBase;

},{}],35:[function(require,module,exports){
"use strict";
var DefaultColumn_1 = require("../../model/default/DefaultColumn");
var DefaultRow_1 = require("../../model/default/DefaultRow");
var Rect_1 = require("../../geom/Rect");
var _ = require("../../misc/Util");
var GridLayout = (function () {
    function GridLayout(width, height, columns, rows, cells, cellLookup) {
        this.width = width;
        this.height = height;
        this.columns = columns;
        this.rows = rows;
        this.cells = cells;
        this.cellLookup = cellLookup;
        this.columnIndex = _.index(columns, function (x) { return x.ref; });
        this.rowIndex = _.index(rows, function (x) { return x.ref; });
        this.cellIndex = _.index(cells, function (x) { return x.ref; });
    }
    GridLayout.compute = function (model) {
        var colLookup = model.columns.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var rowLookup = model.rows.reduce(function (t, x) { t[x.ref] = x; return t; }, {});
        var cellLookup = buildCellLookup(model.cells); //by col then row
        // Compute all expected columns and rows
        var maxCol = model.cells.map(function (x) { return x.colRef + (x.colSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        var maxRow = model.cells.map(function (x) { return x.rowRef + (x.rowSpan - 1); }).reduce(function (t, x) { return t > x ? t : x; }, 0);
        // Generate missing columns and rows
        for (var i = 0; i <= maxCol; i++) {
            (colLookup[i] || (colLookup[i] = new DefaultColumn_1.DefaultColumn(i)));
        }
        for (var i = 0; i <= maxRow; i++) {
            (rowLookup[i] || (rowLookup[i] = new DefaultRow_1.DefaultRow(i)));
        }
        // Compute width and height of whole grid
        var width = _.values(colLookup).reduce(function (t, x) { return t + x.width; }, 0);
        var height = _.values(rowLookup).reduce(function (t, x) { return t + x.height; }, 0);
        // Compute the layout regions for the various bits
        var colRegs = [];
        var rowRegs = [];
        var cellRegs = [];
        var accLeft = 0;
        for (var ci = 0; ci <= maxCol; ci++) {
            var col = colLookup[ci];
            colRegs.push({
                ref: col.ref,
                left: accLeft,
                top: 0,
                width: col.width,
                height: height,
            });
            var accTop = 0;
            for (var ri = 0; ri <= maxRow; ri++) {
                var row = rowLookup[ri];
                if (ci === 0) {
                    rowRegs.push({
                        ref: row.ref,
                        left: 0,
                        top: accTop,
                        width: width,
                        height: row.height,
                    });
                }
                if (cellLookup[ci] !== undefined && cellLookup[ci][ri] !== undefined) {
                    var cell = cellLookup[ci][ri];
                    cellRegs.push({
                        ref: cell.ref,
                        left: accLeft,
                        top: accTop,
                        width: col.width,
                        height: row.height,
                    });
                }
                accTop += row.height;
            }
            accLeft += col.width;
        }
        return new GridLayout(width, height, colRegs, rowRegs, cellRegs, cellLookup);
    };
    GridLayout.prototype.queryColumn = function (ref) {
        return this.columnIndex[ref] || null;
    };
    GridLayout.prototype.queryRow = function (ref) {
        return this.rowIndex[ref] || null;
    };
    GridLayout.prototype.queryCell = function (ref) {
        return this.cellIndex[ref] || null;
    };
    GridLayout.prototype.captureColumns = function (region) {
        return this.columns
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.ref; });
    };
    GridLayout.prototype.captureRows = function (region) {
        return this.rows
            .filter(function (x) { return Rect_1.Rect.prototype.intersects.call(x, region); })
            .map(function (x) { return x.ref; });
    };
    GridLayout.prototype.captureCells = function (region) {
        var cols = this.captureColumns(region);
        var rows = this.captureRows(region);
        var cells = new Array();
        for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
            var c = cols_1[_i];
            for (var _a = 0, rows_1 = rows; _a < rows_1.length; _a++) {
                var r = rows_1[_a];
                var cell = this.cellLookup[c][r];
                if (!!cell) {
                    cells.push(cell.ref);
                }
            }
        }
        return cells;
    };
    return GridLayout;
}());
exports.GridLayout = GridLayout;
function buildCellLookup(cells) {
    var ix = {};
    for (var _i = 0, cells_1 = cells; _i < cells_1.length; _i++) {
        var c = cells_1[_i];
        var cix = ix[c.colRef] || (ix[c.colRef] = {});
        cix[c.rowRef] = c;
    }
    return ix;
}

},{"../../geom/Rect":7,"../../misc/Util":17,"../../model/default/DefaultColumn":23,"../../model/default/DefaultRow":25}],36:[function(require,module,exports){
/**
 * Embedding of Clipboard.js - https://github.com/zenorocha/clipboard.js/
 *
 * After various attempts, I was unable to npm install including types effectively and because an index.js is not
 * used I cannot use the TypeScript 2.1 unknown module import, so resorting to local embedded version.  Will remove
 * in the future if possible.
 *
 * Modifications have been made to make the code compile:
 * - Removed Promise polyfill (imported instead)
 * - Restructured export and added typed interface
 * - Some changes to prevent type checking where undesired
 */
"use strict";
var es6_promise_1 = require("es6-promise");
//Declare window as an any var alias to prevent TS moaning...
var wnd = window;
var clipboard = {};
clipboard.copy = (function () {
    var _intercept = false;
    var _data = null; // Map from data type (e.g. "text/html") to value.
    var _bogusSelection = false;
    function cleanup() {
        _intercept = false;
        _data = null;
        if (_bogusSelection) {
            window.getSelection().removeAllRanges();
        }
        _bogusSelection = false;
    }
    document.addEventListener("copy", function (e) {
        if (_intercept) {
            for (var key in _data) {
                e.clipboardData.setData(key, _data[key]);
            }
            e.preventDefault();
        }
    });
    // Workaround for Safari: https://bugs.webkit.org/show_bug.cgi?id=156529
    function bogusSelect() {
        var sel = document.getSelection();
        // If "nothing" is selected...
        if (!document.queryCommandEnabled("copy") && sel.isCollapsed) {
            // ... temporarily select the entire body.
            //
            // We select the entire body because:
            // - it's guaranteed to exist,
            // - it works (unlike, say, document.head, or phantom element that is
            //   not inserted into the DOM),
            // - it doesn't seem to flicker (due to the synchronous copy event), and
            // - it avoids modifying the DOM (can trigger mutation observers).
            //
            // Because we can't do proper feature detection (we already checked
            // document.queryCommandEnabled("copy") , which actually gives a false
            // negative for Blink when nothing is selected) and UA sniffing is not
            // reliable (a lot of UA strings contain "Safari"), this will also
            // happen for some browsers other than Safari. :-()
            var range = document.createRange();
            range.selectNodeContents(document.body);
            sel.addRange(range);
            _bogusSelection = true;
        }
    }
    ;
    return function (data) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            _intercept = true;
            if (typeof data === "string") {
                _data = { "text/plain": data };
            }
            else if (data instanceof Node) {
                _data = { "text/html": new XMLSerializer().serializeToString(data) };
            }
            else {
                _data = data;
            }
            try {
                bogusSelect();
                if (document.execCommand("copy")) {
                    // document.execCommand is synchronous: http://www.w3.org/TR/2015/WD-clipboard-apis-20150421/#integration-with-rich-text-editing-apis
                    // So we can call resolve() back here.
                    cleanup();
                    resolve();
                }
                else {
                    throw new Error("Unable to copy. Perhaps it's not available in your browser?");
                }
            }
            catch (e) {
                cleanup();
                reject(e);
            }
        });
    };
})();
clipboard.paste = (function () {
    var _intercept = false;
    var _resolve;
    var _dataType;
    document.addEventListener("paste", function (e) {
        if (_intercept) {
            _intercept = false;
            e.preventDefault();
            var resolve = _resolve;
            _resolve = null;
            resolve(e.clipboardData.getData(_dataType));
        }
    });
    return function (dataType) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            _intercept = true;
            _resolve = resolve;
            _dataType = dataType || "text/plain";
            try {
                if (!document.execCommand("paste")) {
                    _intercept = false;
                    reject(new Error("Unable to paste. Pasting only works in Internet Explorer at the moment."));
                }
            }
            catch (e) {
                _intercept = false;
                reject(new Error(e));
            }
        });
    };
})();
// Handle IE behaviour.
if (typeof ClipboardEvent === "undefined" &&
    typeof wnd.clipboardData !== "undefined" &&
    typeof wnd.clipboardData.setData !== "undefined") {
    clipboard.copy = function (data) {
        return new es6_promise_1.Promise(function (resolve, reject) {
            // IE supports string and URL types: https://msdn.microsoft.com/en-us/library/ms536744(v=vs.85).aspx
            // We only support the string type for now.
            if (typeof data !== "string" && !("text/plain" in data)) {
                throw new Error("You must provide a text/plain type.");
            }
            var strData = (typeof data === "string" ? data : data["text/plain"]);
            var copySucceeded = wnd.clipboardData.setData("Text", strData);
            if (copySucceeded) {
                resolve();
            }
            else {
                reject(new Error("Copying was rejected."));
            }
        });
    };
    clipboard.paste = function () {
        return new es6_promise_1.Promise(function (resolve, reject) {
            var strData = wnd.clipboardData.getData("Text");
            if (strData) {
                resolve(strData);
            }
            else {
                // The user rejected the paste request.
                reject(new Error("Pasting was rejected."));
            }
        });
    };
}
exports.Clipboard = clipboard;

},{"es6-promise":37}],37:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   4.0.5
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  if (typeof vertxNext !== 'undefined') {
    return function () {
      vertxNext(flush);
    };
  }

  return useSetTimeout();
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":39}],38:[function(require,module,exports){
/*!
	Papa Parse
	v4.1.2
	https://github.com/mholt/PapaParse
*/
(function(global)
{
	"use strict";

	var IS_WORKER = !global.document && !!global.postMessage,
		IS_PAPA_WORKER = IS_WORKER && /(\?|&)papaworker(=|&|$)/.test(global.location.search),
		LOADED_SYNC = false, AUTO_SCRIPT_PATH;
	var workers = {}, workerIdCounter = 0;

	var Papa = {};

	Papa.parse = CsvToJson;
	Papa.unparse = JsonToCsv;

	Papa.RECORD_SEP = String.fromCharCode(30);
	Papa.UNIT_SEP = String.fromCharCode(31);
	Papa.BYTE_ORDER_MARK = "\ufeff";
	Papa.BAD_DELIMITERS = ["\r", "\n", "\"", Papa.BYTE_ORDER_MARK];
	Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
	Papa.SCRIPT_PATH = null;	// Must be set by your code if you use workers and this lib is loaded asynchronously

	// Configurable chunk sizes for local and remote files, respectively
	Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
	Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
	Papa.DefaultDelimiter = ",";			// Used if not specified and detection fails

	// Exposed for testing and development only
	Papa.Parser = Parser;
	Papa.ParserHandle = ParserHandle;
	Papa.NetworkStreamer = NetworkStreamer;
	Papa.FileStreamer = FileStreamer;
	Papa.StringStreamer = StringStreamer;

	if (typeof module !== 'undefined' && module.exports)
	{
		// Export to Node...
		module.exports = Papa;
	}
	else if (isFunction(global.define) && global.define.amd)
	{
		// Wireup with RequireJS
		define(function() { return Papa; });
	}
	else
	{
		// ...or as browser global
		global.Papa = Papa;
	}

	if (global.jQuery)
	{
		var $ = global.jQuery;
		$.fn.parse = function(options)
		{
			var config = options.config || {};
			var queue = [];

			this.each(function(idx)
			{
				var supported = $(this).prop('tagName').toUpperCase() == "INPUT"
								&& $(this).attr('type').toLowerCase() == "file"
								&& global.FileReader;

				if (!supported || !this.files || this.files.length == 0)
					return true;	// continue to next input element

				for (var i = 0; i < this.files.length; i++)
				{
					queue.push({
						file: this.files[i],
						inputElem: this,
						instanceConfig: $.extend({}, config)
					});
				}
			});

			parseNextFile();	// begin parsing
			return this;		// maintains chainability


			function parseNextFile()
			{
				if (queue.length == 0)
				{
					if (isFunction(options.complete))
						options.complete();
					return;
				}

				var f = queue[0];

				if (isFunction(options.before))
				{
					var returned = options.before(f.file, f.inputElem);

					if (typeof returned === 'object')
					{
						if (returned.action == "abort")
						{
							error("AbortError", f.file, f.inputElem, returned.reason);
							return;	// Aborts all queued files immediately
						}
						else if (returned.action == "skip")
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
						else if (typeof returned.config === 'object')
							f.instanceConfig = $.extend(f.instanceConfig, returned.config);
					}
					else if (returned == "skip")
					{
						fileComplete();	// parse the next file in the queue, if any
						return;
					}
				}

				// Wrap up the user's complete callback, if any, so that ours also gets executed
				var userCompleteFunc = f.instanceConfig.complete;
				f.instanceConfig.complete = function(results)
				{
					if (isFunction(userCompleteFunc))
						userCompleteFunc(results, f.file, f.inputElem);
					fileComplete();
				};

				Papa.parse(f.file, f.instanceConfig);
			}

			function error(name, file, elem, reason)
			{
				if (isFunction(options.error))
					options.error({name: name}, file, elem, reason);
			}

			function fileComplete()
			{
				queue.splice(0, 1);
				parseNextFile();
			}
		}
	}


	if (IS_PAPA_WORKER)
	{
		global.onmessage = workerThreadReceivedMessage;
	}
	else if (Papa.WORKERS_SUPPORTED)
	{
		AUTO_SCRIPT_PATH = getScriptPath();

		// Check if the script was loaded synchronously
		if (!document.body)
		{
			// Body doesn't exist yet, must be synchronous
			LOADED_SYNC = true;
		}
		else
		{
			document.addEventListener('DOMContentLoaded', function () {
				LOADED_SYNC = true;
			}, true);
		}
	}




	function CsvToJson(_input, _config)
	{
		_config = _config || {};

		if (_config.worker && Papa.WORKERS_SUPPORTED)
		{
			var w = newWorker();

			w.userStep = _config.step;
			w.userChunk = _config.chunk;
			w.userComplete = _config.complete;
			w.userError = _config.error;

			_config.step = isFunction(_config.step);
			_config.chunk = isFunction(_config.chunk);
			_config.complete = isFunction(_config.complete);
			_config.error = isFunction(_config.error);
			delete _config.worker;	// prevent infinite loop

			w.postMessage({
				input: _input,
				config: _config,
				workerId: w.id
			});

			return;
		}

		var streamer = null;
		if (typeof _input === 'string')
		{
			if (_config.download)
				streamer = new NetworkStreamer(_config);
			else
				streamer = new StringStreamer(_config);
		}
		else if ((global.File && _input instanceof File) || _input instanceof Object)	// ...Safari. (see issue #106)
			streamer = new FileStreamer(_config);

		return streamer.stream(_input);
	}






	function JsonToCsv(_input, _config)
	{
		var _output = "";
		var _fields = [];

		// Default configuration

		/** whether to surround every datum with quotes */
		var _quotes = false;

		/** delimiting character */
		var _delimiter = ",";

		/** newline character(s) */
		var _newline = "\r\n";

		unpackConfig();

		if (typeof _input === 'string')
			_input = JSON.parse(_input);

		if (_input instanceof Array)
		{
			if (!_input.length || _input[0] instanceof Array)
				return serialize(null, _input);
			else if (typeof _input[0] === 'object')
				return serialize(objectKeys(_input[0]), _input);
		}
		else if (typeof _input === 'object')
		{
			if (typeof _input.data === 'string')
				_input.data = JSON.parse(_input.data);

			if (_input.data instanceof Array)
			{
				if (!_input.fields)
					_input.fields = _input.data[0] instanceof Array
									? _input.fields
									: objectKeys(_input.data[0]);

				if (!(_input.data[0] instanceof Array) && typeof _input.data[0] !== 'object')
					_input.data = [_input.data];	// handles input like [1,2,3] or ["asdf"]
			}

			return serialize(_input.fields || [], _input.data || []);
		}

		// Default (any valid paths should return before this)
		throw "exception: Unable to serialize unrecognized input";


		function unpackConfig()
		{
			if (typeof _config !== 'object')
				return;

			if (typeof _config.delimiter === 'string'
				&& _config.delimiter.length == 1
				&& Papa.BAD_DELIMITERS.indexOf(_config.delimiter) == -1)
			{
				_delimiter = _config.delimiter;
			}

			if (typeof _config.quotes === 'boolean'
				|| _config.quotes instanceof Array)
				_quotes = _config.quotes;

			if (typeof _config.newline === 'string')
				_newline = _config.newline;
		}


		/** Turns an object's keys into an array */
		function objectKeys(obj)
		{
			if (typeof obj !== 'object')
				return [];
			var keys = [];
			for (var key in obj)
				keys.push(key);
			return keys;
		}

		/** The double for loop that iterates the data and writes out a CSV string including header row */
		function serialize(fields, data)
		{
			var csv = "";

			if (typeof fields === 'string')
				fields = JSON.parse(fields);
			if (typeof data === 'string')
				data = JSON.parse(data);

			var hasHeader = fields instanceof Array && fields.length > 0;
			var dataKeyedByField = !(data[0] instanceof Array);

			// If there a header row, write it first
			if (hasHeader)
			{
				for (var i = 0; i < fields.length; i++)
				{
					if (i > 0)
						csv += _delimiter;
					csv += safe(fields[i], i);
				}
				if (data.length > 0)
					csv += _newline;
			}

			// Then write out the data
			for (var row = 0; row < data.length; row++)
			{
				var maxCol = hasHeader ? fields.length : data[row].length;

				for (var col = 0; col < maxCol; col++)
				{
					if (col > 0)
						csv += _delimiter;
					var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
					csv += safe(data[row][colIdx], col);
				}

				if (row < data.length - 1)
					csv += _newline;
			}

			return csv;
		}

		/** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
		function safe(str, col)
		{
			if (typeof str === "undefined" || str === null)
				return "";

			str = str.toString().replace(/"/g, '""');

			var needsQuotes = (typeof _quotes === 'boolean' && _quotes)
							|| (_quotes instanceof Array && _quotes[col])
							|| hasAny(str, Papa.BAD_DELIMITERS)
							|| str.indexOf(_delimiter) > -1
							|| str.charAt(0) == ' '
							|| str.charAt(str.length - 1) == ' ';

			return needsQuotes ? '"' + str + '"' : str;
		}

		function hasAny(str, substrings)
		{
			for (var i = 0; i < substrings.length; i++)
				if (str.indexOf(substrings[i]) > -1)
					return true;
			return false;
		}
	}

	/** ChunkStreamer is the base prototype for various streamer implementations. */
	function ChunkStreamer(config)
	{
		this._handle = null;
		this._paused = false;
		this._finished = false;
		this._input = null;
		this._baseIndex = 0;
		this._partialLine = "";
		this._rowCount = 0;
		this._start = 0;
		this._nextChunk = null;
		this.isFirstChunk = true;
		this._completeResults = {
			data: [],
			errors: [],
			meta: {}
		};
		replaceConfig.call(this, config);

		this.parseChunk = function(chunk)
		{
			// First chunk pre-processing
			if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk))
			{
				var modifiedChunk = this._config.beforeFirstChunk(chunk);
				if (modifiedChunk !== undefined)
					chunk = modifiedChunk;
			}
			this.isFirstChunk = false;

			// Rejoin the line we likely just split in two by chunking the file
			var aggregate = this._partialLine + chunk;
			this._partialLine = "";

			var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);
			
			if (this._handle.paused() || this._handle.aborted())
				return;
			
			var lastIndex = results.meta.cursor;
			
			if (!this._finished)
			{
				this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
				this._baseIndex = lastIndex;
			}

			if (results && results.data)
				this._rowCount += results.data.length;

			var finishedIncludingPreview = this._finished || (this._config.preview && this._rowCount >= this._config.preview);

			if (IS_PAPA_WORKER)
			{
				global.postMessage({
					results: results,
					workerId: Papa.WORKER_ID,
					finished: finishedIncludingPreview
				});
			}
			else if (isFunction(this._config.chunk))
			{
				this._config.chunk(results, this._handle);
				if (this._paused)
					return;
				results = undefined;
				this._completeResults = undefined;
			}

			if (!this._config.step && !this._config.chunk) {
				this._completeResults.data = this._completeResults.data.concat(results.data);
				this._completeResults.errors = this._completeResults.errors.concat(results.errors);
				this._completeResults.meta = results.meta;
			}

			if (finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted))
				this._config.complete(this._completeResults);

			if (!finishedIncludingPreview && (!results || !results.meta.paused))
				this._nextChunk();

			return results;
		};

		this._sendError = function(error)
		{
			if (isFunction(this._config.error))
				this._config.error(error);
			else if (IS_PAPA_WORKER && this._config.error)
			{
				global.postMessage({
					workerId: Papa.WORKER_ID,
					error: error,
					finished: false
				});
			}
		};

		function replaceConfig(config)
		{
			// Deep-copy the config so we can edit it
			var configCopy = copy(config);
			configCopy.chunkSize = parseInt(configCopy.chunkSize);	// parseInt VERY important so we don't concatenate strings!
			if (!config.step && !config.chunk)
				configCopy.chunkSize = null;  // disable Range header if not streaming; bad values break IIS - see issue #196
			this._handle = new ParserHandle(configCopy);
			this._handle.streamer = this;
			this._config = configCopy;	// persist the copy to the caller
		}
	}


	function NetworkStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.RemoteChunkSize;
		ChunkStreamer.call(this, config);

		var xhr;

		if (IS_WORKER)
		{
			this._nextChunk = function()
			{
				this._readChunk();
				this._chunkLoaded();
			};
		}
		else
		{
			this._nextChunk = function()
			{
				this._readChunk();
			};
		}

		this.stream = function(url)
		{
			this._input = url;
			this._nextChunk();	// Starts streaming
		};

		this._readChunk = function()
		{
			if (this._finished)
			{
				this._chunkLoaded();
				return;
			}

			xhr = new XMLHttpRequest();
			
			if (!IS_WORKER)
			{
				xhr.onload = bindFunction(this._chunkLoaded, this);
				xhr.onerror = bindFunction(this._chunkError, this);
			}

			xhr.open("GET", this._input, !IS_WORKER);
			
			if (this._config.chunkSize)
			{
				var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
				xhr.setRequestHeader("Range", "bytes="+this._start+"-"+end);
				xhr.setRequestHeader("If-None-Match", "webkit-no-cache"); // https://bugs.webkit.org/show_bug.cgi?id=82672
			}

			try {
				xhr.send();
			}
			catch (err) {
				this._chunkError(err.message);
			}

			if (IS_WORKER && xhr.status == 0)
				this._chunkError();
			else
				this._start += this._config.chunkSize;
		}

		this._chunkLoaded = function()
		{
			if (xhr.readyState != 4)
				return;

			if (xhr.status < 200 || xhr.status >= 400)
			{
				this._chunkError();
				return;
			}

			this._finished = !this._config.chunkSize || this._start > getFileSize(xhr);
			this.parseChunk(xhr.responseText);
		}

		this._chunkError = function(errorMessage)
		{
			var errorText = xhr.statusText || errorMessage;
			this._sendError(errorText);
		}

		function getFileSize(xhr)
		{
			var contentRange = xhr.getResponseHeader("Content-Range");
			return parseInt(contentRange.substr(contentRange.lastIndexOf("/") + 1));
		}
	}
	NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
	NetworkStreamer.prototype.constructor = NetworkStreamer;


	function FileStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.LocalChunkSize;
		ChunkStreamer.call(this, config);

		var reader, slice;

		// FileReader is better than FileReaderSync (even in worker) - see http://stackoverflow.com/q/24708649/1048862
		// But Firefox is a pill, too - see issue #76: https://github.com/mholt/PapaParse/issues/76
		var usingAsyncReader = typeof FileReader !== 'undefined';	// Safari doesn't consider it a function - see issue #105

		this.stream = function(file)
		{
			this._input = file;
			slice = file.slice || file.webkitSlice || file.mozSlice;

			if (usingAsyncReader)
			{
				reader = new FileReader();		// Preferred method of reading files, even in workers
				reader.onload = bindFunction(this._chunkLoaded, this);
				reader.onerror = bindFunction(this._chunkError, this);
			}
			else
				reader = new FileReaderSync();	// Hack for running in a web worker in Firefox

			this._nextChunk();	// Starts streaming
		};

		this._nextChunk = function()
		{
			if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
				this._readChunk();
		}

		this._readChunk = function()
		{
			var input = this._input;
			if (this._config.chunkSize)
			{
				var end = Math.min(this._start + this._config.chunkSize, this._input.size);
				input = slice.call(input, this._start, end);
			}
			var txt = reader.readAsText(input, this._config.encoding);
			if (!usingAsyncReader)
				this._chunkLoaded({ target: { result: txt } });	// mimic the async signature
		}

		this._chunkLoaded = function(event)
		{
			// Very important to increment start each time before handling results
			this._start += this._config.chunkSize;
			this._finished = !this._config.chunkSize || this._start >= this._input.size;
			this.parseChunk(event.target.result);
		}

		this._chunkError = function()
		{
			this._sendError(reader.error);
		}

	}
	FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
	FileStreamer.prototype.constructor = FileStreamer;


	function StringStreamer(config)
	{
		config = config || {};
		ChunkStreamer.call(this, config);

		var string;
		var remaining;
		this.stream = function(s)
		{
			string = s;
			remaining = s;
			return this._nextChunk();
		}
		this._nextChunk = function()
		{
			if (this._finished) return;
			var size = this._config.chunkSize;
			var chunk = size ? remaining.substr(0, size) : remaining;
			remaining = size ? remaining.substr(size) : '';
			this._finished = !remaining;
			return this.parseChunk(chunk);
		}
	}
	StringStreamer.prototype = Object.create(StringStreamer.prototype);
	StringStreamer.prototype.constructor = StringStreamer;



	// Use one ParserHandle per entire CSV file or string
	function ParserHandle(_config)
	{
		// One goal is to minimize the use of regular expressions...
		var FLOAT = /^\s*-?(\d*\.?\d+|\d+\.?\d*)(e[-+]?\d+)?\s*$/i;

		var self = this;
		var _stepCounter = 0;	// Number of times step was called (number of rows parsed)
		var _input;				// The input being parsed
		var _parser;			// The core parser being used
		var _paused = false;	// Whether we are paused or not
		var _aborted = false;   // Whether the parser has aborted or not
		var _delimiterError;	// Temporary state between delimiter detection and processing results
		var _fields = [];		// Fields are from the header row of the input, if there is one
		var _results = {		// The last results returned from the parser
			data: [],
			errors: [],
			meta: {}
		};

		if (isFunction(_config.step))
		{
			var userStep = _config.step;
			_config.step = function(results)
			{
				_results = results;

				if (needsHeaderRow())
					processResults();
				else	// only call user's step function after header row
				{
					processResults();

					// It's possbile that this line was empty and there's no row here after all
					if (_results.data.length == 0)
						return;

					_stepCounter += results.data.length;
					if (_config.preview && _stepCounter > _config.preview)
						_parser.abort();
					else
						userStep(_results, self);
				}
			};
		}

		/**
		 * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
		 * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
		 * when an input comes in multiple chunks, like from a file.
		 */
		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			if (!_config.newline)
				_config.newline = guessLineEndings(input);

			_delimiterError = false;
			if (!_config.delimiter)
			{
				var delimGuess = guessDelimiter(input);
				if (delimGuess.successful)
					_config.delimiter = delimGuess.bestDelimiter;
				else
				{
					_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
					_config.delimiter = Papa.DefaultDelimiter;
				}
				_results.meta.delimiter = _config.delimiter;
			}

			var parserConfig = copy(_config);
			if (_config.preview && _config.header)
				parserConfig.preview++;	// to compensate for header row

			_input = input;
			_parser = new Parser(parserConfig);
			_results = _parser.parse(_input, baseIndex, ignoreLastRow);
			processResults();
			return _paused ? { meta: { paused: true } } : (_results || { meta: { paused: false } });
		};

		this.paused = function()
		{
			return _paused;
		};

		this.pause = function()
		{
			_paused = true;
			_parser.abort();
			_input = _input.substr(_parser.getCharIndex());
		};

		this.resume = function()
		{
			_paused = false;
			self.streamer.parseChunk(_input);
		};

		this.aborted = function () {
			return _aborted;
		}

		this.abort = function()
		{
			_aborted = true;
			_parser.abort();
			_results.meta.aborted = true;
			if (isFunction(_config.complete))
				_config.complete(_results);
			_input = "";
		};

		function processResults()
		{
			if (_results && _delimiterError)
			{
				addError("Delimiter", "UndetectableDelimiter", "Unable to auto-detect delimiting character; defaulted to '"+Papa.DefaultDelimiter+"'");
				_delimiterError = false;
			}

			if (_config.skipEmptyLines)
			{
				for (var i = 0; i < _results.data.length; i++)
					if (_results.data[i].length == 1 && _results.data[i][0] == "")
						_results.data.splice(i--, 1);
			}

			if (needsHeaderRow())
				fillHeaderFields();

			return applyHeaderAndDynamicTyping();
		}

		function needsHeaderRow()
		{
			return _config.header && _fields.length == 0;
		}

		function fillHeaderFields()
		{
			if (!_results)
				return;
			for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
				for (var j = 0; j < _results.data[i].length; j++)
					_fields.push(_results.data[i][j]);
			_results.data.splice(0, 1);
		}

		function applyHeaderAndDynamicTyping()
		{
			if (!_results || (!_config.header && !_config.dynamicTyping))
				return _results;

			for (var i = 0; i < _results.data.length; i++)
			{
				var row = {};

				for (var j = 0; j < _results.data[i].length; j++)
				{
					if (_config.dynamicTyping)
					{
						var value = _results.data[i][j];
						if (value == "true" || value == "TRUE")
							_results.data[i][j] = true;
						else if (value == "false" || value == "FALSE")
							_results.data[i][j] = false;
						else
							_results.data[i][j] = tryParseFloat(value);
					}

					if (_config.header)
					{
						if (j >= _fields.length)
						{
							if (!row["__parsed_extra"])
								row["__parsed_extra"] = [];
							row["__parsed_extra"].push(_results.data[i][j]);
						}
						else
							row[_fields[j]] = _results.data[i][j];
					}
				}

				if (_config.header)
				{
					_results.data[i] = row;
					if (j > _fields.length)
						addError("FieldMismatch", "TooManyFields", "Too many fields: expected " + _fields.length + " fields but parsed " + j, i);
					else if (j < _fields.length)
						addError("FieldMismatch", "TooFewFields", "Too few fields: expected " + _fields.length + " fields but parsed " + j, i);
				}
			}

			if (_config.header && _results.meta)
				_results.meta.fields = _fields;
			return _results;
		}

		function guessDelimiter(input)
		{
			var delimChoices = [",", "\t", "|", ";", Papa.RECORD_SEP, Papa.UNIT_SEP];
			var bestDelim, bestDelta, fieldCountPrevRow;

			for (var i = 0; i < delimChoices.length; i++)
			{
				var delim = delimChoices[i];
				var delta = 0, avgFieldCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					delimiter: delim,
					preview: 10
				}).parse(input);

				for (var j = 0; j < preview.data.length; j++)
				{
					var fieldCount = preview.data[j].length;
					avgFieldCount += fieldCount;

					if (typeof fieldCountPrevRow === 'undefined')
					{
						fieldCountPrevRow = fieldCount;
						continue;
					}
					else if (fieldCount > 1)
					{
						delta += Math.abs(fieldCount - fieldCountPrevRow);
						fieldCountPrevRow = fieldCount;
					}
				}

				if (preview.data.length > 0)
					avgFieldCount /= preview.data.length;

				if ((typeof bestDelta === 'undefined' || delta < bestDelta)
					&& avgFieldCount > 1.99)
				{
					bestDelta = delta;
					bestDelim = delim;
				}
			}

			_config.delimiter = bestDelim;

			return {
				successful: !!bestDelim,
				bestDelimiter: bestDelim
			}
		}

		function guessLineEndings(input)
		{
			input = input.substr(0, 1024*1024);	// max length 1 MB

			var r = input.split('\r');

			if (r.length == 1)
				return '\n';

			var numWithN = 0;
			for (var i = 0; i < r.length; i++)
			{
				if (r[i][0] == '\n')
					numWithN++;
			}

			return numWithN >= r.length / 2 ? '\r\n' : '\r';
		}

		function tryParseFloat(val)
		{
			var isNumber = FLOAT.test(val);
			return isNumber ? parseFloat(val) : val;
		}

		function addError(type, code, msg, row)
		{
			_results.errors.push({
				type: type,
				code: code,
				message: msg,
				row: row
			});
		}
	}





	/** The core parser implements speedy and correct CSV parsing */
	function Parser(config)
	{
		// Unpack the config object
		config = config || {};
		var delim = config.delimiter;
		var newline = config.newline;
		var comments = config.comments;
		var step = config.step;
		var preview = config.preview;
		var fastMode = config.fastMode;

		// Delimiter must be valid
		if (typeof delim !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
			delim = ",";

		// Comment character must be valid
		if (comments === delim)
			throw "Comment character same as delimiter";
		else if (comments === true)
			comments = "#";
		else if (typeof comments !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(comments) > -1)
			comments = false;

		// Newline must be valid: \r, \n, or \r\n
		if (newline != '\n' && newline != '\r' && newline != '\r\n')
			newline = '\n';

		// We're gonna need these at the Parser scope
		var cursor = 0;
		var aborted = false;

		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			// For some reason, in Chrome, this speeds things up (!?)
			if (typeof input !== 'string')
				throw "Input must be a string";

			// We don't need to compute some of these every time parse() is called,
			// but having them in a more local scope seems to perform better
			var inputLen = input.length,
				delimLen = delim.length,
				newlineLen = newline.length,
				commentsLen = comments.length;
			var stepIsFunction = typeof step === 'function';

			// Establish starting state
			cursor = 0;
			var data = [], errors = [], row = [], lastCursor = 0;

			if (!input)
				return returnable();

			if (fastMode || (fastMode !== false && input.indexOf('"') === -1))
			{
				var rows = input.split(newline);
				for (var i = 0; i < rows.length; i++)
				{
					var row = rows[i];
					cursor += row.length;
					if (i !== rows.length - 1)
						cursor += newline.length;
					else if (ignoreLastRow)
						return returnable();
					if (comments && row.substr(0, commentsLen) == comments)
						continue;
					if (stepIsFunction)
					{
						data = [];
						pushRow(row.split(delim));
						doStep();
						if (aborted)
							return returnable();
					}
					else
						pushRow(row.split(delim));
					if (preview && i >= preview)
					{
						data = data.slice(0, preview);
						return returnable(true);
					}
				}
				return returnable();
			}

			var nextDelim = input.indexOf(delim, cursor);
			var nextNewline = input.indexOf(newline, cursor);

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] == '"')
				{
					// Start our search for the closing quote where the cursor is
					var quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						var quoteSearch = input.indexOf('"', quoteSearch+1);

						if (quoteSearch === -1)
						{
							if (!ignoreLastRow) {
								// No closing quote... what a pity
								errors.push({
									type: "Quotes",
									code: "MissingQuotes",
									message: "Quoted field unterminated",
									row: data.length,	// row has yet to be inserted
									index: cursor
								});
							}
							return finish();
						}

						if (quoteSearch === inputLen-1)
						{
							// Closing quote at EOF
							var value = input.substring(cursor, quoteSearch).replace(/""/g, '"');
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						if (input[quoteSearch+1] == '"')
						{
							quoteSearch++;
							continue;
						}

						if (input[quoteSearch+1] == delim)
						{
							// Closing quote followed by delimiter
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
							cursor = quoteSearch + 1 + delimLen;
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						if (input.substr(quoteSearch+1, newlineLen) === newline)
						{
							// Closing quote followed by newline
							row.push(input.substring(cursor, quoteSearch).replace(/""/g, '"'));
							saveRow(quoteSearch + 1 + newlineLen);
							nextDelim = input.indexOf(delim, cursor);	// because we may have skipped the nextDelim in the quoted field

							if (stepIsFunction)
							{
								doStep();
								if (aborted)
									return returnable();
							}
							
							if (preview && data.length >= preview)
								return returnable(true);

							break;
						}
					}

					continue;
				}

				// Comment found at start of new line
				if (comments && row.length === 0 && input.substr(cursor, commentsLen) === comments)
				{
					if (nextNewline == -1)	// Comment ends at EOF
						return returnable();
					cursor = nextNewline + newlineLen;
					nextNewline = input.indexOf(newline, cursor);
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// Next delimiter comes before next newline, so we've reached end of field
				if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1))
				{
					row.push(input.substring(cursor, nextDelim));
					cursor = nextDelim + delimLen;
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// End of row
				if (nextNewline !== -1)
				{
					row.push(input.substring(cursor, nextNewline));
					saveRow(nextNewline + newlineLen);

					if (stepIsFunction)
					{
						doStep();
						if (aborted)
							return returnable();
					}

					if (preview && data.length >= preview)
						return returnable(true);

					continue;
				}

				break;
			}


			return finish();


			function pushRow(row)
			{
				data.push(row);
				lastCursor = cursor;
			}

			/**
			 * Appends the remaining input from cursor to the end into
			 * row, saves the row, calls step, and returns the results.
			 */
			function finish(value)
			{
				if (ignoreLastRow)
					return returnable();
				if (typeof value === 'undefined')
					value = input.substr(cursor);
				row.push(value);
				cursor = inputLen;	// important in case parsing is paused
				pushRow(row);
				if (stepIsFunction)
					doStep();
				return returnable();
			}

			/**
			 * Appends the current row to the results. It sets the cursor
			 * to newCursor and finds the nextNewline. The caller should
			 * take care to execute user's step function and check for
			 * preview and end parsing if necessary.
			 */
			function saveRow(newCursor)
			{
				cursor = newCursor;
				pushRow(row);
				row = [];
				nextNewline = input.indexOf(newline, cursor);
			}

			/** Returns an object with the results, errors, and meta. */
			function returnable(stopped)
			{
				return {
					data: data,
					errors: errors,
					meta: {
						delimiter: delim,
						linebreak: newline,
						aborted: aborted,
						truncated: !!stopped,
						cursor: lastCursor + (baseIndex || 0)
					}
				};
			}

			/** Executes the user's step function and resets data & errors. */
			function doStep()
			{
				step(returnable());
				data = [], errors = [];
			}
		};

		/** Sets the abort flag */
		this.abort = function()
		{
			aborted = true;
		};

		/** Gets the cursor position */
		this.getCharIndex = function()
		{
			return cursor;
		};
	}


	// If you need to load Papa Parse asynchronously and you also need worker threads, hard-code
	// the script path here. See: https://github.com/mholt/PapaParse/issues/87#issuecomment-57885358
	function getScriptPath()
	{
		var scripts = document.getElementsByTagName('script');
		return scripts.length ? scripts[scripts.length - 1].src : '';
	}

	function newWorker()
	{
		if (!Papa.WORKERS_SUPPORTED)
			return false;
		if (!LOADED_SYNC && Papa.SCRIPT_PATH === null)
			throw new Error(
				'Script path cannot be determined automatically when Papa Parse is loaded asynchronously. ' +
				'You need to set Papa.SCRIPT_PATH manually.'
			);
		var workerUrl = Papa.SCRIPT_PATH || AUTO_SCRIPT_PATH;
		// Append "papaworker" to the search string to tell papaparse that this is our worker.
		workerUrl += (workerUrl.indexOf('?') !== -1 ? '&' : '?') + 'papaworker';
		var w = new global.Worker(workerUrl);
		w.onmessage = mainThreadReceivedMessage;
		w.id = workerIdCounter++;
		workers[w.id] = w;
		return w;
	}

	/** Callback when main thread receives a message */
	function mainThreadReceivedMessage(e)
	{
		var msg = e.data;
		var worker = workers[msg.workerId];
		var aborted = false;

		if (msg.error)
			worker.userError(msg.error, msg.file);
		else if (msg.results && msg.results.data)
		{
			var abort = function() {
				aborted = true;
				completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
			};

			var handle = {
				abort: abort,
				pause: notImplemented,
				resume: notImplemented
			};

			if (isFunction(worker.userStep))
			{
				for (var i = 0; i < msg.results.data.length; i++)
				{
					worker.userStep({
						data: [msg.results.data[i]],
						errors: msg.results.errors,
						meta: msg.results.meta
					}, handle);
					if (aborted)
						break;
				}
				delete msg.results;	// free memory ASAP
			}
			else if (isFunction(worker.userChunk))
			{
				worker.userChunk(msg.results, handle, msg.file);
				delete msg.results;
			}
		}

		if (msg.finished && !aborted)
			completeWorker(msg.workerId, msg.results);
	}

	function completeWorker(workerId, results) {
		var worker = workers[workerId];
		if (isFunction(worker.userComplete))
			worker.userComplete(results);
		worker.terminate();
		delete workers[workerId];
	}

	function notImplemented() {
		throw "Not implemented.";
	}

	/** Callback when worker thread receives a message */
	function workerThreadReceivedMessage(e)
	{
		var msg = e.data;

		if (typeof Papa.WORKER_ID === 'undefined' && msg)
			Papa.WORKER_ID = msg.workerId;

		if (typeof msg.input === 'string')
		{
			global.postMessage({
				workerId: Papa.WORKER_ID,
				results: Papa.parse(msg.input, msg.config),
				finished: true
			});
		}
		else if ((global.File && msg.input instanceof File) || msg.input instanceof Object)	// thank you, Safari (see issue #106)
		{
			var results = Papa.parse(msg.input, msg.config);
			if (results)
				global.postMessage({
					workerId: Papa.WORKER_ID,
					results: results,
					finished: true
				});
		}
	}

	/** Makes a deep copy of an array or object (mostly) */
	function copy(obj)
	{
		if (typeof obj !== 'object')
			return obj;
		var cpy = obj instanceof Array ? [] : {};
		for (var key in obj)
			cpy[key] = copy(obj[key]);
		return cpy;
	}

	function bindFunction(f, self)
	{
		return function() { f.apply(self, arguments); };
	}

	function isFunction(func)
	{
		return typeof func === 'function';
	}
})(typeof window !== 'undefined' ? window : this);

},{}],39:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],40:[function(require,module,exports){
(function (global){
/*! *****************************************************************************
Copyright (C) Microsoft. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
var Reflect;
(function (Reflect) {
    "use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    // feature test for Object.create support
    var supportsCreate = typeof Object.create === "function";
    // feature test for __proto__ support
    var supportsProto = { __proto__: [] } instanceof Array;
    // feature test for Symbol support
    var supportsSymbol = typeof Symbol === "function";
    var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
    var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
    // create an object in dictionary mode (a.k.a. "slow" mode in v8)
    var createDictionary = supportsCreate ? function () { return MakeDictionary(Object.create(null)); } :
        supportsProto ? function () { return MakeDictionary({ __proto__: null }); } :
            function () { return MakeDictionary({}); };
    var HashMap;
    (function (HashMap) {
        var downLevel = !supportsCreate && !supportsProto;
        HashMap.has = downLevel
            ? function (map, key) { return hasOwn.call(map, key); }
            : function (map, key) { return key in map; };
        HashMap.get = downLevel
            ? function (map, key) { return hasOwn.call(map, key) ? map[key] : undefined; }
            : function (map, key) { return map[key]; };
    })(HashMap || (HashMap = {}));
    // Load global or shim versions of Map, Set, and WeakMap
    var functionPrototype = Object.getPrototypeOf(Function);
    var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
    var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
    var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
    // [[Metadata]] internal slot
    var Metadata = new _WeakMap();
    /**
      * Applies a set of decorators to a property of a target object.
      * @param decorators An array of decorators.
      * @param target The target object.
      * @param targetKey (Optional) The property key to decorate.
      * @param targetDescriptor (Optional) The property descriptor for the target key
      * @remarks Decorators are applied in reverse order.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Example = Reflect.decorate(decoratorsArray, Example);
      *
      *     // property (on constructor)
      *     Reflect.decorate(decoratorsArray, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.decorate(decoratorsArray, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Object.defineProperty(Example, "staticMethod",
      *         Reflect.decorate(decoratorsArray, Example, "staticMethod",
      *             Object.getOwnPropertyDescriptor(Example, "staticMethod")));
      *
      *     // method (on prototype)
      *     Object.defineProperty(Example.prototype, "method",
      *         Reflect.decorate(decoratorsArray, Example.prototype, "method",
      *             Object.getOwnPropertyDescriptor(Example.prototype, "method")));
      *
      */
    function decorate(decorators, target, targetKey, targetDescriptor) {
        if (!IsUndefined(targetKey)) {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsObject(target))
                throw new TypeError();
            if (!IsObject(targetDescriptor) && !IsUndefined(targetDescriptor) && !IsNull(targetDescriptor))
                throw new TypeError();
            if (IsNull(targetDescriptor))
                targetDescriptor = undefined;
            targetKey = ToPropertyKey(targetKey);
            return DecorateProperty(decorators, target, targetKey, targetDescriptor);
        }
        else {
            if (!IsArray(decorators))
                throw new TypeError();
            if (!IsConstructor(target))
                throw new TypeError();
            return DecorateConstructor(decorators, target);
        }
    }
    Reflect.decorate = decorate;
    /**
      * A default metadata decorator factory that can be used on a class, class member, or parameter.
      * @param metadataKey The key for the metadata entry.
      * @param metadataValue The value for the metadata entry.
      * @returns A decorator function.
      * @remarks
      * If `metadataKey` is already defined for the target and target key, the
      * metadataValue for that key will be overwritten.
      * @example
      *
      *     // constructor
      *     @Reflect.metadata(key, value)
      *     class Example {
      *     }
      *
      *     // property (on constructor, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticProperty;
      *     }
      *
      *     // property (on prototype, TypeScript only)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         property;
      *     }
      *
      *     // method (on constructor)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         static staticMethod() { }
      *     }
      *
      *     // method (on prototype)
      *     class Example {
      *         @Reflect.metadata(key, value)
      *         method() { }
      *     }
      *
      */
    function metadata(metadataKey, metadataValue) {
        function decorator(target, targetKey) {
            if (!IsUndefined(targetKey)) {
                if (!IsObject(target))
                    throw new TypeError();
                targetKey = ToPropertyKey(targetKey);
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
            }
            else {
                if (!IsConstructor(target))
                    throw new TypeError();
                OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, /*targetKey*/ undefined);
            }
        }
        return decorator;
    }
    Reflect.metadata = metadata;
    /**
      * Define a unique metadata entry on the target.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param metadataValue A value that contains attached metadata.
      * @param target The target object on which to define metadata.
      * @param targetKey (Optional) The property key for the target.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     Reflect.defineMetadata("custom:annotation", options, Example);
      *
      *     // property (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticProperty");
      *
      *     // property (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "property");
      *
      *     // method (on constructor)
      *     Reflect.defineMetadata("custom:annotation", options, Example, "staticMethod");
      *
      *     // method (on prototype)
      *     Reflect.defineMetadata("custom:annotation", options, Example.prototype, "method");
      *
      *     // decorator factory as metadata-producing annotation.
      *     function MyAnnotation(options): Decorator {
      *         return (target, key?) => Reflect.defineMetadata("custom:annotation", options, target, key);
      *     }
      *
      */
    function defineMetadata(metadataKey, metadataValue, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, targetKey);
    }
    Reflect.defineMetadata = defineMetadata;
    /**
      * Gets a value indicating whether the target object or its prototype chain has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object or its prototype chain; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasMetadata = hasMetadata;
    /**
      * Gets a value indicating whether the target object has the provided metadata key defined.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata key was defined on the target object; otherwise, `false`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.hasOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function hasOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryHasOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.hasOwnMetadata = hasOwnMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object or its prototype chain.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetMetadata(metadataKey, target, targetKey);
    }
    Reflect.getMetadata = getMetadata;
    /**
      * Gets the metadata value for the provided metadata key on the target object.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns The metadata value for the metadata key if found; otherwise, `undefined`.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function getOwnMetadata(metadataKey, target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryGetOwnMetadata(metadataKey, target, targetKey);
    }
    Reflect.getOwnMetadata = getOwnMetadata;
    /**
      * Gets the metadata keys defined on the target object or its prototype chain.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getMetadataKeys(Example.prototype, "method");
      *
      */
    function getMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryMetadataKeys(target, targetKey);
    }
    Reflect.getMetadataKeys = getMetadataKeys;
    /**
      * Gets the unique metadata keys defined on the target object.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns An array of unique metadata keys.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.getOwnMetadataKeys(Example);
      *
      *     // property (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.getOwnMetadataKeys(Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.getOwnMetadataKeys(Example.prototype, "method");
      *
      */
    function getOwnMetadataKeys(target, targetKey) {
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        return OrdinaryOwnMetadataKeys(target, targetKey);
    }
    Reflect.getOwnMetadataKeys = getOwnMetadataKeys;
    /**
      * Deletes the metadata entry from the target object with the provided key.
      * @param metadataKey A key used to store and retrieve metadata.
      * @param target The target object on which the metadata is defined.
      * @param targetKey (Optional) The property key for the target.
      * @returns `true` if the metadata entry was found and deleted; otherwise, false.
      * @example
      *
      *     class Example {
      *         // property declarations are not part of ES6, though they are valid in TypeScript:
      *         // static staticProperty;
      *         // property;
      *
      *         constructor(p) { }
      *         static staticMethod(p) { }
      *         method(p) { }
      *     }
      *
      *     // constructor
      *     result = Reflect.deleteMetadata("custom:annotation", Example);
      *
      *     // property (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticProperty");
      *
      *     // property (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "property");
      *
      *     // method (on constructor)
      *     result = Reflect.deleteMetadata("custom:annotation", Example, "staticMethod");
      *
      *     // method (on prototype)
      *     result = Reflect.deleteMetadata("custom:annotation", Example.prototype, "method");
      *
      */
    function deleteMetadata(metadataKey, target, targetKey) {
        // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#deletemetadata-metadatakey-p-
        if (!IsObject(target))
            throw new TypeError();
        if (!IsUndefined(targetKey))
            targetKey = ToPropertyKey(targetKey);
        var metadataMap = GetOrCreateMetadataMap(target, targetKey, /*create*/ false);
        if (IsUndefined(metadataMap))
            return false;
        if (!metadataMap.delete(metadataKey))
            return false;
        if (metadataMap.size > 0)
            return true;
        var targetMetadata = Metadata.get(target);
        targetMetadata.delete(targetKey);
        if (targetMetadata.size > 0)
            return true;
        Metadata.delete(target);
        return true;
    }
    Reflect.deleteMetadata = deleteMetadata;
    function DecorateConstructor(decorators, target) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsConstructor(decorated))
                    throw new TypeError();
                target = decorated;
            }
        }
        return target;
    }
    function DecorateProperty(decorators, target, propertyKey, descriptor) {
        for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
                if (!IsObject(decorated))
                    throw new TypeError();
                descriptor = decorated;
            }
        }
        return descriptor;
    }
    function GetOrCreateMetadataMap(O, P, Create) {
        var targetMetadata = Metadata.get(O);
        if (IsUndefined(targetMetadata)) {
            if (!Create)
                return undefined;
            targetMetadata = new _Map();
            Metadata.set(O, targetMetadata);
        }
        var metadataMap = targetMetadata.get(P);
        if (IsUndefined(metadataMap)) {
            if (!Create)
                return undefined;
            metadataMap = new _Map();
            targetMetadata.set(P, metadataMap);
        }
        return metadataMap;
    }
    // Ordinary Object Internal Methods and Internal Slots
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinary-object-internal-methods-and-internal-slots
    // OrdinaryHasMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasmetadata--metadatakey-o-p-
    function OrdinaryHasMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return true;
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
            return OrdinaryHasMetadata(MetadataKey, parent, P);
        return false;
    }
    // OrdinaryHasOwnMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryhasownmetadata--metadatakey-o-p-
    function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        if (IsUndefined(metadataMap))
            return false;
        return ToBoolean(metadataMap.has(MetadataKey));
    }
    // OrdinaryGetMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetmetadata--metadatakey-o-p-
    function OrdinaryGetMetadata(MetadataKey, O, P) {
        var hasOwn = OrdinaryHasOwnMetadata(MetadataKey, O, P);
        if (hasOwn)
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (!IsNull(parent))
            return OrdinaryGetMetadata(MetadataKey, parent, P);
        return undefined;
    }
    // OrdinaryGetOwnMetadata(MetadataKey, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarygetownmetadata--metadatakey-o-p-
    function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        if (IsUndefined(metadataMap))
            return undefined;
        return metadataMap.get(MetadataKey);
    }
    // OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarydefineownmetadata--metadatakey-metadatavalue-o-p-
    function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ true);
        metadataMap.set(MetadataKey, MetadataValue);
    }
    // OrdinaryMetadataKeys(O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinarymetadatakeys--o-p-
    function OrdinaryMetadataKeys(O, P) {
        var ownKeys = OrdinaryOwnMetadataKeys(O, P);
        var parent = OrdinaryGetPrototypeOf(O);
        if (parent === null)
            return ownKeys;
        var parentKeys = OrdinaryMetadataKeys(parent, P);
        if (parentKeys.length <= 0)
            return ownKeys;
        if (ownKeys.length <= 0)
            return parentKeys;
        var set = new _Set();
        var keys = [];
        for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
            var key = ownKeys_1[_i];
            var hasKey = set.has(key);
            if (!hasKey) {
                set.add(key);
                keys.push(key);
            }
        }
        for (var _a = 0, parentKeys_1 = parentKeys; _a < parentKeys_1.length; _a++) {
            var key = parentKeys_1[_a];
            var hasKey = set.has(key);
            if (!hasKey) {
                set.add(key);
                keys.push(key);
            }
        }
        return keys;
    }
    // OrdinaryOwnMetadataKeys(O, P)
    // https://github.com/rbuckton/ReflectDecorators/blob/master/spec/metadata.md#ordinaryownmetadatakeys--o-p-
    function OrdinaryOwnMetadataKeys(O, P) {
        var metadataMap = GetOrCreateMetadataMap(O, P, /*create*/ false);
        var keys = [];
        if (IsUndefined(metadataMap))
            return keys;
        var keysObj = metadataMap.keys();
        var iterator = GetIterator(keysObj);
        while (true) {
            var next = IteratorStep(iterator);
            try {
                if (!next)
                    return keys;
                var nextValue = IteratorValue(next);
                keys.push(nextValue);
            }
            catch (e) {
                try {
                    if (next) {
                        next = false;
                        IteratorClose(iterator);
                    }
                }
                finally {
                    throw e;
                }
            }
            finally {
                if (next)
                    IteratorClose(iterator);
            }
        }
    }
    // ECMAScript Specification
    // https://tc39.github.io/ecma262/
    // 6 ECMAScript Data Typ0es and Values
    // https://tc39.github.io/ecma262/#sec-ecmascript-data-types-and-values
    function Type(x) {
        if (x === null)
            return 1 /* Null */;
        switch (typeof x) {
            case "undefined": return 0 /* Undefined */;
            case "boolean": return 2 /* Boolean */;
            case "string": return 3 /* String */;
            case "symbol": return 4 /* Symbol */;
            case "number": return 5 /* Number */;
            case "object": return x === null ? 1 /* Null */ : 6 /* Object */;
            default: return 6 /* Object */;
        }
    }
    // 6.1.1 The Undefined Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-undefined-type
    function IsUndefined(x) {
        return x === undefined;
    }
    // 6.1.2 The Null Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-null-type
    function IsNull(x) {
        return x === null;
    }
    // 6.1.5 The Symbol Type
    // https://tc39.github.io/ecma262/#sec-ecmascript-language-types-symbol-type
    function IsSymbol(x) {
        return typeof x === "symbol";
    }
    // 6.1.7 The Object Type
    // https://tc39.github.io/ecma262/#sec-object-type
    function IsObject(x) {
        return typeof x === "object" ? x !== null : typeof x === "function";
    }
    // 7.1 Type Conversion
    // https://tc39.github.io/ecma262/#sec-type-conversion
    // 7.1.1 ToPrimitive(input [, PreferredType])
    // https://tc39.github.io/ecma262/#sec-toprimitive
    function ToPrimitive(input, PreferredType) {
        switch (Type(input)) {
            case 0 /* Undefined */: return input;
            case 1 /* Null */: return input;
            case 2 /* Boolean */: return input;
            case 3 /* String */: return input;
            case 4 /* Symbol */: return input;
            case 5 /* Number */: return input;
        }
        var hint = PreferredType === 3 /* String */ ? "string" : PreferredType === 5 /* Number */ ? "number" : "default";
        var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
        if (exoticToPrim !== undefined) {
            var result = exoticToPrim.call(input, hint);
            if (IsObject(result))
                throw new TypeError();
            return result;
        }
        return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
    }
    // 7.1.1.1 OrdinaryToPrimitive(O, hint)
    // https://tc39.github.io/ecma262/#sec-ordinarytoprimitive
    function OrdinaryToPrimitive(O, hint) {
        if (hint === "string") {
            var toString_1 = O.toString;
            if (IsCallable(toString_1)) {
                var result = toString_1.call(O);
                if (!IsObject(result))
                    return result;
            }
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                    return result;
            }
        }
        else {
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
                var result = valueOf.call(O);
                if (!IsObject(result))
                    return result;
            }
            var toString_2 = O.toString;
            if (IsCallable(toString_2)) {
                var result = toString_2.call(O);
                if (!IsObject(result))
                    return result;
            }
        }
        throw new TypeError();
    }
    // 7.1.2 ToBoolean(argument)
    // https://tc39.github.io/ecma262/2016/#sec-toboolean
    function ToBoolean(argument) {
        return !!argument;
    }
    // 7.1.12 ToString(argument)
    // https://tc39.github.io/ecma262/#sec-tostring
    function ToString(argument) {
        return "" + argument;
    }
    // 7.1.14 ToPropertyKey(argument)
    // https://tc39.github.io/ecma262/#sec-topropertykey
    function ToPropertyKey(argument) {
        var key = ToPrimitive(argument, 3 /* String */);
        if (IsSymbol(key))
            return key;
        return ToString(key);
    }
    // 7.2 Testing and Comparison Operations
    // https://tc39.github.io/ecma262/#sec-testing-and-comparison-operations
    // 7.2.2 IsArray(argument)
    // https://tc39.github.io/ecma262/#sec-isarray
    function IsArray(argument) {
        return Array.isArray
            ? Array.isArray(argument)
            : argument instanceof Object
                ? argument instanceof Array
                : Object.prototype.toString.call(argument) === "[object Array]";
    }
    // 7.2.3 IsCallable(argument)
    // https://tc39.github.io/ecma262/#sec-iscallable
    function IsCallable(argument) {
        // NOTE: This is an approximation as we cannot check for [[Call]] internal method.
        return typeof argument === "function";
    }
    // 7.2.4 IsConstructor(argument)
    // https://tc39.github.io/ecma262/#sec-isconstructor
    function IsConstructor(argument) {
        // NOTE: This is an approximation as we cannot check for [[Construct]] internal method.
        return typeof argument === "function";
    }
    // 7.3 Operations on Objects
    // https://tc39.github.io/ecma262/#sec-operations-on-objects
    // 7.3.9 GetMethod(V, P)
    // https://tc39.github.io/ecma262/#sec-getmethod
    function GetMethod(V, P) {
        var func = V[P];
        if (func === undefined || func === null)
            return undefined;
        if (!IsCallable(func))
            throw new TypeError();
        return func;
    }
    // 7.4 Operations on Iterator Objects
    // https://tc39.github.io/ecma262/#sec-operations-on-iterator-objects
    function GetIterator(obj) {
        var method = GetMethod(obj, iteratorSymbol);
        if (!IsCallable(method))
            throw new TypeError(); // from Call
        var iterator = method.call(obj);
        if (!IsObject(iterator))
            throw new TypeError();
        return iterator;
    }
    // 7.4.4 IteratorValue(iterResult)
    // https://tc39.github.io/ecma262/2016/#sec-iteratorvalue
    function IteratorValue(iterResult) {
        return iterResult.value;
    }
    // 7.4.5 IteratorStep(iterator)
    // https://tc39.github.io/ecma262/#sec-iteratorstep
    function IteratorStep(iterator) {
        var result = iterator.next();
        return result.done ? false : result;
    }
    // 7.4.6 IteratorClose(iterator, completion)
    // https://tc39.github.io/ecma262/#sec-iteratorclose
    function IteratorClose(iterator) {
        var f = iterator["return"];
        if (f)
            f.call(iterator);
    }
    // 9.1 Ordinary Object Internal Methods and Internal Slots
    // https://tc39.github.io/ecma262/#sec-ordinary-object-internal-methods-and-internal-slots
    // 9.1.1.1 OrdinaryGetPrototypeOf(O)
    // https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
    function OrdinaryGetPrototypeOf(O) {
        var proto = Object.getPrototypeOf(O);
        if (typeof O !== "function" || O === functionPrototype)
            return proto;
        // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
        // Try to determine the superclass constructor. Compatible implementations
        // must either set __proto__ on a subclass constructor to the superclass constructor,
        // or ensure each class has a valid `constructor` property on its prototype that
        // points back to the constructor.
        // If this is not the same as Function.[[Prototype]], then this is definately inherited.
        // This is the case when in ES6 or when using __proto__ in a compatible browser.
        if (proto !== functionPrototype)
            return proto;
        // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
        var prototype = O.prototype;
        var prototypeProto = prototype && Object.getPrototypeOf(prototype);
        if (prototypeProto == null || prototypeProto === Object.prototype)
            return proto;
        // If the constructor was not a function, then we cannot determine the heritage.
        var constructor = prototypeProto.constructor;
        if (typeof constructor !== "function")
            return proto;
        // If we have some kind of self-reference, then we cannot determine the heritage.
        if (constructor === O)
            return proto;
        // we have a pretty good guess at the heritage.
        return constructor;
    }
    // naive Map shim
    function CreateMapPolyfill() {
        var cacheSentinel = {};
        var arraySentinel = [];
        var MapIterator = (function () {
            function MapIterator(keys, values, selector) {
                this._index = 0;
                this._keys = keys;
                this._values = values;
                this._selector = selector;
            }
            MapIterator.prototype["@@iterator"] = function () { return this; };
            MapIterator.prototype[iteratorSymbol] = function () { return this; };
            MapIterator.prototype.next = function () {
                var index = this._index;
                if (index >= 0 && index < this._keys.length) {
                    var result = this._selector(this._keys[index], this._values[index]);
                    if (index + 1 >= this._keys.length) {
                        this._index = -1;
                        this._keys = arraySentinel;
                        this._values = arraySentinel;
                    }
                    else {
                        this._index++;
                    }
                    return { value: result, done: false };
                }
                return { value: undefined, done: true };
            };
            MapIterator.prototype.throw = function (error) {
                if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                }
                throw error;
            };
            MapIterator.prototype.return = function (value) {
                if (this._index >= 0) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                }
                return { value: value, done: true };
            };
            return MapIterator;
        }());
        return (function () {
            function Map() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            }
            Object.defineProperty(Map.prototype, "size", {
                get: function () { return this._keys.length; },
                enumerable: true,
                configurable: true
            });
            Map.prototype.has = function (key) { return this._find(key, /*insert*/ false) >= 0; };
            Map.prototype.get = function (key) {
                var index = this._find(key, /*insert*/ false);
                return index >= 0 ? this._values[index] : undefined;
            };
            Map.prototype.set = function (key, value) {
                var index = this._find(key, /*insert*/ true);
                this._values[index] = value;
                return this;
            };
            Map.prototype.delete = function (key) {
                var index = this._find(key, /*insert*/ false);
                if (index >= 0) {
                    var size = this._keys.length;
                    for (var i = index + 1; i < size; i++) {
                        this._keys[i - 1] = this._keys[i];
                        this._values[i - 1] = this._values[i];
                    }
                    this._keys.length--;
                    this._values.length--;
                    if (key === this._cacheKey) {
                        this._cacheKey = cacheSentinel;
                        this._cacheIndex = -2;
                    }
                    return true;
                }
                return false;
            };
            Map.prototype.clear = function () {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
            };
            Map.prototype.keys = function () { return new MapIterator(this._keys, this._values, getKey); };
            Map.prototype.values = function () { return new MapIterator(this._keys, this._values, getValue); };
            Map.prototype.entries = function () { return new MapIterator(this._keys, this._values, getEntry); };
            Map.prototype["@@iterator"] = function () { return this.entries(); };
            Map.prototype[iteratorSymbol] = function () { return this.entries(); };
            Map.prototype._find = function (key, insert) {
                if (this._cacheKey === key)
                    return this._cacheIndex;
                var index = this._keys.indexOf(key);
                if (index < 0 && insert) {
                    index = this._keys.length;
                    this._keys.push(key);
                    this._values.push(undefined);
                }
                return this._cacheKey = key, this._cacheIndex = index;
            };
            return Map;
        }());
        function getKey(key, _) {
            return key;
        }
        function getValue(_, value) {
            return value;
        }
        function getEntry(key, value) {
            return [key, value];
        }
    }
    // naive Set shim
    function CreateSetPolyfill() {
        return (function () {
            function Set() {
                this._map = new _Map();
            }
            Object.defineProperty(Set.prototype, "size", {
                get: function () { return this._map.size; },
                enumerable: true,
                configurable: true
            });
            Set.prototype.has = function (value) { return this._map.has(value); };
            Set.prototype.add = function (value) { return this._map.set(value, value), this; };
            Set.prototype.delete = function (value) { return this._map.delete(value); };
            Set.prototype.clear = function () { this._map.clear(); };
            Set.prototype.keys = function () { return this._map.keys(); };
            Set.prototype.values = function () { return this._map.values(); };
            Set.prototype.entries = function () { return this._map.entries(); };
            Set.prototype["@@iterator"] = function () { return this.keys(); };
            Set.prototype[iteratorSymbol] = function () { return this.keys(); };
            return Set;
        }());
    }
    // naive WeakMap shim
    function CreateWeakMapPolyfill() {
        var UUID_SIZE = 16;
        var keys = createDictionary();
        var rootKey = CreateUniqueKey();
        return (function () {
            function WeakMap() {
                this._key = CreateUniqueKey();
            }
            WeakMap.prototype.has = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.has(table, this._key) : false;
            };
            WeakMap.prototype.get = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? HashMap.get(table, this._key) : undefined;
            };
            WeakMap.prototype.set = function (target, value) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ true);
                table[this._key] = value;
                return this;
            };
            WeakMap.prototype.delete = function (target) {
                var table = GetOrCreateWeakMapTable(target, /*create*/ false);
                return table !== undefined ? delete table[this._key] : false;
            };
            WeakMap.prototype.clear = function () {
                // NOTE: not a real clear, just makes the previous data unreachable
                this._key = CreateUniqueKey();
            };
            return WeakMap;
        }());
        function CreateUniqueKey() {
            var key;
            do
                key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
        }
        function GetOrCreateWeakMapTable(target, create) {
            if (!hasOwn.call(target, rootKey)) {
                if (!create)
                    return undefined;
                Object.defineProperty(target, rootKey, { value: createDictionary() });
            }
            return target[rootKey];
        }
        function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i)
                buffer[i] = Math.random() * 0xff | 0;
            return buffer;
        }
        function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
                if (typeof crypto !== "undefined")
                    return crypto.getRandomValues(new Uint8Array(size));
                if (typeof msCrypto !== "undefined")
                    return msCrypto.getRandomValues(new Uint8Array(size));
                return FillRandomBytes(new Uint8Array(size), size);
            }
            return FillRandomBytes(new Array(size), size);
        }
        function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            // mark as random - RFC 4122 § 4.4
            data[6] = data[6] & 0x4f | 0x40;
            data[8] = data[8] & 0xbf | 0x80;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
                var byte = data[offset];
                if (offset === 4 || offset === 6 || offset === 8)
                    result += "-";
                if (byte < 16)
                    result += "0";
                result += byte.toString(16).toLowerCase();
            }
            return result;
        }
    }
    // uses a heuristic used by v8 and chakra to force an object into dictionary mode.
    function MakeDictionary(obj) {
        obj.__ = undefined;
        delete obj.__;
        return obj;
    }
    // patch global Reflect
    (function (__global) {
        if (typeof __global.Reflect !== "undefined") {
            if (__global.Reflect !== Reflect) {
                for (var p in Reflect) {
                    if (hasOwn.call(Reflect, p)) {
                        __global.Reflect[p] = Reflect[p];
                    }
                }
            }
        }
        else {
            __global.Reflect = Reflect;
        }
    })(typeof global !== "undefined" ? global :
        typeof self !== "undefined" ? self :
            Function("return this;")());
})(Reflect || (Reflect = {}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],41:[function(require,module,exports){
'use strict';
module.exports = require('./lib/index');

},{"./lib/index":45}],42:[function(require,module,exports){
'use strict';

var randomFromSeed = require('./random/random-from-seed');

var ORIGINAL = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
var alphabet;
var previousSeed;

var shuffled;

function reset() {
    shuffled = false;
}

function setCharacters(_alphabet_) {
    if (!_alphabet_) {
        if (alphabet !== ORIGINAL) {
            alphabet = ORIGINAL;
            reset();
        }
        return;
    }

    if (_alphabet_ === alphabet) {
        return;
    }

    if (_alphabet_.length !== ORIGINAL.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. You submitted ' + _alphabet_.length + ' characters: ' + _alphabet_);
    }

    var unique = _alphabet_.split('').filter(function(item, ind, arr){
       return ind !== arr.lastIndexOf(item);
    });

    if (unique.length) {
        throw new Error('Custom alphabet for shortid must be ' + ORIGINAL.length + ' unique characters. These characters were not unique: ' + unique.join(', '));
    }

    alphabet = _alphabet_;
    reset();
}

function characters(_alphabet_) {
    setCharacters(_alphabet_);
    return alphabet;
}

function setSeed(seed) {
    randomFromSeed.seed(seed);
    if (previousSeed !== seed) {
        reset();
        previousSeed = seed;
    }
}

function shuffle() {
    if (!alphabet) {
        setCharacters(ORIGINAL);
    }

    var sourceArray = alphabet.split('');
    var targetArray = [];
    var r = randomFromSeed.nextValue();
    var characterIndex;

    while (sourceArray.length > 0) {
        r = randomFromSeed.nextValue();
        characterIndex = Math.floor(r * sourceArray.length);
        targetArray.push(sourceArray.splice(characterIndex, 1)[0]);
    }
    return targetArray.join('');
}

function getShuffled() {
    if (shuffled) {
        return shuffled;
    }
    shuffled = shuffle();
    return shuffled;
}

/**
 * lookup shuffled letter
 * @param index
 * @returns {string}
 */
function lookup(index) {
    var alphabetShuffled = getShuffled();
    return alphabetShuffled[index];
}

module.exports = {
    characters: characters,
    seed: setSeed,
    lookup: lookup,
    shuffled: getShuffled
};

},{"./random/random-from-seed":48}],43:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

/**
 * Decode the id to get the version and worker
 * Mainly for debugging and testing.
 * @param id - the shortid-generated id.
 */
function decode(id) {
    var characters = alphabet.shuffled();
    return {
        version: characters.indexOf(id.substr(0, 1)) & 0x0f,
        worker: characters.indexOf(id.substr(1, 1)) & 0x0f
    };
}

module.exports = decode;

},{"./alphabet":42}],44:[function(require,module,exports){
'use strict';

var randomByte = require('./random/random-byte');

function encode(lookup, number) {
    var loopCounter = 0;
    var done;

    var str = '';

    while (!done) {
        str = str + lookup( ( (number >> (4 * loopCounter)) & 0x0f ) | randomByte() );
        done = number < (Math.pow(16, loopCounter + 1 ) );
        loopCounter++;
    }
    return str;
}

module.exports = encode;

},{"./random/random-byte":47}],45:[function(require,module,exports){
'use strict';

var alphabet = require('./alphabet');
var encode = require('./encode');
var decode = require('./decode');
var isValid = require('./is-valid');

// Ignore all milliseconds before a certain time to reduce the size of the date entropy without sacrificing uniqueness.
// This number should be updated every year or so to keep the generated id short.
// To regenerate `new Date() - 0` and bump the version. Always bump the version!
var REDUCE_TIME = 1459707606518;

// don't change unless we change the algos or REDUCE_TIME
// must be an integer and less than 16
var version = 6;

// if you are using cluster or multiple servers use this to make each instance
// has a unique value for worker
// Note: I don't know if this is automatically set when using third
// party cluster solutions such as pm2.
var clusterWorkerId = require('./util/cluster-worker-id') || 0;

// Counter is used when shortid is called multiple times in one second.
var counter;

// Remember the last time shortid was called in case counter is needed.
var previousSeconds;

/**
 * Generate unique id
 * Returns string id
 */
function generate() {

    var str = '';

    var seconds = Math.floor((Date.now() - REDUCE_TIME) * 0.001);

    if (seconds === previousSeconds) {
        counter++;
    } else {
        counter = 0;
        previousSeconds = seconds;
    }

    str = str + encode(alphabet.lookup, version);
    str = str + encode(alphabet.lookup, clusterWorkerId);
    if (counter > 0) {
        str = str + encode(alphabet.lookup, counter);
    }
    str = str + encode(alphabet.lookup, seconds);

    return str;
}


/**
 * Set the seed.
 * Highly recommended if you don't want people to try to figure out your id schema.
 * exposed as shortid.seed(int)
 * @param seed Integer value to seed the random alphabet.  ALWAYS USE THE SAME SEED or you might get overlaps.
 */
function seed(seedValue) {
    alphabet.seed(seedValue);
    return module.exports;
}

/**
 * Set the cluster worker or machine id
 * exposed as shortid.worker(int)
 * @param workerId worker must be positive integer.  Number less than 16 is recommended.
 * returns shortid module so it can be chained.
 */
function worker(workerId) {
    clusterWorkerId = workerId;
    return module.exports;
}

/**
 *
 * sets new characters to use in the alphabet
 * returns the shuffled alphabet
 */
function characters(newCharacters) {
    if (newCharacters !== undefined) {
        alphabet.characters(newCharacters);
    }

    return alphabet.shuffled();
}


// Export all other functions as properties of the generate function
module.exports = generate;
module.exports.generate = generate;
module.exports.seed = seed;
module.exports.worker = worker;
module.exports.characters = characters;
module.exports.decode = decode;
module.exports.isValid = isValid;

},{"./alphabet":42,"./decode":43,"./encode":44,"./is-valid":46,"./util/cluster-worker-id":49}],46:[function(require,module,exports){
'use strict';
var alphabet = require('./alphabet');

function isShortId(id) {
    if (!id || typeof id !== 'string' || id.length < 6 ) {
        return false;
    }

    var characters = alphabet.characters();
    var len = id.length;
    for(var i = 0; i < len;i++) {
        if (characters.indexOf(id[i]) === -1) {
            return false;
        }
    }
    return true;
}

module.exports = isShortId;

},{"./alphabet":42}],47:[function(require,module,exports){
'use strict';

var crypto = typeof window === 'object' && (window.crypto || window.msCrypto); // IE 11 uses window.msCrypto

function randomByte() {
    if (!crypto || !crypto.getRandomValues) {
        return Math.floor(Math.random() * 256) & 0x30;
    }
    var dest = new Uint8Array(1);
    crypto.getRandomValues(dest);
    return dest[0] & 0x30;
}

module.exports = randomByte;

},{}],48:[function(require,module,exports){
'use strict';

// Found this seed-based random generator somewhere
// Based on The Central Randomizer 1.3 (C) 1997 by Paul Houle (houle@msc.cornell.edu)

var seed = 1;

/**
 * return a random number based on a seed
 * @param seed
 * @returns {number}
 */
function getNextValue() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed/(233280.0);
}

function setSeed(_seed_) {
    seed = _seed_;
}

module.exports = {
    nextValue: getNextValue,
    seed: setSeed
};

},{}],49:[function(require,module,exports){
'use strict';

module.exports = 0;

},{}],50:[function(require,module,exports){
/*! tether 1.4.0 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.Tether = factory();
  }
}(this, function(require, exports, module) {

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var TetherBase = undefined;
if (typeof TetherBase === 'undefined') {
  TetherBase = { modules: [] };
}

var zeroElement = null;

// Same as native getBoundingClientRect, except it takes into account parent <frame> offsets
// if the element lies within a nested document (<frame> or <iframe>-like).
function getActualBoundingClientRect(node) {
  var boundingRect = node.getBoundingClientRect();

  // The original object returned by getBoundingClientRect is immutable, so we clone it
  // We can't use extend because the properties are not considered part of the object by hasOwnProperty in IE9
  var rect = {};
  for (var k in boundingRect) {
    rect[k] = boundingRect[k];
  }

  if (node.ownerDocument !== document) {
    var _frameElement = node.ownerDocument.defaultView.frameElement;
    if (_frameElement) {
      var frameRect = getActualBoundingClientRect(_frameElement);
      rect.top += frameRect.top;
      rect.bottom += frameRect.top;
      rect.left += frameRect.left;
      rect.right += frameRect.left;
    }
  }

  return rect;
}

function getScrollParents(el) {
  // In firefox if the el is inside an iframe with display: none; window.getComputedStyle() will return null;
  // https://bugzilla.mozilla.org/show_bug.cgi?id=548397
  var computedStyle = getComputedStyle(el) || {};
  var position = computedStyle.position;
  var parents = [];

  if (position === 'fixed') {
    return [el];
  }

  var parent = el;
  while ((parent = parent.parentNode) && parent && parent.nodeType === 1) {
    var style = undefined;
    try {
      style = getComputedStyle(parent);
    } catch (err) {}

    if (typeof style === 'undefined' || style === null) {
      parents.push(parent);
      return parents;
    }

    var _style = style;
    var overflow = _style.overflow;
    var overflowX = _style.overflowX;
    var overflowY = _style.overflowY;

    if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
      if (position !== 'absolute' || ['relative', 'absolute', 'fixed'].indexOf(style.position) >= 0) {
        parents.push(parent);
      }
    }
  }

  parents.push(el.ownerDocument.body);

  // If the node is within a frame, account for the parent window scroll
  if (el.ownerDocument !== document) {
    parents.push(el.ownerDocument.defaultView);
  }

  return parents;
}

var uniqueId = (function () {
  var id = 0;
  return function () {
    return ++id;
  };
})();

var zeroPosCache = {};
var getOrigin = function getOrigin() {
  // getBoundingClientRect is unfortunately too accurate.  It introduces a pixel or two of
  // jitter as the user scrolls that messes with our ability to detect if two positions
  // are equivilant or not.  We place an element at the top left of the page that will
  // get the same jitter, so we can cancel the two out.
  var node = zeroElement;
  if (!node || !document.body.contains(node)) {
    node = document.createElement('div');
    node.setAttribute('data-tether-id', uniqueId());
    extend(node.style, {
      top: 0,
      left: 0,
      position: 'absolute'
    });

    document.body.appendChild(node);

    zeroElement = node;
  }

  var id = node.getAttribute('data-tether-id');
  if (typeof zeroPosCache[id] === 'undefined') {
    zeroPosCache[id] = getActualBoundingClientRect(node);

    // Clear the cache when this position call is done
    defer(function () {
      delete zeroPosCache[id];
    });
  }

  return zeroPosCache[id];
};

function removeUtilElements() {
  if (zeroElement) {
    document.body.removeChild(zeroElement);
  }
  zeroElement = null;
};

function getBounds(el) {
  var doc = undefined;
  if (el === document) {
    doc = document;
    el = document.documentElement;
  } else {
    doc = el.ownerDocument;
  }

  var docEl = doc.documentElement;

  var box = getActualBoundingClientRect(el);

  var origin = getOrigin();

  box.top -= origin.top;
  box.left -= origin.left;

  if (typeof box.width === 'undefined') {
    box.width = document.body.scrollWidth - box.left - box.right;
  }
  if (typeof box.height === 'undefined') {
    box.height = document.body.scrollHeight - box.top - box.bottom;
  }

  box.top = box.top - docEl.clientTop;
  box.left = box.left - docEl.clientLeft;
  box.right = doc.body.clientWidth - box.width - box.left;
  box.bottom = doc.body.clientHeight - box.height - box.top;

  return box;
}

function getOffsetParent(el) {
  return el.offsetParent || document.documentElement;
}

var _scrollBarSize = null;
function getScrollBarSize() {
  if (_scrollBarSize) {
    return _scrollBarSize;
  }
  var inner = document.createElement('div');
  inner.style.width = '100%';
  inner.style.height = '200px';

  var outer = document.createElement('div');
  extend(outer.style, {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    visibility: 'hidden',
    width: '200px',
    height: '150px',
    overflow: 'hidden'
  });

  outer.appendChild(inner);

  document.body.appendChild(outer);

  var widthContained = inner.offsetWidth;
  outer.style.overflow = 'scroll';
  var widthScroll = inner.offsetWidth;

  if (widthContained === widthScroll) {
    widthScroll = outer.clientWidth;
  }

  document.body.removeChild(outer);

  var width = widthContained - widthScroll;

  _scrollBarSize = { width: width, height: width };
  return _scrollBarSize;
}

function extend() {
  var out = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var args = [];

  Array.prototype.push.apply(args, arguments);

  args.slice(1).forEach(function (obj) {
    if (obj) {
      for (var key in obj) {
        if (({}).hasOwnProperty.call(obj, key)) {
          out[key] = obj[key];
        }
      }
    }
  });

  return out;
}

function removeClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    name.split(' ').forEach(function (cls) {
      if (cls.trim()) {
        el.classList.remove(cls);
      }
    });
  } else {
    var regex = new RegExp('(^| )' + name.split(' ').join('|') + '( |$)', 'gi');
    var className = getClassName(el).replace(regex, ' ');
    setClassName(el, className);
  }
}

function addClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    name.split(' ').forEach(function (cls) {
      if (cls.trim()) {
        el.classList.add(cls);
      }
    });
  } else {
    removeClass(el, name);
    var cls = getClassName(el) + (' ' + name);
    setClassName(el, cls);
  }
}

function hasClass(el, name) {
  if (typeof el.classList !== 'undefined') {
    return el.classList.contains(name);
  }
  var className = getClassName(el);
  return new RegExp('(^| )' + name + '( |$)', 'gi').test(className);
}

function getClassName(el) {
  // Can't use just SVGAnimatedString here since nodes within a Frame in IE have
  // completely separately SVGAnimatedString base classes
  if (el.className instanceof el.ownerDocument.defaultView.SVGAnimatedString) {
    return el.className.baseVal;
  }
  return el.className;
}

function setClassName(el, className) {
  el.setAttribute('class', className);
}

function updateClasses(el, add, all) {
  // Of the set of 'all' classes, we need the 'add' classes, and only the
  // 'add' classes to be set.
  all.forEach(function (cls) {
    if (add.indexOf(cls) === -1 && hasClass(el, cls)) {
      removeClass(el, cls);
    }
  });

  add.forEach(function (cls) {
    if (!hasClass(el, cls)) {
      addClass(el, cls);
    }
  });
}

var deferred = [];

var defer = function defer(fn) {
  deferred.push(fn);
};

var flush = function flush() {
  var fn = undefined;
  while (fn = deferred.pop()) {
    fn();
  }
};

var Evented = (function () {
  function Evented() {
    _classCallCheck(this, Evented);
  }

  _createClass(Evented, [{
    key: 'on',
    value: function on(event, handler, ctx) {
      var once = arguments.length <= 3 || arguments[3] === undefined ? false : arguments[3];

      if (typeof this.bindings === 'undefined') {
        this.bindings = {};
      }
      if (typeof this.bindings[event] === 'undefined') {
        this.bindings[event] = [];
      }
      this.bindings[event].push({ handler: handler, ctx: ctx, once: once });
    }
  }, {
    key: 'once',
    value: function once(event, handler, ctx) {
      this.on(event, handler, ctx, true);
    }
  }, {
    key: 'off',
    value: function off(event, handler) {
      if (typeof this.bindings === 'undefined' || typeof this.bindings[event] === 'undefined') {
        return;
      }

      if (typeof handler === 'undefined') {
        delete this.bindings[event];
      } else {
        var i = 0;
        while (i < this.bindings[event].length) {
          if (this.bindings[event][i].handler === handler) {
            this.bindings[event].splice(i, 1);
          } else {
            ++i;
          }
        }
      }
    }
  }, {
    key: 'trigger',
    value: function trigger(event) {
      if (typeof this.bindings !== 'undefined' && this.bindings[event]) {
        var i = 0;

        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        while (i < this.bindings[event].length) {
          var _bindings$event$i = this.bindings[event][i];
          var handler = _bindings$event$i.handler;
          var ctx = _bindings$event$i.ctx;
          var once = _bindings$event$i.once;

          var context = ctx;
          if (typeof context === 'undefined') {
            context = this;
          }

          handler.apply(context, args);

          if (once) {
            this.bindings[event].splice(i, 1);
          } else {
            ++i;
          }
        }
      }
    }
  }]);

  return Evented;
})();

TetherBase.Utils = {
  getActualBoundingClientRect: getActualBoundingClientRect,
  getScrollParents: getScrollParents,
  getBounds: getBounds,
  getOffsetParent: getOffsetParent,
  extend: extend,
  addClass: addClass,
  removeClass: removeClass,
  hasClass: hasClass,
  updateClasses: updateClasses,
  defer: defer,
  flush: flush,
  uniqueId: uniqueId,
  Evented: Evented,
  getScrollBarSize: getScrollBarSize,
  removeUtilElements: removeUtilElements
};
/* globals TetherBase, performance */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x6, _x7, _x8) { var _again = true; _function: while (_again) { var object = _x6, property = _x7, receiver = _x8; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x6 = parent; _x7 = property; _x8 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

if (typeof TetherBase === 'undefined') {
  throw new Error('You must include the utils.js file before tether.js');
}

var _TetherBase$Utils = TetherBase.Utils;
var getScrollParents = _TetherBase$Utils.getScrollParents;
var getBounds = _TetherBase$Utils.getBounds;
var getOffsetParent = _TetherBase$Utils.getOffsetParent;
var extend = _TetherBase$Utils.extend;
var addClass = _TetherBase$Utils.addClass;
var removeClass = _TetherBase$Utils.removeClass;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;
var flush = _TetherBase$Utils.flush;
var getScrollBarSize = _TetherBase$Utils.getScrollBarSize;
var removeUtilElements = _TetherBase$Utils.removeUtilElements;

function within(a, b) {
  var diff = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

  return a + diff >= b && b >= a - diff;
}

var transformKey = (function () {
  if (typeof document === 'undefined') {
    return '';
  }
  var el = document.createElement('div');

  var transforms = ['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform'];
  for (var i = 0; i < transforms.length; ++i) {
    var key = transforms[i];
    if (el.style[key] !== undefined) {
      return key;
    }
  }
})();

var tethers = [];

var position = function position() {
  tethers.forEach(function (tether) {
    tether.position(false);
  });
  flush();
};

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now !== 'undefined') {
    return performance.now();
  }
  return +new Date();
}

(function () {
  var lastCall = null;
  var lastDuration = null;
  var pendingTimeout = null;

  var tick = function tick() {
    if (typeof lastDuration !== 'undefined' && lastDuration > 16) {
      // We voluntarily throttle ourselves if we can't manage 60fps
      lastDuration = Math.min(lastDuration - 16, 250);

      // Just in case this is the last event, remember to position just once more
      pendingTimeout = setTimeout(tick, 250);
      return;
    }

    if (typeof lastCall !== 'undefined' && now() - lastCall < 10) {
      // Some browsers call events a little too frequently, refuse to run more than is reasonable
      return;
    }

    if (pendingTimeout != null) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }

    lastCall = now();
    position();
    lastDuration = now() - lastCall;
  };

  if (typeof window !== 'undefined' && typeof window.addEventListener !== 'undefined') {
    ['resize', 'scroll', 'touchmove'].forEach(function (event) {
      window.addEventListener(event, tick);
    });
  }
})();

var MIRROR_LR = {
  center: 'center',
  left: 'right',
  right: 'left'
};

var MIRROR_TB = {
  middle: 'middle',
  top: 'bottom',
  bottom: 'top'
};

var OFFSET_MAP = {
  top: 0,
  left: 0,
  middle: '50%',
  center: '50%',
  bottom: '100%',
  right: '100%'
};

var autoToFixedAttachment = function autoToFixedAttachment(attachment, relativeToAttachment) {
  var left = attachment.left;
  var top = attachment.top;

  if (left === 'auto') {
    left = MIRROR_LR[relativeToAttachment.left];
  }

  if (top === 'auto') {
    top = MIRROR_TB[relativeToAttachment.top];
  }

  return { left: left, top: top };
};

var attachmentToOffset = function attachmentToOffset(attachment) {
  var left = attachment.left;
  var top = attachment.top;

  if (typeof OFFSET_MAP[attachment.left] !== 'undefined') {
    left = OFFSET_MAP[attachment.left];
  }

  if (typeof OFFSET_MAP[attachment.top] !== 'undefined') {
    top = OFFSET_MAP[attachment.top];
  }

  return { left: left, top: top };
};

function addOffset() {
  var out = { top: 0, left: 0 };

  for (var _len = arguments.length, offsets = Array(_len), _key = 0; _key < _len; _key++) {
    offsets[_key] = arguments[_key];
  }

  offsets.forEach(function (_ref) {
    var top = _ref.top;
    var left = _ref.left;

    if (typeof top === 'string') {
      top = parseFloat(top, 10);
    }
    if (typeof left === 'string') {
      left = parseFloat(left, 10);
    }

    out.top += top;
    out.left += left;
  });

  return out;
}

function offsetToPx(offset, size) {
  if (typeof offset.left === 'string' && offset.left.indexOf('%') !== -1) {
    offset.left = parseFloat(offset.left, 10) / 100 * size.width;
  }
  if (typeof offset.top === 'string' && offset.top.indexOf('%') !== -1) {
    offset.top = parseFloat(offset.top, 10) / 100 * size.height;
  }

  return offset;
}

var parseOffset = function parseOffset(value) {
  var _value$split = value.split(' ');

  var _value$split2 = _slicedToArray(_value$split, 2);

  var top = _value$split2[0];
  var left = _value$split2[1];

  return { top: top, left: left };
};
var parseAttachment = parseOffset;

var TetherClass = (function (_Evented) {
  _inherits(TetherClass, _Evented);

  function TetherClass(options) {
    var _this = this;

    _classCallCheck(this, TetherClass);

    _get(Object.getPrototypeOf(TetherClass.prototype), 'constructor', this).call(this);
    this.position = this.position.bind(this);

    tethers.push(this);

    this.history = [];

    this.setOptions(options, false);

    TetherBase.modules.forEach(function (module) {
      if (typeof module.initialize !== 'undefined') {
        module.initialize.call(_this);
      }
    });

    this.position();
  }

  _createClass(TetherClass, [{
    key: 'getClass',
    value: function getClass() {
      var key = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
      var classes = this.options.classes;

      if (typeof classes !== 'undefined' && classes[key]) {
        return this.options.classes[key];
      } else if (this.options.classPrefix) {
        return this.options.classPrefix + '-' + key;
      } else {
        return key;
      }
    }
  }, {
    key: 'setOptions',
    value: function setOptions(options) {
      var _this2 = this;

      var pos = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      var defaults = {
        offset: '0 0',
        targetOffset: '0 0',
        targetAttachment: 'auto auto',
        classPrefix: 'tether'
      };

      this.options = extend(defaults, options);

      var _options = this.options;
      var element = _options.element;
      var target = _options.target;
      var targetModifier = _options.targetModifier;

      this.element = element;
      this.target = target;
      this.targetModifier = targetModifier;

      if (this.target === 'viewport') {
        this.target = document.body;
        this.targetModifier = 'visible';
      } else if (this.target === 'scroll-handle') {
        this.target = document.body;
        this.targetModifier = 'scroll-handle';
      }

      ['element', 'target'].forEach(function (key) {
        if (typeof _this2[key] === 'undefined') {
          throw new Error('Tether Error: Both element and target must be defined');
        }

        if (typeof _this2[key].jquery !== 'undefined') {
          _this2[key] = _this2[key][0];
        } else if (typeof _this2[key] === 'string') {
          _this2[key] = document.querySelector(_this2[key]);
        }
      });

      addClass(this.element, this.getClass('element'));
      if (!(this.options.addTargetClasses === false)) {
        addClass(this.target, this.getClass('target'));
      }

      if (!this.options.attachment) {
        throw new Error('Tether Error: You must provide an attachment');
      }

      this.targetAttachment = parseAttachment(this.options.targetAttachment);
      this.attachment = parseAttachment(this.options.attachment);
      this.offset = parseOffset(this.options.offset);
      this.targetOffset = parseOffset(this.options.targetOffset);

      if (typeof this.scrollParents !== 'undefined') {
        this.disable();
      }

      if (this.targetModifier === 'scroll-handle') {
        this.scrollParents = [this.target];
      } else {
        this.scrollParents = getScrollParents(this.target);
      }

      if (!(this.options.enabled === false)) {
        this.enable(pos);
      }
    }
  }, {
    key: 'getTargetBounds',
    value: function getTargetBounds() {
      if (typeof this.targetModifier !== 'undefined') {
        if (this.targetModifier === 'visible') {
          if (this.target === document.body) {
            return { top: pageYOffset, left: pageXOffset, height: innerHeight, width: innerWidth };
          } else {
            var bounds = getBounds(this.target);

            var out = {
              height: bounds.height,
              width: bounds.width,
              top: bounds.top,
              left: bounds.left
            };

            out.height = Math.min(out.height, bounds.height - (pageYOffset - bounds.top));
            out.height = Math.min(out.height, bounds.height - (bounds.top + bounds.height - (pageYOffset + innerHeight)));
            out.height = Math.min(innerHeight, out.height);
            out.height -= 2;

            out.width = Math.min(out.width, bounds.width - (pageXOffset - bounds.left));
            out.width = Math.min(out.width, bounds.width - (bounds.left + bounds.width - (pageXOffset + innerWidth)));
            out.width = Math.min(innerWidth, out.width);
            out.width -= 2;

            if (out.top < pageYOffset) {
              out.top = pageYOffset;
            }
            if (out.left < pageXOffset) {
              out.left = pageXOffset;
            }

            return out;
          }
        } else if (this.targetModifier === 'scroll-handle') {
          var bounds = undefined;
          var target = this.target;
          if (target === document.body) {
            target = document.documentElement;

            bounds = {
              left: pageXOffset,
              top: pageYOffset,
              height: innerHeight,
              width: innerWidth
            };
          } else {
            bounds = getBounds(target);
          }

          var style = getComputedStyle(target);

          var hasBottomScroll = target.scrollWidth > target.clientWidth || [style.overflow, style.overflowX].indexOf('scroll') >= 0 || this.target !== document.body;

          var scrollBottom = 0;
          if (hasBottomScroll) {
            scrollBottom = 15;
          }

          var height = bounds.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth) - scrollBottom;

          var out = {
            width: 15,
            height: height * 0.975 * (height / target.scrollHeight),
            left: bounds.left + bounds.width - parseFloat(style.borderLeftWidth) - 15
          };

          var fitAdj = 0;
          if (height < 408 && this.target === document.body) {
            fitAdj = -0.00011 * Math.pow(height, 2) - 0.00727 * height + 22.58;
          }

          if (this.target !== document.body) {
            out.height = Math.max(out.height, 24);
          }

          var scrollPercentage = this.target.scrollTop / (target.scrollHeight - height);
          out.top = scrollPercentage * (height - out.height - fitAdj) + bounds.top + parseFloat(style.borderTopWidth);

          if (this.target === document.body) {
            out.height = Math.max(out.height, 24);
          }

          return out;
        }
      } else {
        return getBounds(this.target);
      }
    }
  }, {
    key: 'clearCache',
    value: function clearCache() {
      this._cache = {};
    }
  }, {
    key: 'cache',
    value: function cache(k, getter) {
      // More than one module will often need the same DOM info, so
      // we keep a cache which is cleared on each position call
      if (typeof this._cache === 'undefined') {
        this._cache = {};
      }

      if (typeof this._cache[k] === 'undefined') {
        this._cache[k] = getter.call(this);
      }

      return this._cache[k];
    }
  }, {
    key: 'enable',
    value: function enable() {
      var _this3 = this;

      var pos = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      if (!(this.options.addTargetClasses === false)) {
        addClass(this.target, this.getClass('enabled'));
      }
      addClass(this.element, this.getClass('enabled'));
      this.enabled = true;

      this.scrollParents.forEach(function (parent) {
        if (parent !== _this3.target.ownerDocument) {
          parent.addEventListener('scroll', _this3.position);
        }
      });

      if (pos) {
        this.position();
      }
    }
  }, {
    key: 'disable',
    value: function disable() {
      var _this4 = this;

      removeClass(this.target, this.getClass('enabled'));
      removeClass(this.element, this.getClass('enabled'));
      this.enabled = false;

      if (typeof this.scrollParents !== 'undefined') {
        this.scrollParents.forEach(function (parent) {
          parent.removeEventListener('scroll', _this4.position);
        });
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      var _this5 = this;

      this.disable();

      tethers.forEach(function (tether, i) {
        if (tether === _this5) {
          tethers.splice(i, 1);
        }
      });

      // Remove any elements we were using for convenience from the DOM
      if (tethers.length === 0) {
        removeUtilElements();
      }
    }
  }, {
    key: 'updateAttachClasses',
    value: function updateAttachClasses(elementAttach, targetAttach) {
      var _this6 = this;

      elementAttach = elementAttach || this.attachment;
      targetAttach = targetAttach || this.targetAttachment;
      var sides = ['left', 'top', 'bottom', 'right', 'middle', 'center'];

      if (typeof this._addAttachClasses !== 'undefined' && this._addAttachClasses.length) {
        // updateAttachClasses can be called more than once in a position call, so
        // we need to clean up after ourselves such that when the last defer gets
        // ran it doesn't add any extra classes from previous calls.
        this._addAttachClasses.splice(0, this._addAttachClasses.length);
      }

      if (typeof this._addAttachClasses === 'undefined') {
        this._addAttachClasses = [];
      }
      var add = this._addAttachClasses;

      if (elementAttach.top) {
        add.push(this.getClass('element-attached') + '-' + elementAttach.top);
      }
      if (elementAttach.left) {
        add.push(this.getClass('element-attached') + '-' + elementAttach.left);
      }
      if (targetAttach.top) {
        add.push(this.getClass('target-attached') + '-' + targetAttach.top);
      }
      if (targetAttach.left) {
        add.push(this.getClass('target-attached') + '-' + targetAttach.left);
      }

      var all = [];
      sides.forEach(function (side) {
        all.push(_this6.getClass('element-attached') + '-' + side);
        all.push(_this6.getClass('target-attached') + '-' + side);
      });

      defer(function () {
        if (!(typeof _this6._addAttachClasses !== 'undefined')) {
          return;
        }

        updateClasses(_this6.element, _this6._addAttachClasses, all);
        if (!(_this6.options.addTargetClasses === false)) {
          updateClasses(_this6.target, _this6._addAttachClasses, all);
        }

        delete _this6._addAttachClasses;
      });
    }
  }, {
    key: 'position',
    value: function position() {
      var _this7 = this;

      var flushChanges = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      // flushChanges commits the changes immediately, leave true unless you are positioning multiple
      // tethers (in which case call Tether.Utils.flush yourself when you're done)

      if (!this.enabled) {
        return;
      }

      this.clearCache();

      // Turn 'auto' attachments into the appropriate corner or edge
      var targetAttachment = autoToFixedAttachment(this.targetAttachment, this.attachment);

      this.updateAttachClasses(this.attachment, targetAttachment);

      var elementPos = this.cache('element-bounds', function () {
        return getBounds(_this7.element);
      });

      var width = elementPos.width;
      var height = elementPos.height;

      if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
        var _lastSize = this.lastSize;

        // We cache the height and width to make it possible to position elements that are
        // getting hidden.
        width = _lastSize.width;
        height = _lastSize.height;
      } else {
        this.lastSize = { width: width, height: height };
      }

      var targetPos = this.cache('target-bounds', function () {
        return _this7.getTargetBounds();
      });
      var targetSize = targetPos;

      // Get an actual px offset from the attachment
      var offset = offsetToPx(attachmentToOffset(this.attachment), { width: width, height: height });
      var targetOffset = offsetToPx(attachmentToOffset(targetAttachment), targetSize);

      var manualOffset = offsetToPx(this.offset, { width: width, height: height });
      var manualTargetOffset = offsetToPx(this.targetOffset, targetSize);

      // Add the manually provided offset
      offset = addOffset(offset, manualOffset);
      targetOffset = addOffset(targetOffset, manualTargetOffset);

      // It's now our goal to make (element position + offset) == (target position + target offset)
      var left = targetPos.left + targetOffset.left - offset.left;
      var top = targetPos.top + targetOffset.top - offset.top;

      for (var i = 0; i < TetherBase.modules.length; ++i) {
        var _module2 = TetherBase.modules[i];
        var ret = _module2.position.call(this, {
          left: left,
          top: top,
          targetAttachment: targetAttachment,
          targetPos: targetPos,
          elementPos: elementPos,
          offset: offset,
          targetOffset: targetOffset,
          manualOffset: manualOffset,
          manualTargetOffset: manualTargetOffset,
          scrollbarSize: scrollbarSize,
          attachment: this.attachment
        });

        if (ret === false) {
          return false;
        } else if (typeof ret === 'undefined' || typeof ret !== 'object') {
          continue;
        } else {
          top = ret.top;
          left = ret.left;
        }
      }

      // We describe the position three different ways to give the optimizer
      // a chance to decide the best possible way to position the element
      // with the fewest repaints.
      var next = {
        // It's position relative to the page (absolute positioning when
        // the element is a child of the body)
        page: {
          top: top,
          left: left
        },

        // It's position relative to the viewport (fixed positioning)
        viewport: {
          top: top - pageYOffset,
          bottom: pageYOffset - top - height + innerHeight,
          left: left - pageXOffset,
          right: pageXOffset - left - width + innerWidth
        }
      };

      var doc = this.target.ownerDocument;
      var win = doc.defaultView;

      var scrollbarSize = undefined;
      if (win.innerHeight > doc.documentElement.clientHeight) {
        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
        next.viewport.bottom -= scrollbarSize.height;
      }

      if (win.innerWidth > doc.documentElement.clientWidth) {
        scrollbarSize = this.cache('scrollbar-size', getScrollBarSize);
        next.viewport.right -= scrollbarSize.width;
      }

      if (['', 'static'].indexOf(doc.body.style.position) === -1 || ['', 'static'].indexOf(doc.body.parentElement.style.position) === -1) {
        // Absolute positioning in the body will be relative to the page, not the 'initial containing block'
        next.page.bottom = doc.body.scrollHeight - top - height;
        next.page.right = doc.body.scrollWidth - left - width;
      }

      if (typeof this.options.optimizations !== 'undefined' && this.options.optimizations.moveElement !== false && !(typeof this.targetModifier !== 'undefined')) {
        (function () {
          var offsetParent = _this7.cache('target-offsetparent', function () {
            return getOffsetParent(_this7.target);
          });
          var offsetPosition = _this7.cache('target-offsetparent-bounds', function () {
            return getBounds(offsetParent);
          });
          var offsetParentStyle = getComputedStyle(offsetParent);
          var offsetParentSize = offsetPosition;

          var offsetBorder = {};
          ['Top', 'Left', 'Bottom', 'Right'].forEach(function (side) {
            offsetBorder[side.toLowerCase()] = parseFloat(offsetParentStyle['border' + side + 'Width']);
          });

          offsetPosition.right = doc.body.scrollWidth - offsetPosition.left - offsetParentSize.width + offsetBorder.right;
          offsetPosition.bottom = doc.body.scrollHeight - offsetPosition.top - offsetParentSize.height + offsetBorder.bottom;

          if (next.page.top >= offsetPosition.top + offsetBorder.top && next.page.bottom >= offsetPosition.bottom) {
            if (next.page.left >= offsetPosition.left + offsetBorder.left && next.page.right >= offsetPosition.right) {
              // We're within the visible part of the target's scroll parent
              var scrollTop = offsetParent.scrollTop;
              var scrollLeft = offsetParent.scrollLeft;

              // It's position relative to the target's offset parent (absolute positioning when
              // the element is moved to be a child of the target's offset parent).
              next.offset = {
                top: next.page.top - offsetPosition.top + scrollTop - offsetBorder.top,
                left: next.page.left - offsetPosition.left + scrollLeft - offsetBorder.left
              };
            }
          }
        })();
      }

      // We could also travel up the DOM and try each containing context, rather than only
      // looking at the body, but we're gonna get diminishing returns.

      this.move(next);

      this.history.unshift(next);

      if (this.history.length > 3) {
        this.history.pop();
      }

      if (flushChanges) {
        flush();
      }

      return true;
    }

    // THE ISSUE
  }, {
    key: 'move',
    value: function move(pos) {
      var _this8 = this;

      if (!(typeof this.element.parentNode !== 'undefined')) {
        return;
      }

      var same = {};

      for (var type in pos) {
        same[type] = {};

        for (var key in pos[type]) {
          var found = false;

          for (var i = 0; i < this.history.length; ++i) {
            var point = this.history[i];
            if (typeof point[type] !== 'undefined' && !within(point[type][key], pos[type][key])) {
              found = true;
              break;
            }
          }

          if (!found) {
            same[type][key] = true;
          }
        }
      }

      var css = { top: '', left: '', right: '', bottom: '' };

      var transcribe = function transcribe(_same, _pos) {
        var hasOptimizations = typeof _this8.options.optimizations !== 'undefined';
        var gpu = hasOptimizations ? _this8.options.optimizations.gpu : null;
        if (gpu !== false) {
          var yPos = undefined,
              xPos = undefined;
          if (_same.top) {
            css.top = 0;
            yPos = _pos.top;
          } else {
            css.bottom = 0;
            yPos = -_pos.bottom;
          }

          if (_same.left) {
            css.left = 0;
            xPos = _pos.left;
          } else {
            css.right = 0;
            xPos = -_pos.right;
          }

          if (window.matchMedia) {
            // HubSpot/tether#207
            var retina = window.matchMedia('only screen and (min-resolution: 1.3dppx)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3)').matches;
            if (!retina) {
              xPos = Math.round(xPos);
              yPos = Math.round(yPos);
            }
          }

          css[transformKey] = 'translateX(' + xPos + 'px) translateY(' + yPos + 'px)';

          if (transformKey !== 'msTransform') {
            // The Z transform will keep this in the GPU (faster, and prevents artifacts),
            // but IE9 doesn't support 3d transforms and will choke.
            css[transformKey] += " translateZ(0)";
          }
        } else {
          if (_same.top) {
            css.top = _pos.top + 'px';
          } else {
            css.bottom = _pos.bottom + 'px';
          }

          if (_same.left) {
            css.left = _pos.left + 'px';
          } else {
            css.right = _pos.right + 'px';
          }
        }
      };

      var moved = false;
      if ((same.page.top || same.page.bottom) && (same.page.left || same.page.right)) {
        css.position = 'absolute';
        transcribe(same.page, pos.page);
      } else if ((same.viewport.top || same.viewport.bottom) && (same.viewport.left || same.viewport.right)) {
        css.position = 'fixed';
        transcribe(same.viewport, pos.viewport);
      } else if (typeof same.offset !== 'undefined' && same.offset.top && same.offset.left) {
        (function () {
          css.position = 'absolute';
          var offsetParent = _this8.cache('target-offsetparent', function () {
            return getOffsetParent(_this8.target);
          });

          if (getOffsetParent(_this8.element) !== offsetParent) {
            defer(function () {
              _this8.element.parentNode.removeChild(_this8.element);
              offsetParent.appendChild(_this8.element);
            });
          }

          transcribe(same.offset, pos.offset);
          moved = true;
        })();
      } else {
        css.position = 'absolute';
        transcribe({ top: true, left: true }, pos.page);
      }

      if (!moved) {
        if (this.options.bodyElement) {
          this.options.bodyElement.appendChild(this.element);
        } else {
          var offsetParentIsBody = true;
          var currentNode = this.element.parentNode;
          while (currentNode && currentNode.nodeType === 1 && currentNode.tagName !== 'BODY') {
            if (getComputedStyle(currentNode).position !== 'static') {
              offsetParentIsBody = false;
              break;
            }

            currentNode = currentNode.parentNode;
          }

          if (!offsetParentIsBody) {
            this.element.parentNode.removeChild(this.element);
            this.element.ownerDocument.body.appendChild(this.element);
          }
        }
      }

      // Any css change will trigger a repaint, so let's avoid one if nothing changed
      var writeCSS = {};
      var write = false;
      for (var key in css) {
        var val = css[key];
        var elVal = this.element.style[key];

        if (elVal !== val) {
          write = true;
          writeCSS[key] = val;
        }
      }

      if (write) {
        defer(function () {
          extend(_this8.element.style, writeCSS);
          _this8.trigger('repositioned');
        });
      }
    }
  }]);

  return TetherClass;
})(Evented);

TetherClass.modules = [];

TetherBase.position = position;

var Tether = extend(TetherClass, TetherBase);
/* globals TetherBase */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _TetherBase$Utils = TetherBase.Utils;
var getBounds = _TetherBase$Utils.getBounds;
var extend = _TetherBase$Utils.extend;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;

var BOUNDS_FORMAT = ['left', 'top', 'right', 'bottom'];

function getBoundingRect(tether, to) {
  if (to === 'scrollParent') {
    to = tether.scrollParents[0];
  } else if (to === 'window') {
    to = [pageXOffset, pageYOffset, innerWidth + pageXOffset, innerHeight + pageYOffset];
  }

  if (to === document) {
    to = to.documentElement;
  }

  if (typeof to.nodeType !== 'undefined') {
    (function () {
      var node = to;
      var size = getBounds(to);
      var pos = size;
      var style = getComputedStyle(to);

      to = [pos.left, pos.top, size.width + pos.left, size.height + pos.top];

      // Account any parent Frames scroll offset
      if (node.ownerDocument !== document) {
        var win = node.ownerDocument.defaultView;
        to[0] += win.pageXOffset;
        to[1] += win.pageYOffset;
        to[2] += win.pageXOffset;
        to[3] += win.pageYOffset;
      }

      BOUNDS_FORMAT.forEach(function (side, i) {
        side = side[0].toUpperCase() + side.substr(1);
        if (side === 'Top' || side === 'Left') {
          to[i] += parseFloat(style['border' + side + 'Width']);
        } else {
          to[i] -= parseFloat(style['border' + side + 'Width']);
        }
      });
    })();
  }

  return to;
}

TetherBase.modules.push({
  position: function position(_ref) {
    var _this = this;

    var top = _ref.top;
    var left = _ref.left;
    var targetAttachment = _ref.targetAttachment;

    if (!this.options.constraints) {
      return true;
    }

    var _cache = this.cache('element-bounds', function () {
      return getBounds(_this.element);
    });

    var height = _cache.height;
    var width = _cache.width;

    if (width === 0 && height === 0 && typeof this.lastSize !== 'undefined') {
      var _lastSize = this.lastSize;

      // Handle the item getting hidden as a result of our positioning without glitching
      // the classes in and out
      width = _lastSize.width;
      height = _lastSize.height;
    }

    var targetSize = this.cache('target-bounds', function () {
      return _this.getTargetBounds();
    });

    var targetHeight = targetSize.height;
    var targetWidth = targetSize.width;

    var allClasses = [this.getClass('pinned'), this.getClass('out-of-bounds')];

    this.options.constraints.forEach(function (constraint) {
      var outOfBoundsClass = constraint.outOfBoundsClass;
      var pinnedClass = constraint.pinnedClass;

      if (outOfBoundsClass) {
        allClasses.push(outOfBoundsClass);
      }
      if (pinnedClass) {
        allClasses.push(pinnedClass);
      }
    });

    allClasses.forEach(function (cls) {
      ['left', 'top', 'right', 'bottom'].forEach(function (side) {
        allClasses.push(cls + '-' + side);
      });
    });

    var addClasses = [];

    var tAttachment = extend({}, targetAttachment);
    var eAttachment = extend({}, this.attachment);

    this.options.constraints.forEach(function (constraint) {
      var to = constraint.to;
      var attachment = constraint.attachment;
      var pin = constraint.pin;

      if (typeof attachment === 'undefined') {
        attachment = '';
      }

      var changeAttachX = undefined,
          changeAttachY = undefined;
      if (attachment.indexOf(' ') >= 0) {
        var _attachment$split = attachment.split(' ');

        var _attachment$split2 = _slicedToArray(_attachment$split, 2);

        changeAttachY = _attachment$split2[0];
        changeAttachX = _attachment$split2[1];
      } else {
        changeAttachX = changeAttachY = attachment;
      }

      var bounds = getBoundingRect(_this, to);

      if (changeAttachY === 'target' || changeAttachY === 'both') {
        if (top < bounds[1] && tAttachment.top === 'top') {
          top += targetHeight;
          tAttachment.top = 'bottom';
        }

        if (top + height > bounds[3] && tAttachment.top === 'bottom') {
          top -= targetHeight;
          tAttachment.top = 'top';
        }
      }

      if (changeAttachY === 'together') {
        if (tAttachment.top === 'top') {
          if (eAttachment.top === 'bottom' && top < bounds[1]) {
            top += targetHeight;
            tAttachment.top = 'bottom';

            top += height;
            eAttachment.top = 'top';
          } else if (eAttachment.top === 'top' && top + height > bounds[3] && top - (height - targetHeight) >= bounds[1]) {
            top -= height - targetHeight;
            tAttachment.top = 'bottom';

            eAttachment.top = 'bottom';
          }
        }

        if (tAttachment.top === 'bottom') {
          if (eAttachment.top === 'top' && top + height > bounds[3]) {
            top -= targetHeight;
            tAttachment.top = 'top';

            top -= height;
            eAttachment.top = 'bottom';
          } else if (eAttachment.top === 'bottom' && top < bounds[1] && top + (height * 2 - targetHeight) <= bounds[3]) {
            top += height - targetHeight;
            tAttachment.top = 'top';

            eAttachment.top = 'top';
          }
        }

        if (tAttachment.top === 'middle') {
          if (top + height > bounds[3] && eAttachment.top === 'top') {
            top -= height;
            eAttachment.top = 'bottom';
          } else if (top < bounds[1] && eAttachment.top === 'bottom') {
            top += height;
            eAttachment.top = 'top';
          }
        }
      }

      if (changeAttachX === 'target' || changeAttachX === 'both') {
        if (left < bounds[0] && tAttachment.left === 'left') {
          left += targetWidth;
          tAttachment.left = 'right';
        }

        if (left + width > bounds[2] && tAttachment.left === 'right') {
          left -= targetWidth;
          tAttachment.left = 'left';
        }
      }

      if (changeAttachX === 'together') {
        if (left < bounds[0] && tAttachment.left === 'left') {
          if (eAttachment.left === 'right') {
            left += targetWidth;
            tAttachment.left = 'right';

            left += width;
            eAttachment.left = 'left';
          } else if (eAttachment.left === 'left') {
            left += targetWidth;
            tAttachment.left = 'right';

            left -= width;
            eAttachment.left = 'right';
          }
        } else if (left + width > bounds[2] && tAttachment.left === 'right') {
          if (eAttachment.left === 'left') {
            left -= targetWidth;
            tAttachment.left = 'left';

            left -= width;
            eAttachment.left = 'right';
          } else if (eAttachment.left === 'right') {
            left -= targetWidth;
            tAttachment.left = 'left';

            left += width;
            eAttachment.left = 'left';
          }
        } else if (tAttachment.left === 'center') {
          if (left + width > bounds[2] && eAttachment.left === 'left') {
            left -= width;
            eAttachment.left = 'right';
          } else if (left < bounds[0] && eAttachment.left === 'right') {
            left += width;
            eAttachment.left = 'left';
          }
        }
      }

      if (changeAttachY === 'element' || changeAttachY === 'both') {
        if (top < bounds[1] && eAttachment.top === 'bottom') {
          top += height;
          eAttachment.top = 'top';
        }

        if (top + height > bounds[3] && eAttachment.top === 'top') {
          top -= height;
          eAttachment.top = 'bottom';
        }
      }

      if (changeAttachX === 'element' || changeAttachX === 'both') {
        if (left < bounds[0]) {
          if (eAttachment.left === 'right') {
            left += width;
            eAttachment.left = 'left';
          } else if (eAttachment.left === 'center') {
            left += width / 2;
            eAttachment.left = 'left';
          }
        }

        if (left + width > bounds[2]) {
          if (eAttachment.left === 'left') {
            left -= width;
            eAttachment.left = 'right';
          } else if (eAttachment.left === 'center') {
            left -= width / 2;
            eAttachment.left = 'right';
          }
        }
      }

      if (typeof pin === 'string') {
        pin = pin.split(',').map(function (p) {
          return p.trim();
        });
      } else if (pin === true) {
        pin = ['top', 'left', 'right', 'bottom'];
      }

      pin = pin || [];

      var pinned = [];
      var oob = [];

      if (top < bounds[1]) {
        if (pin.indexOf('top') >= 0) {
          top = bounds[1];
          pinned.push('top');
        } else {
          oob.push('top');
        }
      }

      if (top + height > bounds[3]) {
        if (pin.indexOf('bottom') >= 0) {
          top = bounds[3] - height;
          pinned.push('bottom');
        } else {
          oob.push('bottom');
        }
      }

      if (left < bounds[0]) {
        if (pin.indexOf('left') >= 0) {
          left = bounds[0];
          pinned.push('left');
        } else {
          oob.push('left');
        }
      }

      if (left + width > bounds[2]) {
        if (pin.indexOf('right') >= 0) {
          left = bounds[2] - width;
          pinned.push('right');
        } else {
          oob.push('right');
        }
      }

      if (pinned.length) {
        (function () {
          var pinnedClass = undefined;
          if (typeof _this.options.pinnedClass !== 'undefined') {
            pinnedClass = _this.options.pinnedClass;
          } else {
            pinnedClass = _this.getClass('pinned');
          }

          addClasses.push(pinnedClass);
          pinned.forEach(function (side) {
            addClasses.push(pinnedClass + '-' + side);
          });
        })();
      }

      if (oob.length) {
        (function () {
          var oobClass = undefined;
          if (typeof _this.options.outOfBoundsClass !== 'undefined') {
            oobClass = _this.options.outOfBoundsClass;
          } else {
            oobClass = _this.getClass('out-of-bounds');
          }

          addClasses.push(oobClass);
          oob.forEach(function (side) {
            addClasses.push(oobClass + '-' + side);
          });
        })();
      }

      if (pinned.indexOf('left') >= 0 || pinned.indexOf('right') >= 0) {
        eAttachment.left = tAttachment.left = false;
      }
      if (pinned.indexOf('top') >= 0 || pinned.indexOf('bottom') >= 0) {
        eAttachment.top = tAttachment.top = false;
      }

      if (tAttachment.top !== targetAttachment.top || tAttachment.left !== targetAttachment.left || eAttachment.top !== _this.attachment.top || eAttachment.left !== _this.attachment.left) {
        _this.updateAttachClasses(eAttachment, tAttachment);
        _this.trigger('update', {
          attachment: eAttachment,
          targetAttachment: tAttachment
        });
      }
    });

    defer(function () {
      if (!(_this.options.addTargetClasses === false)) {
        updateClasses(_this.target, addClasses, allClasses);
      }
      updateClasses(_this.element, addClasses, allClasses);
    });

    return { top: top, left: left };
  }
});
/* globals TetherBase */

'use strict';

var _TetherBase$Utils = TetherBase.Utils;
var getBounds = _TetherBase$Utils.getBounds;
var updateClasses = _TetherBase$Utils.updateClasses;
var defer = _TetherBase$Utils.defer;

TetherBase.modules.push({
  position: function position(_ref) {
    var _this = this;

    var top = _ref.top;
    var left = _ref.left;

    var _cache = this.cache('element-bounds', function () {
      return getBounds(_this.element);
    });

    var height = _cache.height;
    var width = _cache.width;

    var targetPos = this.getTargetBounds();

    var bottom = top + height;
    var right = left + width;

    var abutted = [];
    if (top <= targetPos.bottom && bottom >= targetPos.top) {
      ['left', 'right'].forEach(function (side) {
        var targetPosSide = targetPos[side];
        if (targetPosSide === left || targetPosSide === right) {
          abutted.push(side);
        }
      });
    }

    if (left <= targetPos.right && right >= targetPos.left) {
      ['top', 'bottom'].forEach(function (side) {
        var targetPosSide = targetPos[side];
        if (targetPosSide === top || targetPosSide === bottom) {
          abutted.push(side);
        }
      });
    }

    var allClasses = [];
    var addClasses = [];

    var sides = ['left', 'top', 'right', 'bottom'];
    allClasses.push(this.getClass('abutted'));
    sides.forEach(function (side) {
      allClasses.push(_this.getClass('abutted') + '-' + side);
    });

    if (abutted.length) {
      addClasses.push(this.getClass('abutted'));
    }

    abutted.forEach(function (side) {
      addClasses.push(_this.getClass('abutted') + '-' + side);
    });

    defer(function () {
      if (!(_this.options.addTargetClasses === false)) {
        updateClasses(_this.target, addClasses, allClasses);
      }
      updateClasses(_this.element, addClasses, allClasses);
    });

    return true;
  }
});
/* globals TetherBase */

'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

TetherBase.modules.push({
  position: function position(_ref) {
    var top = _ref.top;
    var left = _ref.left;

    if (!this.options.shift) {
      return;
    }

    var shift = this.options.shift;
    if (typeof this.options.shift === 'function') {
      shift = this.options.shift.call(this, { top: top, left: left });
    }

    var shiftTop = undefined,
        shiftLeft = undefined;
    if (typeof shift === 'string') {
      shift = shift.split(' ');
      shift[1] = shift[1] || shift[0];

      var _shift = shift;

      var _shift2 = _slicedToArray(_shift, 2);

      shiftTop = _shift2[0];
      shiftLeft = _shift2[1];

      shiftTop = parseFloat(shiftTop, 10);
      shiftLeft = parseFloat(shiftLeft, 10);
    } else {
      shiftTop = shift.top;
      shiftLeft = shift.left;
    }

    top += shiftTop;
    left += shiftLeft;

    return { top: top, left: left };
  }
});
return Tether;

}));

},{}]},{},[40,2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJidWlsZC9fZXhhbXBsZS9UaW1lbGluZUdyaWRCdWlsZGVyLmpzIiwiYnVpbGQvX2V4YW1wbGUvbWFpbi5qcyIsImJ1aWxkL2V4dGVuc2lvbnMvQ29weVBhc3RlTW9kdWxlLmpzIiwiYnVpbGQvZXh0ZW5zaW9ucy9FZGl0aW5nRXh0ZW5zaW9uLmpzIiwiYnVpbGQvZXh0ZW5zaW9ucy9TZWxlY3RvckV4dGVuc2lvbi5qcyIsImJ1aWxkL2dlb20vUG9pbnQuanMiLCJidWlsZC9nZW9tL1JlY3QuanMiLCJidWlsZC9pbnB1dC9FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIuanMiLCJidWlsZC9pbnB1dC9LZXlFeHByZXNzaW9uLmpzIiwiYnVpbGQvaW5wdXQvS2V5SW5wdXQuanMiLCJidWlsZC9pbnB1dC9LZXlzLmpzIiwiYnVpbGQvaW5wdXQvTW91c2VEcmFnRXZlbnRTdXBwb3J0LmpzIiwiYnVpbGQvaW5wdXQvTW91c2VFeHByZXNzaW9uLmpzIiwiYnVpbGQvaW5wdXQvTW91c2VJbnB1dC5qcyIsImJ1aWxkL21pc2MvRG9tLmpzIiwiYnVpbGQvbWlzYy9Qcm9wZXJ0eS5qcyIsImJ1aWxkL21pc2MvVXRpbC5qcyIsImJ1aWxkL21vZGVsL0dyaWRNb2RlbEluZGV4LmpzIiwiYnVpbGQvbW9kZWwvUXVlcnkuanMiLCJidWlsZC9tb2RlbC9SYW5nZS5qcyIsImJ1aWxkL21vZGVsL2RlZmF1bHQvRGVmYXVsdENlbGwuanMiLCJidWlsZC9tb2RlbC9kZWZhdWx0L0RlZmF1bHRDb2x1bW4uanMiLCJidWlsZC9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkLmpzIiwiYnVpbGQvbW9kZWwvZGVmYXVsdC9EZWZhdWx0Um93LmpzIiwiYnVpbGQvbW9kZWwvZmxleGkvRmxleENlbGwuanMiLCJidWlsZC9tb2RlbC9mbGV4aS9GbGV4R3JpZEJ1aWxkZXIuanMiLCJidWlsZC91aS9FeHRlbnNpYmlsaXR5LmpzIiwiYnVpbGQvdWkvR3JpZEVsZW1lbnQuanMiLCJidWlsZC91aS9HcmlkS2VybmVsLmpzIiwiYnVpbGQvdWkvUmVuZGVyZXIuanMiLCJidWlsZC91aS9XaWRnZXQuanMiLCJidWlsZC91aS9pbnRlcm5hbC9EZWZhdWx0Q2VsbFZpc3VhbC5qcyIsImJ1aWxkL3VpL2ludGVybmFsL0V2ZW50RW1pdHRlci5qcyIsImJ1aWxkL3VpL2ludGVybmFsL0dyaWRMYXlvdXQuanMiLCJidWlsZC92ZW5kb3IvY2xpcGJvYXJkLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1wcm9taXNlL2Rpc3QvZXM2LXByb21pc2UuanMiLCJub2RlX21vZHVsZXMvcGFwYXBhcnNlL3BhcGFwYXJzZS5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcmVmbGVjdC1tZXRhZGF0YS90ZW1wL1JlZmxlY3QuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2xpYi9hbHBoYWJldC5qcyIsIm5vZGVfbW9kdWxlcy9zaG9ydGlkL2xpYi9kZWNvZGUuanMiLCJub2RlX21vZHVsZXMvc2hvcnRpZC9saWIvZW5jb2RlLmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL2lzLXZhbGlkLmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL3JhbmRvbS9yYW5kb20tYnl0ZS1icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL3JhbmRvbS9yYW5kb20tZnJvbS1zZWVkLmpzIiwibm9kZV9tb2R1bGVzL3Nob3J0aWQvbGliL3V0aWwvY2x1c3Rlci13b3JrZXItaWQtYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy90ZXRoZXIvZGlzdC9qcy90ZXRoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDek5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNwb0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNybUNBO0FBQ0E7QUFDQTs7QUNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERlZmF1bHRHcmlkXzEgPSByZXF1aXJlKFwiLi8uLi9tb2RlbC9kZWZhdWx0L0RlZmF1bHRHcmlkXCIpO1xyXG52YXIgRmxleENlbGxfMSA9IHJlcXVpcmUoXCIuLy4uL21vZGVsL2ZsZXhpL0ZsZXhDZWxsXCIpO1xyXG52YXIgVGltZWxpbmVHcmlkQnVpbGRlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBUaW1lbGluZUdyaWRCdWlsZGVyKHJlc291cmNlcywgd2Vla3MpIHtcclxuICAgICAgICBpZiAocmVzb3VyY2VzID09PSB2b2lkIDApIHsgcmVzb3VyY2VzID0gMTAwOyB9XHJcbiAgICAgICAgaWYgKHdlZWtzID09PSB2b2lkIDApIHsgd2Vla3MgPSAxMDg7IH1cclxuICAgICAgICB0aGlzLnJlc291cmNlcyA9IHJlc291cmNlcztcclxuICAgICAgICB0aGlzLndlZWtzID0gd2Vla3M7XHJcbiAgICB9XHJcbiAgICBUaW1lbGluZUdyaWRCdWlsZGVyLnByb3RvdHlwZS5idWlsZCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbW9kZWwgPSBuZXcgRGVmYXVsdEdyaWRfMS5EZWZhdWx0R3JpZCgpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlQ29sdW1uUm93KG1vZGVsLmNlbGxzKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucmVzb3VyY2VzOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVSZXNvdXJjZVJvdyhtb2RlbC5jZWxscywgaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBtb2RlbDtcclxuICAgIH07XHJcbiAgICBUaW1lbGluZUdyaWRCdWlsZGVyLnByb3RvdHlwZS5jcmVhdGVDb2x1bW5Sb3cgPSBmdW5jdGlvbiAoY2VsbHMpIHtcclxuICAgICAgICBjZWxscy5wdXNoKG5ldyBGbGV4Q2VsbF8xLkZsZXhDZWxsKDAsIDAsIG51bGwsICcrJykpO1xyXG4gICAgICAgIHZhciBkYXRlID0gbW9uZGF5KCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndlZWtzOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNlbGwgPSBuZXcgRmxleENlbGxfMS5GbGV4Q2VsbChpICsgMSwgMCk7XHJcbiAgICAgICAgICAgIGNlbGwudmFsdWUgPSBkYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xyXG4gICAgICAgICAgICBjZWxscy5wdXNoKGNlbGwpO1xyXG4gICAgICAgICAgICBkYXRlLnNldERhdGUoZGF0ZS5nZXREYXRlKCkgKyA3KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgVGltZWxpbmVHcmlkQnVpbGRlci5wcm90b3R5cGUuY3JlYXRlUmVzb3VyY2VSb3cgPSBmdW5jdGlvbiAoY2VsbHMsIHJlc291cmNlKSB7XHJcbiAgICAgICAgY2VsbHMucHVzaChuZXcgRmxleENlbGxfMS5GbGV4Q2VsbCgwLCByZXNvdXJjZSArIDEsIG51bGwsIFwiUmVzb3VyY2UgI1wiICsgcmVzb3VyY2UpKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2Vla3M7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgY2VsbCA9IG5ldyBGbGV4Q2VsbF8xLkZsZXhDZWxsKGkgKyAxLCByZXNvdXJjZSArIDEpO1xyXG4gICAgICAgICAgICBjZWxsLnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgIGNlbGxzLnB1c2goY2VsbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBUaW1lbGluZUdyaWRCdWlsZGVyO1xyXG59KCkpO1xyXG5leHBvcnRzLlRpbWVsaW5lR3JpZEJ1aWxkZXIgPSBUaW1lbGluZUdyaWRCdWlsZGVyO1xyXG5mdW5jdGlvbiBtb25kYXkoKSB7XHJcbiAgICB2YXIgZCA9IG5ldyBEYXRlKCksIGRheSA9IGQuZ2V0RGF5KCksIGRpZmYgPSBkLmdldERhdGUoKSAtIGRheSArIChkYXkgPT0gMCA/IC02IDogMSk7IC8vIGFkanVzdCB3aGVuIGRheSBpcyBzdW5kYXlcclxuICAgIHJldHVybiBuZXcgRGF0ZShkLnNldERhdGUoZGlmZikpO1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVRpbWVsaW5lR3JpZEJ1aWxkZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBUaW1lbGluZUdyaWRCdWlsZGVyXzEgPSByZXF1aXJlKFwiLi9UaW1lbGluZUdyaWRCdWlsZGVyXCIpO1xyXG52YXIgR3JpZEVsZW1lbnRfMSA9IHJlcXVpcmUoXCIuLi91aS9HcmlkRWxlbWVudFwiKTtcclxudmFyIEZsZXhHcmlkQnVpbGRlcl8xID0gcmVxdWlyZShcIi4uL21vZGVsL2ZsZXhpL0ZsZXhHcmlkQnVpbGRlclwiKTtcclxudmFyIFNlbGVjdG9yRXh0ZW5zaW9uXzEgPSByZXF1aXJlKFwiLi4vZXh0ZW5zaW9ucy9TZWxlY3RvckV4dGVuc2lvblwiKTtcclxudmFyIEVkaXRpbmdFeHRlbnNpb25fMSA9IHJlcXVpcmUoXCIuLi9leHRlbnNpb25zL0VkaXRpbmdFeHRlbnNpb25cIik7XHJcbnZhciBDb3B5UGFzdGVNb2R1bGVfMSA9IHJlcXVpcmUoXCIuLi9leHRlbnNpb25zL0NvcHlQYXN0ZU1vZHVsZVwiKTtcclxudmFyIGJ1aWxkZXIgPSBuZXcgRmxleEdyaWRCdWlsZGVyXzEuRmxleEdyaWRCdWlsZGVyKDEsIDEpO1xyXG5idWlsZGVyID0gbmV3IEZsZXhHcmlkQnVpbGRlcl8xLkZsZXhHcmlkQnVpbGRlcig1MiAqIDUsIDI1MCk7XHJcbmJ1aWxkZXIgPSBuZXcgVGltZWxpbmVHcmlkQnVpbGRlcl8xLlRpbWVsaW5lR3JpZEJ1aWxkZXIoKTtcclxudmFyIG1vZGVsID0gYnVpbGRlci5idWlsZCgpO1xyXG52YXIgZ3JpZCA9IEdyaWRFbGVtZW50XzEuR3JpZEVsZW1lbnRcclxuICAgIC5jcmVhdGUoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3gnKSlcclxuICAgIC5leHRlbmQobmV3IFNlbGVjdG9yRXh0ZW5zaW9uXzEuU2VsZWN0b3JFeHRlbnNpb24oKSlcclxuICAgIC5leHRlbmQobmV3IEVkaXRpbmdFeHRlbnNpb25fMS5FZGl0aW5nRXh0ZW5zaW9uKCkpXHJcbiAgICAuZXh0ZW5kKG5ldyBDb3B5UGFzdGVNb2R1bGVfMS5Db3B5UGFzdGVNb2R1bGUoKSk7XHJcbmdyaWQubW9kZWwgPSBtb2RlbDtcclxuZ3JpZC5vbignaW5wdXQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgZS5jaGFuZ2VzLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcclxuICAgICAgICB4LmNlbGwudmFsdWUgPSB4LnZhbHVlO1xyXG4gICAgfSk7XHJcbiAgICBncmlkLmludmFsaWRhdGUoKTtcclxufSk7XHJcbi8vd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBlID0+XHJcbi8ve1xyXG4vLyAgICBpZiAoIWUuY3RybEtleSlcclxuLy8gICAgICAgIHJldHVybjtcclxuLy9cclxuLy8gICAgaWYgKGUua2V5ID09PSAnYScpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxMZWZ0IC0gMTAwO1xyXG4vLyAgICAgICAgLy90d2Vlbi5lbmFibGUoZ3JpZCwgeyBzY3JvbGxMZWZ0OiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbExlZnQgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsTGVmdCA9IHY7XHJcbi8vICAgIH1cclxuLy8gICAgaWYgKGUua2V5ID09PSAnZCcpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxMZWZ0ICsgMTAwO1xyXG4vLyAgICAgICAgLy90d2Vlbi5lbmFibGUoZ3JpZCwgeyBzY3JvbGxMZWZ0OiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbExlZnQgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsTGVmdCA9IHY7XHJcbi8vICAgIH1cclxuLy8gICAgaWYgKGUua2V5ID09PSAndycpXHJcbi8vICAgIHtcclxuLy8gICAgICAgIGxldCB2ID0gZ3JpZC5zY3JvbGxUb3AgLSAxMDA7XHJcbi8vICAgICAgICAvL3R3ZWVuLmVuYWJsZShncmlkLCB7IHNjcm9sbFRvcDogdiB9LCAuNSwgKCkgPT4gZ3JpZC5zY3JvbGxUb3AgPSB2KTtcclxuLy8gICAgICAgIGdyaWQuc2Nyb2xsVG9wID0gdjtcclxuLy8gICAgfVxyXG4vLyAgICBpZiAoZS5rZXkgPT09ICdzJylcclxuLy8gICAge1xyXG4vLyAgICAgICAgbGV0IHYgPSBncmlkLnNjcm9sbFRvcCArIDEwMDtcclxuLy8gICAgICAgIC8vdHdlZW4uZW5hYmxlKGdyaWQsIHsgc2Nyb2xsVG9wOiB2IH0sIC41LCAoKSA9PiBncmlkLnNjcm9sbFRvcCA9IHYpO1xyXG4vLyAgICAgICAgZ3JpZC5zY3JvbGxUb3AgPSB2O1xyXG4vLyAgICB9XHJcbi8vfSkgXHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haW4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn07XHJcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xyXG59O1xyXG52YXIgS2V5SW5wdXRfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9LZXlJbnB1dFwiKTtcclxudmFyIGNsaXBib2FyZF8xID0gcmVxdWlyZShcIi4uL3ZlbmRvci9jbGlwYm9hcmRcIik7XHJcbnZhciBXaWRnZXRfMSA9IHJlcXVpcmUoXCIuLi91aS9XaWRnZXRcIik7XHJcbnZhciBFeHRlbnNpYmlsaXR5XzEgPSByZXF1aXJlKFwiLi4vdWkvRXh0ZW5zaWJpbGl0eVwiKTtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1JlY3RcIik7XHJcbnZhciBSYW5nZV8xID0gcmVxdWlyZShcIi4uL21vZGVsL1JhbmdlXCIpO1xyXG52YXIgVGV0aGVyID0gcmVxdWlyZShcInRldGhlclwiKTtcclxudmFyIF8gPSByZXF1aXJlKFwiLi4vbWlzYy9VdGlsXCIpO1xyXG52YXIgRG9tID0gcmVxdWlyZShcIi4uL21pc2MvRG9tXCIpO1xyXG52YXIgUGFwYSA9IHJlcXVpcmUoXCJwYXBhcGFyc2VcIik7XHJcbnZhciBRdWVyeV8xID0gcmVxdWlyZShcIi4uL21vZGVsL1F1ZXJ5XCIpO1xyXG52YXIgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1BvaW50XCIpO1xyXG4vL0kga25vdy4uLiA6KFxyXG52YXIgTmV3TGluZSA9ICEhd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybS5tYXRjaCgvLipbV3ddW0lpXVtObl0uKi8pID8gJ1xcclxcbicgOiAnXFxuJztcclxudmFyIENvcHlQYXN0ZU1vZHVsZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBDb3B5UGFzdGVNb2R1bGUoKSB7XHJcbiAgICAgICAgdGhpcy5jb3B5TGlzdCA9IFtdO1xyXG4gICAgICAgIHRoaXMuY29weVJhbmdlID0gUmFuZ2VfMS5SYW5nZS5lbXB0eSgpO1xyXG4gICAgfVxyXG4gICAgQ29weVBhc3RlTW9kdWxlLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGdyaWQpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuZ3JpZCA9IGdyaWQ7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVFbGVtZW50cyhncmlkLnJvb3QpO1xyXG4gICAgICAgIEtleUlucHV0XzEuS2V5SW5wdXQuZm9yKGdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchQ1RSTCtLRVlfQycsIGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5jb3B5U2VsZWN0aW9uKCk7IH0pO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwYXN0ZScsIHRoaXMub25XaW5kb3dQYXN0ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICBncmlkLm9uKCdzY3JvbGwnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5hbGlnbk5ldCgpOyB9KTtcclxuICAgICAgICBncmlkLmtlcm5lbC5yb3V0aW5lcy5ob29rKCdiZWZvcmU6YmVnaW5FZGl0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMucmVzZXRDb3B5KCk7IH0pO1xyXG4gICAgICAgIGdyaWQua2VybmVsLnJvdXRpbmVzLmhvb2soJ2JlZm9yZTpjb21taXQnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5yZXNldENvcHkoKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUsIFwibW9kZWxJbmRleFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ21vZGVsSW5kZXgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShDb3B5UGFzdGVNb2R1bGUucHJvdG90eXBlLCBcImNhcHR1cmVTZWxlY3RvclwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ2NhcHR1cmVTZWxlY3RvcicpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUsIFwic2VsZWN0aW9uXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBDb3B5UGFzdGVNb2R1bGUucHJvdG90eXBlLmNyZWF0ZUVsZW1lbnRzID0gZnVuY3Rpb24gKHRhcmdldCkge1xyXG4gICAgICAgIHZhciBsYXllciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIGxheWVyLmNsYXNzTmFtZSA9ICdncmlkLWxheWVyJztcclxuICAgICAgICBEb20uY3NzKGxheWVyLCB7XHJcbiAgICAgICAgICAgIHBvaW50ZXJFdmVudHM6ICdub25lJyxcclxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICB3aWR0aDogdGFyZ2V0LmNsaWVudFdpZHRoICsgJ3B4JyxcclxuICAgICAgICAgICAgaGVpZ2h0OiB0YXJnZXQuY2xpZW50SGVpZ2h0ICsgJ3B4JyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0YXJnZXQucGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUobGF5ZXIsIHRhcmdldCk7XHJcbiAgICAgICAgdmFyIHQgPSBuZXcgVGV0aGVyKHtcclxuICAgICAgICAgICAgZWxlbWVudDogbGF5ZXIsXHJcbiAgICAgICAgICAgIHRhcmdldDogdGFyZ2V0LFxyXG4gICAgICAgICAgICBhdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6ICdtaWRkbGUgY2VudGVyJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0LnBvc2l0aW9uKCk7XHJcbiAgICAgICAgdGhpcy5sYXllciA9IGxheWVyO1xyXG4gICAgICAgIHRoaXMuY29weU5ldCA9IENvcHlOZXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH07XHJcbiAgICBDb3B5UGFzdGVNb2R1bGUucHJvdG90eXBlLmNvcHlTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5kb0NvcHkodGhpcy5zZWxlY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuYWxpZ25OZXQoKTtcclxuICAgIH07XHJcbiAgICBDb3B5UGFzdGVNb2R1bGUucHJvdG90eXBlLnJlc2V0Q29weSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLmRvQ29weShbXSk7XHJcbiAgICAgICAgdGhpcy5hbGlnbk5ldCgpO1xyXG4gICAgfTtcclxuICAgIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUuZG9Db3B5ID0gZnVuY3Rpb24gKGNlbGxzLCBkZWxpbWl0ZXIpIHtcclxuICAgICAgICBpZiAoZGVsaW1pdGVyID09PSB2b2lkIDApIHsgZGVsaW1pdGVyID0gJ1xcdCc7IH1cclxuICAgICAgICB0aGlzLmNvcHlMaXN0ID0gY2VsbHM7XHJcbiAgICAgICAgdmFyIHJhbmdlID0gdGhpcy5jb3B5UmFuZ2UgPSBSYW5nZV8xLlJhbmdlLmNyZWF0ZSh0aGlzLmdyaWQubW9kZWwsIGNlbGxzKTtcclxuICAgICAgICB2YXIgdGV4dCA9ICcnO1xyXG4gICAgICAgIGlmICghY2VsbHMubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIHJyID0gcmFuZ2UubHRyWzBdLnJvd1JlZjtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlLmx0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IHJhbmdlLmx0cltpXTtcclxuICAgICAgICAgICAgaWYgKHJyICE9PSBjLnJvd1JlZikge1xyXG4gICAgICAgICAgICAgICAgdGV4dCArPSBOZXdMaW5lO1xyXG4gICAgICAgICAgICAgICAgcnIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0ZXh0ICs9IGMudmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChpIDwgKHJhbmdlLmx0ci5sZW5ndGggLSAxKSAmJiByYW5nZS5sdHJbaSArIDFdLnJvd1JlZiA9PT0gcnIpIHtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gZGVsaW1pdGVyO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNsaXBib2FyZF8xLkNsaXBib2FyZC5jb3B5KHRleHQpO1xyXG4gICAgfTtcclxuICAgIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUuZG9QYXN0ZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgZ3JpZCA9IF9hLmdyaWQsIG1vZGVsSW5kZXggPSBfYS5tb2RlbEluZGV4LCBzZWxlY3Rpb24gPSBfYS5zZWxlY3Rpb247XHJcbiAgICAgICAgaWYgKCFzZWxlY3Rpb24ubGVuZ3RoKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgdmFyIGZvY3VzZWRDZWxsID0gbW9kZWxJbmRleC5maW5kQ2VsbChzZWxlY3Rpb25bMF0pO1xyXG4gICAgICAgIHZhciBwYXJzZWQgPSBQYXBhLnBhcnNlKHRleHQsIHtcclxuICAgICAgICAgICAgZGVsaW1pdGVyOiB0ZXh0LmluZGV4T2YoJ1xcdCcpID49IDAgPyAnXFx0JyA6IHVuZGVmaW5lZCxcclxuICAgICAgICB9KTtcclxuICAgICAgICB2YXIgZGF0YSA9IHBhcnNlZC5kYXRhLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5sZW5ndGggPiAxIHx8ICh4Lmxlbmd0aCA9PSAxICYmICEheFswXSk7IH0pO1xyXG4gICAgICAgIGlmICghZGF0YS5sZW5ndGgpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgd2lkdGggPSBfLm1heChkYXRhLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5sZW5ndGg7IH0pLmxlbmd0aDtcclxuICAgICAgICB2YXIgaGVpZ2h0ID0gZGF0YS5sZW5ndGg7XHJcbiAgICAgICAgdmFyIHN0YXJ0VmVjdG9yID0gbmV3IFBvaW50XzEuUG9pbnQoZm9jdXNlZENlbGwuY29sUmVmLCBmb2N1c2VkQ2VsbC5yb3dSZWYpO1xyXG4gICAgICAgIHZhciBlbmRWZWN0b3IgPSBzdGFydFZlY3Rvci5hZGQobmV3IFBvaW50XzEuUG9pbnQod2lkdGgsIGhlaWdodCkpO1xyXG4gICAgICAgIHZhciBwYXN0ZVJhbmdlID0gUXVlcnlfMS5RdWVyeS5vdmVyKGdyaWQubW9kZWwpLnZlY3RvcihzdGFydFZlY3RvciwgZW5kVmVjdG9yKTtcclxuICAgICAgICB2YXIgY2hhbmdlcyA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2IgPSBwYXN0ZVJhbmdlLmx0cjsgX2kgPCBfYi5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFyIGNlbGwgPSBfYltfaV07XHJcbiAgICAgICAgICAgIHZhciB4eSA9IG5ldyBQb2ludF8xLlBvaW50KGNlbGwuY29sUmVmLCBjZWxsLnJvd1JlZikuc3VidHJhY3Qoc3RhcnRWZWN0b3IpO1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW3h5LnldW3h5LnhdIHx8ICcnO1xyXG4gICAgICAgICAgICBjaGFuZ2VzW2NlbGwucmVmXSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmdyaWQua2VybmVsLmNvbW1hbmRzLmV4ZWMoJ2NvbW1pdCcsIGNoYW5nZXMpO1xyXG4gICAgICAgIHRoaXMuZ3JpZC5rZXJuZWwuY29tbWFuZHMuZXhlYygnc2VsZWN0JywgcGFzdGVSYW5nZS5sdHIubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnJlZjsgfSkpO1xyXG4gICAgfTtcclxuICAgIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUuYWxpZ25OZXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgZ3JpZCA9IF9hLmdyaWQsIGNvcHlMaXN0ID0gX2EuY29weUxpc3QsIGNvcHlOZXQgPSBfYS5jb3B5TmV0O1xyXG4gICAgICAgIGlmIChjb3B5TGlzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBJbXByb3ZlIHRoZSBzaGl0IG91dCBvZiB0aGlzOlxyXG4gICAgICAgICAgICB2YXIgbmV0UmVjdCA9IFJlY3RfMS5SZWN0LmZyb21NYW55KGNvcHlMaXN0Lm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4gZ3JpZC5nZXRDZWxsVmlld1JlY3QoeCk7IH0pKTtcclxuICAgICAgICAgICAgY29weU5ldC5nb3RvKG5ldFJlY3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgY29weU5ldC5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUub25XaW5kb3dQYXN0ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgdmFyIGFlID0gZG9jdW1lbnQuYWN0aXZlRWxlbWVudDtcclxuICAgICAgICB3aGlsZSAoISFhZSkge1xyXG4gICAgICAgICAgICBpZiAoISFhZS5jbGFzc05hbWUgJiYgYWUuY2xhc3NOYW1lLmluZGV4T2YoJ2dyaWQnKSA+PSAwKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGFlID0gYWUucGFyZW50RWxlbWVudDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhZSlcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0ZXh0ID0gZS5jbGlwYm9hcmREYXRhLmdldERhdGEoJ3RleHQvcGxhaW4nKTtcclxuICAgICAgICBpZiAodGV4dCAhPT0gbnVsbCAmJiB0ZXh0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5kb1Bhc3RlKHRleHQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gQ29weVBhc3RlTW9kdWxlO1xyXG59KCkpO1xyXG5fX2RlY29yYXRlKFtcclxuICAgIEV4dGVuc2liaWxpdHlfMS52YXJpYWJsZSgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIENvcHlOZXQpXHJcbl0sIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUsIFwiY29weU5ldFwiLCB2b2lkIDApO1xyXG5fX2RlY29yYXRlKFtcclxuICAgIEV4dGVuc2liaWxpdHlfMS5jb21tYW5kKCksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtdKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXHJcbl0sIENvcHlQYXN0ZU1vZHVsZS5wcm90b3R5cGUsIFwiY29weVNlbGVjdGlvblwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEuY29tbWFuZCgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbXSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxyXG5dLCBDb3B5UGFzdGVNb2R1bGUucHJvdG90eXBlLCBcInJlc2V0Q29weVwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEucm91dGluZSgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbQXJyYXksIFN0cmluZ10pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcclxuXSwgQ29weVBhc3RlTW9kdWxlLnByb3RvdHlwZSwgXCJkb0NvcHlcIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLnJvdXRpbmUoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW1N0cmluZ10pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcclxuXSwgQ29weVBhc3RlTW9kdWxlLnByb3RvdHlwZSwgXCJkb1Bhc3RlXCIsIG51bGwpO1xyXG5leHBvcnRzLkNvcHlQYXN0ZU1vZHVsZSA9IENvcHlQYXN0ZU1vZHVsZTtcclxudmFyIENvcHlOZXQgPSAoZnVuY3Rpb24gKF9zdXBlcikge1xyXG4gICAgX19leHRlbmRzKENvcHlOZXQsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBDb3B5TmV0KCkge1xyXG4gICAgICAgIHJldHVybiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xyXG4gICAgfVxyXG4gICAgQ29weU5ldC5jcmVhdGUgPSBmdW5jdGlvbiAoY29udGFpbmVyKSB7XHJcbiAgICAgICAgdmFyIHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLW5ldCBncmlkLW5ldC1jb3B5JztcclxuICAgICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocm9vdCk7XHJcbiAgICAgICAgRG9tLmNzcyhyb290LCB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxyXG4gICAgICAgICAgICBsZWZ0OiAnMHB4JyxcclxuICAgICAgICAgICAgdG9wOiAnMHB4JyxcclxuICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBuZXcgQ29weU5ldChyb290KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gQ29weU5ldDtcclxufShXaWRnZXRfMS5BYnNXaWRnZXRCYXNlKSk7XHJcbmV4cG9ydHMuQ29weU5ldCA9IENvcHlOZXQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvcHlQYXN0ZU1vZHVsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIF9fZXh0ZW5kcyA9ICh0aGlzICYmIHRoaXMuX19leHRlbmRzKSB8fCBmdW5jdGlvbiAoZCwgYikge1xyXG4gICAgZm9yICh2YXIgcCBpbiBiKSBpZiAoYi5oYXNPd25Qcm9wZXJ0eShwKSkgZFtwXSA9IGJbcF07XHJcbiAgICBmdW5jdGlvbiBfXygpIHsgdGhpcy5jb25zdHJ1Y3RvciA9IGQ7IH1cclxuICAgIGQucHJvdG90eXBlID0gYiA9PT0gbnVsbCA/IE9iamVjdC5jcmVhdGUoYikgOiAoX18ucHJvdG90eXBlID0gYi5wcm90b3R5cGUsIG5ldyBfXygpKTtcclxufTtcclxudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xyXG4gICAgdmFyIGMgPSBhcmd1bWVudHMubGVuZ3RoLCByID0gYyA8IDMgPyB0YXJnZXQgOiBkZXNjID09PSBudWxsID8gZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodGFyZ2V0LCBrZXkpIDogZGVzYywgZDtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XHJcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xyXG4gICAgcmV0dXJuIGMgPiAzICYmIHIgJiYgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwga2V5LCByKSwgcjtcclxufTtcclxudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QubWV0YWRhdGEgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIFJlZmxlY3QubWV0YWRhdGEoaywgdik7XHJcbn07XHJcbnZhciBLZXlJbnB1dF8xID0gcmVxdWlyZShcIi4uL2lucHV0L0tleUlucHV0XCIpO1xyXG52YXIgTW91c2VJbnB1dF8xID0gcmVxdWlyZShcIi4uL2lucHV0L01vdXNlSW5wdXRcIik7XHJcbnZhciBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIik7XHJcbnZhciBfID0gcmVxdWlyZShcIi4uL21pc2MvVXRpbFwiKTtcclxudmFyIFRldGhlciA9IHJlcXVpcmUoXCJ0ZXRoZXJcIik7XHJcbnZhciBEb20gPSByZXF1aXJlKFwiLi4vbWlzYy9Eb21cIik7XHJcbnZhciBXaWRnZXRfMSA9IHJlcXVpcmUoXCIuLi91aS9XaWRnZXRcIik7XHJcbnZhciBFeHRlbnNpYmlsaXR5XzEgPSByZXF1aXJlKFwiLi4vdWkvRXh0ZW5zaWJpbGl0eVwiKTtcclxudmFyIFZlY3RvcnMgPSB7XHJcbiAgICBub3J0aDogbmV3IFBvaW50XzEuUG9pbnQoMCwgLTEpLFxyXG4gICAgc291dGg6IG5ldyBQb2ludF8xLlBvaW50KDAsIDEpLFxyXG4gICAgZWFzdDogbmV3IFBvaW50XzEuUG9pbnQoMSwgMCksXHJcbiAgICB3ZXN0OiBuZXcgUG9pbnRfMS5Qb2ludCgtMSwgMCksXHJcbn07XHJcbnZhciBFZGl0aW5nRXh0ZW5zaW9uID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEVkaXRpbmdFeHRlbnNpb24oKSB7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZ0RldGFpbGVkID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBFZGl0aW5nRXh0ZW5zaW9uLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKGdyaWQsIGtlcm5lbCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5ncmlkID0gZ3JpZDtcclxuICAgICAgICB0aGlzLmNyZWF0ZUVsZW1lbnRzKGdyaWQucm9vdCk7XHJcbiAgICAgICAgS2V5SW5wdXRfMS5LZXlJbnB1dC5mb3IodGhpcy5pbnB1dC5yb290KVxyXG4gICAgICAgICAgICAub24oJyFFU0NBUEUnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5lbmRFZGl0KGZhbHNlKTsgfSlcclxuICAgICAgICAgICAgLm9uKCchRU5URVInLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmVhc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLmVhc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5lbmRFZGl0VG9OZWlnaGJvcihWZWN0b3JzLndlc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJ1VQX0FSUk9XJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy5ub3J0aCk7IH0pXHJcbiAgICAgICAgICAgIC5vbignRE9XTl9BUlJPVycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuc291dGgpOyB9KVxyXG4gICAgICAgICAgICAub24oJ1JJR0hUX0FSUk9XJywgZnVuY3Rpb24gKCkgeyBpZiAoIV90aGlzLmlzRWRpdGluZ0RldGFpbGVkKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmVuZEVkaXRUb05laWdoYm9yKFZlY3RvcnMuZWFzdCk7XHJcbiAgICAgICAgfSB9KVxyXG4gICAgICAgICAgICAub24oJ0xFRlRfQVJST1cnLCBmdW5jdGlvbiAoKSB7IGlmICghX3RoaXMuaXNFZGl0aW5nRGV0YWlsZWQpIHtcclxuICAgICAgICAgICAgX3RoaXMuZW5kRWRpdFRvTmVpZ2hib3IoVmVjdG9ycy53ZXN0KTtcclxuICAgICAgICB9IH0pO1xyXG4gICAgICAgIE1vdXNlSW5wdXRfMS5Nb3VzZUlucHV0LmZvcih0aGlzLmlucHV0LnJvb3QpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSB0cnVlOyB9KTtcclxuICAgICAgICBLZXlJbnB1dF8xLktleUlucHV0LmZvcih0aGlzLmdyaWQucm9vdClcclxuICAgICAgICAgICAgLm9uKCchREVMRVRFJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuZXJhc2UoKTsgfSlcclxuICAgICAgICAgICAgLm9uKCchQkFDS1NQQUNFJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuYmVnaW5FZGl0KCcnKTsgfSk7XHJcbiAgICAgICAgTW91c2VJbnB1dF8xLk1vdXNlSW5wdXQuZm9yKHRoaXMuZ3JpZC5yb290KVxyXG4gICAgICAgICAgICAub24oJ0RCTENMSUNLOlBSSU1BUlknLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5iZWdpbkVkaXQoKTsgfSk7XHJcbiAgICAgICAgZ3JpZC5vbigna2V5cHJlc3MnLCBmdW5jdGlvbiAoZSkgeyByZXR1cm4gX3RoaXMuYmVnaW5FZGl0KFN0cmluZy5mcm9tQ2hhckNvZGUoZS5jaGFyQ29kZSkpOyB9KTtcclxuICAgICAgICBrZXJuZWwucm91dGluZXMuaG9vaygnYmVmb3JlOmRvU2VsZWN0JywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuZW5kRWRpdCh0cnVlKTsgfSk7XHJcbiAgICB9O1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLCBcIm1vZGVsSW5kZXhcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5ncmlkLmtlcm5lbC52YXJpYWJsZXMuZ2V0KCdtb2RlbEluZGV4Jyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUsIFwicHJpbWFyeVNlbGVjdG9yXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgncHJpbWFyeVNlbGVjdG9yJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUsIFwic2VsZWN0aW9uXCIsIHtcclxuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ3JpZC5rZXJuZWwudmFyaWFibGVzLmdldCgnc2VsZWN0aW9uJyk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBFZGl0aW5nRXh0ZW5zaW9uLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50cyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICB2YXIgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgbGF5ZXIuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuICAgICAgICBsYXllci5zdHlsZS53aWR0aCA9IHRhcmdldC5jbGllbnRXaWR0aCArICdweCc7XHJcbiAgICAgICAgbGF5ZXIuc3R5bGUuaGVpZ2h0ID0gdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCc7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgIHZhciB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLmlucHV0ID0gSW5wdXQuY3JlYXRlKGxheWVyKTtcclxuICAgIH07XHJcbiAgICBFZGl0aW5nRXh0ZW5zaW9uLnByb3RvdHlwZS5iZWdpbkVkaXQgPSBmdW5jdGlvbiAob3ZlcnJpZGUpIHtcclxuICAgICAgICBpZiAob3ZlcnJpZGUgPT09IHZvaWQgMCkgeyBvdmVycmlkZSA9IG51bGw7IH1cclxuICAgICAgICBpZiAodGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB2YXIgaW5wdXQgPSB0aGlzLmlucHV0O1xyXG4gICAgICAgIHZhciBjZWxsID0gdGhpcy5tb2RlbEluZGV4LmZpbmRDZWxsKHRoaXMuc2VsZWN0aW9uWzBdKTtcclxuICAgICAgICBpZiAoISFvdmVycmlkZSkge1xyXG4gICAgICAgICAgICBpbnB1dC52YWwob3ZlcnJpZGUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgaW5wdXQudmFsKGNlbGwudmFsdWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpbnB1dC5nb3RvKHRoaXMucHJpbWFyeVNlbGVjdG9yLnZpZXdSZWN0KTtcclxuICAgICAgICBpbnB1dC5mb2N1cygpO1xyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nRGV0YWlsZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRWRpdGluZyA9IHRydWU7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9O1xyXG4gICAgRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUuZW5kRWRpdCA9IGZ1bmN0aW9uIChjb21taXQpIHtcclxuICAgICAgICBpZiAoY29tbWl0ID09PSB2b2lkIDApIHsgY29tbWl0ID0gdHJ1ZTsgfVxyXG4gICAgICAgIGlmICghdGhpcy5pc0VkaXRpbmcpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB2YXIgX2EgPSB0aGlzLCBncmlkID0gX2EuZ3JpZCwgaW5wdXQgPSBfYS5pbnB1dCwgc2VsZWN0aW9uID0gX2Euc2VsZWN0aW9uO1xyXG4gICAgICAgIHZhciBuZXdWYWx1ZSA9IGlucHV0LnZhbCgpO1xyXG4gICAgICAgIGlucHV0LmhpZGUoKTtcclxuICAgICAgICBpbnB1dC52YWwoJycpO1xyXG4gICAgICAgIGdyaWQuZm9jdXMoKTtcclxuICAgICAgICBpZiAoY29tbWl0ICYmICEhc2VsZWN0aW9uLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbW1pdFVuaWZvcm0oc2VsZWN0aW9uLnNsaWNlKDAsIDEpLCBuZXdWYWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaXNFZGl0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5pc0VkaXRpbmdEZXRhaWxlZCA9IGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfTtcclxuICAgIEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLmVuZEVkaXRUb05laWdoYm9yID0gZnVuY3Rpb24gKHZlY3RvciwgY29tbWl0KSB7XHJcbiAgICAgICAgaWYgKGNvbW1pdCA9PT0gdm9pZCAwKSB7IGNvbW1pdCA9IHRydWU7IH1cclxuICAgICAgICBpZiAodGhpcy5lbmRFZGl0KGNvbW1pdCkpIHtcclxuICAgICAgICAgICAgdGhpcy5ncmlkLmtlcm5lbC5jb21tYW5kcy5leGVjKCdzZWxlY3ROZWlnaGJvcicsIHZlY3Rvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9O1xyXG4gICAgRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUuZXJhc2UgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IHRoaXMuc2VsZWN0aW9uO1xyXG4gICAgICAgIGlmICh0aGlzLmlzRWRpdGluZylcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY29tbWl0VW5pZm9ybShzZWxlY3Rpb24sICcnKTtcclxuICAgIH07XHJcbiAgICBFZGl0aW5nRXh0ZW5zaW9uLnByb3RvdHlwZS5jb21taXRVbmlmb3JtID0gZnVuY3Rpb24gKGNlbGxzLCB1bmlmb3JtVmFsdWUpIHtcclxuICAgICAgICB2YXIgY2hhbmdlcyA9IF8uemlwUGFpcnMoY2VsbHMubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBbeCwgdW5pZm9ybVZhbHVlXTsgfSkpO1xyXG4gICAgICAgIHRoaXMuY29tbWl0KGNoYW5nZXMpO1xyXG4gICAgfTtcclxuICAgIEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLmNvbW1pdCA9IGZ1bmN0aW9uIChjaGFuZ2VzKSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgZ3JpZCA9IF9hLmdyaWQsIG1vZGVsSW5kZXggPSBfYS5tb2RlbEluZGV4O1xyXG4gICAgICAgIHZhciBldnQgPSB7XHJcbiAgICAgICAgICAgIGNoYW5nZXM6IF8udW56aXBQYWlycyhjaGFuZ2VzKS5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICh7XHJcbiAgICAgICAgICAgICAgICBjZWxsOiBtb2RlbEluZGV4LmZpbmRDZWxsKHhbMF0pLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IHhbMV0sXHJcbiAgICAgICAgICAgIH0pOyB9KVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgZ3JpZC5lbWl0KCdpbnB1dCcsIGV2dCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEVkaXRpbmdFeHRlbnNpb247XHJcbn0oKSk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLnZhcmlhYmxlKCksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgSW5wdXQpXHJcbl0sIEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLCBcImlucHV0XCIsIHZvaWQgMCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIEV4dGVuc2liaWxpdHlfMS5yb3V0aW5lKCksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtTdHJpbmddKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCBCb29sZWFuKVxyXG5dLCBFZGl0aW5nRXh0ZW5zaW9uLnByb3RvdHlwZSwgXCJiZWdpbkVkaXRcIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIEV4dGVuc2liaWxpdHlfMS5yb3V0aW5lKCksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtCb29sZWFuXSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgQm9vbGVhbilcclxuXSwgRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUsIFwiZW5kRWRpdFwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEuY29tbWFuZCgpLFxyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLnJvdXRpbmUoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW10pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcclxuXSwgRWRpdGluZ0V4dGVuc2lvbi5wcm90b3R5cGUsIFwiZXJhc2VcIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5LCBPYmplY3RdKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXHJcbl0sIEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLCBcImNvbW1pdFVuaWZvcm1cIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIEV4dGVuc2liaWxpdHlfMS5yb3V0aW5lKCksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnR5cGVcIiwgRnVuY3Rpb24pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtPYmplY3RdKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXHJcbl0sIEVkaXRpbmdFeHRlbnNpb24ucHJvdG90eXBlLCBcImNvbW1pdFwiLCBudWxsKTtcclxuZXhwb3J0cy5FZGl0aW5nRXh0ZW5zaW9uID0gRWRpdGluZ0V4dGVuc2lvbjtcclxudmFyIElucHV0ID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhJbnB1dCwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIElucHV0KCkge1xyXG4gICAgICAgIHJldHVybiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xyXG4gICAgfVxyXG4gICAgSW5wdXQuY3JlYXRlID0gZnVuY3Rpb24gKGNvbnRhaW5lcikge1xyXG4gICAgICAgIHZhciByb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcclxuICAgICAgICByb290LnR5cGUgPSAndGV4dCc7XHJcbiAgICAgICAgcm9vdC5jbGFzc05hbWUgPSAnZ3JpZC1pbnB1dCc7XHJcbiAgICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHJvb3QpO1xyXG4gICAgICAgIERvbS5jc3Mocm9vdCwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnYXV0bycsXHJcbiAgICAgICAgICAgIGRpc3BsYXk6ICdub25lJyxcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBwYWRkaW5nOiAnMCcsXHJcbiAgICAgICAgICAgIG1hcmdpbjogJzAnLFxyXG4gICAgICAgICAgICBib3JkZXI6ICdub25lJyxcclxuICAgICAgICAgICAgb3V0bGluZTogJ25vbmUnLFxyXG4gICAgICAgICAgICBib3hTaGFkb3c6ICdub25lJyxcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbmV3IElucHV0KHJvb3QpO1xyXG4gICAgfTtcclxuICAgIElucHV0LnByb3RvdHlwZS5nb3RvID0gZnVuY3Rpb24gKHZpZXdSZWN0LCBhdXRvU2hvdykge1xyXG4gICAgICAgIGlmIChhdXRvU2hvdyA9PT0gdm9pZCAwKSB7IGF1dG9TaG93ID0gdHJ1ZTsgfVxyXG4gICAgICAgIF9zdXBlci5wcm90b3R5cGUuZ290by5jYWxsKHRoaXMsIHZpZXdSZWN0KTtcclxuICAgICAgICBEb20uY3NzKHRoaXMucm9vdCwge1xyXG4gICAgICAgICAgICBsZWZ0OiB2aWV3UmVjdC5sZWZ0ICsgMiArIFwicHhcIixcclxuICAgICAgICAgICAgdG9wOiB2aWV3UmVjdC50b3AgKyAyICsgXCJweFwiLFxyXG4gICAgICAgICAgICB3aWR0aDogdmlld1JlY3Qud2lkdGggKyBcInB4XCIsXHJcbiAgICAgICAgICAgIGhlaWdodDogdmlld1JlY3QuaGVpZ2h0ICsgXCJweFwiLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIElucHV0LnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgcm9vdCA9IHRoaXMucm9vdDtcclxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgcm9vdC5mb2N1cygpO1xyXG4gICAgICAgICAgICByb290LnNldFNlbGVjdGlvblJhbmdlKHJvb3QudmFsdWUubGVuZ3RoLCByb290LnZhbHVlLmxlbmd0aCk7XHJcbiAgICAgICAgfSwgMCk7XHJcbiAgICB9O1xyXG4gICAgSW5wdXQucHJvdG90eXBlLnZhbCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm9vdC52YWx1ZSA9IHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcy5yb290LnZhbHVlO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBJbnB1dDtcclxufShXaWRnZXRfMS5BYnNXaWRnZXRCYXNlKSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUVkaXRpbmdFeHRlbnNpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBfX2V4dGVuZHMgPSAodGhpcyAmJiB0aGlzLl9fZXh0ZW5kcykgfHwgZnVuY3Rpb24gKGQsIGIpIHtcclxuICAgIGZvciAodmFyIHAgaW4gYikgaWYgKGIuaGFzT3duUHJvcGVydHkocCkpIGRbcF0gPSBiW3BdO1xyXG4gICAgZnVuY3Rpb24gX18oKSB7IHRoaXMuY29uc3RydWN0b3IgPSBkOyB9XHJcbiAgICBkLnByb3RvdHlwZSA9IGIgPT09IG51bGwgPyBPYmplY3QuY3JlYXRlKGIpIDogKF9fLnByb3RvdHlwZSA9IGIucHJvdG90eXBlLCBuZXcgX18oKSk7XHJcbn07XHJcbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcclxuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XHJcbiAgICBpZiAodHlwZW9mIFJlZmxlY3QgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIFJlZmxlY3QuZGVjb3JhdGUgPT09IFwiZnVuY3Rpb25cIikgciA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpO1xyXG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcclxuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XHJcbn07XHJcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xyXG59O1xyXG52YXIgS2V5SW5wdXRfMSA9IHJlcXVpcmUoXCIuLi9pbnB1dC9LZXlJbnB1dFwiKTtcclxudmFyIFBvaW50XzEgPSByZXF1aXJlKFwiLi4vZ2VvbS9Qb2ludFwiKTtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1JlY3RcIik7XHJcbnZhciBNb3VzZUlucHV0XzEgPSByZXF1aXJlKFwiLi4vaW5wdXQvTW91c2VJbnB1dFwiKTtcclxudmFyIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydF8xID0gcmVxdWlyZShcIi4uL2lucHV0L01vdXNlRHJhZ0V2ZW50U3VwcG9ydFwiKTtcclxudmFyIEV4dGVuc2liaWxpdHlfMSA9IHJlcXVpcmUoXCIuLi91aS9FeHRlbnNpYmlsaXR5XCIpO1xyXG52YXIgV2lkZ2V0XzEgPSByZXF1aXJlKFwiLi4vdWkvV2lkZ2V0XCIpO1xyXG52YXIgVGV0aGVyID0gcmVxdWlyZShcInRldGhlclwiKTtcclxudmFyIERvbSA9IHJlcXVpcmUoXCIuLi9taXNjL0RvbVwiKTtcclxudmFyIFZlY3RvcnMgPSB7XHJcbiAgICBub3J0aDogbmV3IFBvaW50XzEuUG9pbnQoMCwgLTEpLFxyXG4gICAgc291dGg6IG5ldyBQb2ludF8xLlBvaW50KDAsIDEpLFxyXG4gICAgZWFzdDogbmV3IFBvaW50XzEuUG9pbnQoMSwgMCksXHJcbiAgICB3ZXN0OiBuZXcgUG9pbnRfMS5Qb2ludCgtMSwgMCksXHJcbn07XHJcbnZhciBTZWxlY3RvckV4dGVuc2lvbiA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBTZWxlY3RvckV4dGVuc2lvbigpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IFtdO1xyXG4gICAgfVxyXG4gICAgU2VsZWN0b3JFeHRlbnNpb24ucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoZ3JpZCwga2VybmVsKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmdyaWQgPSBncmlkO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlRWxlbWVudHMoZ3JpZC5yb290KTtcclxuICAgICAgICBLZXlJbnB1dF8xLktleUlucHV0LmZvcihncmlkKVxyXG4gICAgICAgICAgICAub24oJyFUQUInLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLmVhc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJyFTSElGVCtUQUInLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLndlc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJ1JJR0hUX0FSUk9XJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy5lYXN0KTsgfSlcclxuICAgICAgICAgICAgLm9uKCdMRUZUX0FSUk9XJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc2VsZWN0TmVpZ2hib3IoVmVjdG9ycy53ZXN0KTsgfSlcclxuICAgICAgICAgICAgLm9uKCdVUF9BUlJPVycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnNlbGVjdE5laWdoYm9yKFZlY3RvcnMubm9ydGgpOyB9KVxyXG4gICAgICAgICAgICAub24oJ0RPV05fQVJST1cnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3ROZWlnaGJvcihWZWN0b3JzLnNvdXRoKTsgfSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK1JJR0hUX0FSUk9XJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc2VsZWN0RWRnZShWZWN0b3JzLmVhc3QpOyB9KVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrTEVGVF9BUlJPVycsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnNlbGVjdEVkZ2UoVmVjdG9ycy53ZXN0KTsgfSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK1VQX0FSUk9XJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMuc2VsZWN0RWRnZShWZWN0b3JzLm5vcnRoKTsgfSlcclxuICAgICAgICAgICAgLm9uKCdDVFJMK0RPV05fQVJST1cnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3RFZGdlKFZlY3RvcnMuc291dGgpOyB9KVxyXG4gICAgICAgICAgICAub24oJ0NUUkwrQScsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLnNlbGVjdEFsbCgpOyB9KTtcclxuICAgICAgICBNb3VzZURyYWdFdmVudFN1cHBvcnRfMS5Nb3VzZURyYWdFdmVudFN1cHBvcnQuZW5hYmxlKGdyaWQucm9vdCk7XHJcbiAgICAgICAgTW91c2VJbnB1dF8xLk1vdXNlSW5wdXQuZm9yKGdyaWQpXHJcbiAgICAgICAgICAgIC5vbignRE9XTjpQUklNQVJZK1NISUZUJywgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLnNlbGVjdExpbmUobmV3IFBvaW50XzEuUG9pbnQoZS5ncmlkWCwgZS5ncmlkWSkpOyB9KVxyXG4gICAgICAgICAgICAub24oJ0RPV046UFJJTUFSWScsIGZ1bmN0aW9uIChlKSB7IHJldHVybiBfdGhpcy5iZWdpblNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSk7IH0pXHJcbiAgICAgICAgICAgIC5vbignRFJBRzpQUklNQVJZJywgZnVuY3Rpb24gKGUpIHsgcmV0dXJuIF90aGlzLnVwZGF0ZVNlbGVjdEdlc3R1cmUoZS5ncmlkWCwgZS5ncmlkWSk7IH0pO1xyXG4gICAgICAgIGdyaWQub24oJ2ludmFsaWRhdGUnLCBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5yZXNlbGVjdChmYWxzZSk7IH0pO1xyXG4gICAgICAgIGdyaWQub24oJ3Njcm9sbCcsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmFsaWduU2VsZWN0b3JzKGZhbHNlKTsgfSk7XHJcbiAgICAgICAga2VybmVsLnZhcmlhYmxlcy5kZWZpbmUoJ3NlbGVjdGlvbicsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5zZWxlY3Rpb247IH0gfSk7XHJcbiAgICAgICAga2VybmVsLnZhcmlhYmxlcy5kZWZpbmUoJ3ByaW1hcnlTZWxlY3RvcicsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5wcmltYXJ5U2VsZWN0b3I7IH0gfSk7XHJcbiAgICAgICAga2VybmVsLnZhcmlhYmxlcy5kZWZpbmUoJ2NhcHR1cmVTZWxlY3RvcicsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5jYXB0dXJlU2VsZWN0b3I7IH0gfSk7XHJcbiAgICB9O1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZSwgXCJpbmRleFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdyaWQua2VybmVsLnZhcmlhYmxlcy5nZXQoJ21vZGVsSW5kZXgnKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5jcmVhdGVFbGVtZW50cyA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICB2YXIgbGF5ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICBsYXllci5jbGFzc05hbWUgPSAnZ3JpZC1sYXllcic7XHJcbiAgICAgICAgRG9tLmNzcyhsYXllciwge1xyXG4gICAgICAgICAgICBwb2ludGVyRXZlbnRzOiAnbm9uZScsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgICAgICAgd2lkdGg6IHRhcmdldC5jbGllbnRXaWR0aCArICdweCcsXHJcbiAgICAgICAgICAgIGhlaWdodDogdGFyZ2V0LmNsaWVudEhlaWdodCArICdweCcsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGFyZ2V0LnBhcmVudEVsZW1lbnQuaW5zZXJ0QmVmb3JlKGxheWVyLCB0YXJnZXQpO1xyXG4gICAgICAgIHZhciB0ID0gbmV3IFRldGhlcih7XHJcbiAgICAgICAgICAgIGVsZW1lbnQ6IGxheWVyLFxyXG4gICAgICAgICAgICB0YXJnZXQ6IHRhcmdldCxcclxuICAgICAgICAgICAgYXR0YWNobWVudDogJ21pZGRsZSBjZW50ZXInLFxyXG4gICAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiAnbWlkZGxlIGNlbnRlcicsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdC5wb3NpdGlvbigpO1xyXG4gICAgICAgIHRoaXMubGF5ZXIgPSBsYXllcjtcclxuICAgICAgICB0aGlzLnByaW1hcnlTZWxlY3RvciA9IFNlbGVjdG9yLmNyZWF0ZShsYXllciwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5jYXB0dXJlU2VsZWN0b3IgPSBTZWxlY3Rvci5jcmVhdGUobGF5ZXIsIGZhbHNlKTtcclxuICAgIH07XHJcbiAgICBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKGNlbGxzLCBhdXRvU2Nyb2xsKSB7XHJcbiAgICAgICAgaWYgKGF1dG9TY3JvbGwgPT09IHZvaWQgMCkgeyBhdXRvU2Nyb2xsID0gdHJ1ZTsgfVxyXG4gICAgICAgIHRoaXMuZG9TZWxlY3QoY2VsbHMsIGF1dG9TY3JvbGwpO1xyXG4gICAgICAgIHRoaXMuYWxpZ25TZWxlY3RvcnModHJ1ZSk7XHJcbiAgICB9O1xyXG4gICAgU2VsZWN0b3JFeHRlbnNpb24ucHJvdG90eXBlLnNlbGVjdEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB0aGlzLnNlbGVjdCh0aGlzLmdyaWQubW9kZWwuY2VsbHMubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnJlZjsgfSkpO1xyXG4gICAgfTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5zZWxlY3RFZGdlID0gZnVuY3Rpb24gKHZlY3RvciwgYXV0b1Njcm9sbCkge1xyXG4gICAgICAgIGlmIChhdXRvU2Nyb2xsID09PSB2b2lkIDApIHsgYXV0b1Njcm9sbCA9IHRydWU7IH1cclxuICAgICAgICB2ZWN0b3IgPSB2ZWN0b3Iubm9ybWFsaXplKCk7XHJcbiAgICAgICAgdmFyIGVtcHR5ID0gZnVuY3Rpb24gKGNlbGwpIHsgcmV0dXJuIChjZWxsLnZhbHVlID09PSAnJyB8fCBjZWxsLnZhbHVlID09PSB1bmRlZmluZWQgfHwgY2VsbC52YWx1ZSA9PT0gbnVsbCk7IH07XHJcbiAgICAgICAgdmFyIHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKHJlZikge1xyXG4gICAgICAgICAgICB2YXIgc3RhcnRDZWxsID0gdGhpcy5pbmRleC5maW5kQ2VsbChyZWYpO1xyXG4gICAgICAgICAgICB2YXIgY3VyckNlbGwgPSB0aGlzLmluZGV4LmZpbmRDZWxsTmVpZ2hib3Ioc3RhcnRDZWxsLnJlZiwgdmVjdG9yKTtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdENlbGwgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoIWN1cnJDZWxsKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB3aGlsZSAodHJ1ZSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGEgPSBjdXJyQ2VsbDtcclxuICAgICAgICAgICAgICAgIHZhciBiID0gdGhpcy5pbmRleC5maW5kQ2VsbE5laWdoYm9yKGEucmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFhIHx8ICFiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Q2VsbCA9ICEhYSA/IGEgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGVtcHR5KGEpICsgZW1wdHkoYikgPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdENlbGwgPSBlbXB0eShhKSA/IGIgOiBhO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY3VyckNlbGwgPSBiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXN1bHRDZWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChbcmVzdWx0Q2VsbC5yZWZdLCBhdXRvU2Nyb2xsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUuc2VsZWN0TGluZSA9IGZ1bmN0aW9uIChncmlkUHQsIGF1dG9TY3JvbGwpIHtcclxuICAgICAgICBpZiAoYXV0b1Njcm9sbCA9PT0gdm9pZCAwKSB7IGF1dG9TY3JvbGwgPSB0cnVlOyB9XHJcbiAgICAgICAgdmFyIGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgdmFyIHJlZiA9IHRoaXMuc2VsZWN0aW9uWzBdIHx8IG51bGw7XHJcbiAgICAgICAgaWYgKCFyZWYpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB2YXIgc3RhcnRQdCA9IGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHJlZikudG9wTGVmdCgpO1xyXG4gICAgICAgIHZhciBsaW5lUmVjdCA9IFJlY3RfMS5SZWN0LmZyb21Qb2ludHMoc3RhcnRQdCwgZ3JpZFB0KTtcclxuICAgICAgICB2YXIgY2VsbFJlZnMgPSBncmlkLmdldENlbGxzSW5HcmlkUmVjdChsaW5lUmVjdCkubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnJlZjsgfSk7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKGNlbGxSZWZzLmluZGV4T2YocmVmKSwgMSk7XHJcbiAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHJlZik7XHJcbiAgICAgICAgdGhpcy5zZWxlY3QoY2VsbFJlZnMsIGF1dG9TY3JvbGwpO1xyXG4gICAgfTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5zZWxlY3ROZWlnaGJvciA9IGZ1bmN0aW9uICh2ZWN0b3IsIGF1dG9TY3JvbGwpIHtcclxuICAgICAgICBpZiAoYXV0b1Njcm9sbCA9PT0gdm9pZCAwKSB7IGF1dG9TY3JvbGwgPSB0cnVlOyB9XHJcbiAgICAgICAgdmVjdG9yID0gdmVjdG9yLm5vcm1hbGl6ZSgpO1xyXG4gICAgICAgIHZhciByZWYgPSB0aGlzLnNlbGVjdGlvblswXSB8fCBudWxsO1xyXG4gICAgICAgIGlmIChyZWYpIHtcclxuICAgICAgICAgICAgdmFyIGNlbGwgPSB0aGlzLmluZGV4LmZpbmRDZWxsTmVpZ2hib3IocmVmLCB2ZWN0b3IpO1xyXG4gICAgICAgICAgICBpZiAoY2VsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoW2NlbGwucmVmXSwgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgU2VsZWN0b3JFeHRlbnNpb24ucHJvdG90eXBlLnJlc2VsZWN0ID0gZnVuY3Rpb24gKGF1dG9TY3JvbGwpIHtcclxuICAgICAgICBpZiAoYXV0b1Njcm9sbCA9PT0gdm9pZCAwKSB7IGF1dG9TY3JvbGwgPSB0cnVlOyB9XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgaW5kZXggPSBfYS5pbmRleCwgc2VsZWN0aW9uID0gX2Euc2VsZWN0aW9uO1xyXG4gICAgICAgIHZhciByZW1haW5pbmcgPSBzZWxlY3Rpb24uZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiAhIWluZGV4LmZpbmRDZWxsKHgpOyB9KTtcclxuICAgICAgICBpZiAocmVtYWluaW5nLmxlbmd0aCAhPSBzZWxlY3Rpb24ubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KHJlbWFpbmluZywgYXV0b1Njcm9sbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5iZWdpblNlbGVjdEdlc3R1cmUgPSBmdW5jdGlvbiAoZ3JpZFgsIGdyaWRZKSB7XHJcbiAgICAgICAgdmFyIHB0ID0gbmV3IFBvaW50XzEuUG9pbnQoZ3JpZFgsIGdyaWRZKTtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXMuZ3JpZC5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG4gICAgICAgIGlmICghY2VsbClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IHtcclxuICAgICAgICAgICAgc3RhcnQ6IGNlbGwucmVmLFxyXG4gICAgICAgICAgICBlbmQ6IGNlbGwucmVmLFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdGhpcy5zZWxlY3QoW2NlbGwucmVmXSk7XHJcbiAgICB9O1xyXG4gICAgU2VsZWN0b3JFeHRlbnNpb24ucHJvdG90eXBlLnVwZGF0ZVNlbGVjdEdlc3R1cmUgPSBmdW5jdGlvbiAoZ3JpZFgsIGdyaWRZKSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgZ3JpZCA9IF9hLmdyaWQsIHNlbGVjdEdlc3R1cmUgPSBfYS5zZWxlY3RHZXN0dXJlO1xyXG4gICAgICAgIHZhciBwdCA9IG5ldyBQb2ludF8xLlBvaW50KGdyaWRYLCBncmlkWSk7XHJcbiAgICAgICAgdmFyIGNlbGwgPSBncmlkLmdldENlbGxBdFZpZXdQb2ludChwdCk7XHJcbiAgICAgICAgaWYgKCFjZWxsIHx8IHNlbGVjdEdlc3R1cmUuZW5kID09PSBjZWxsLnJlZilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIHNlbGVjdEdlc3R1cmUuZW5kID0gY2VsbC5yZWY7XHJcbiAgICAgICAgdmFyIHJlZ2lvbiA9IFJlY3RfMS5SZWN0LmZyb21NYW55KFtcclxuICAgICAgICAgICAgZ3JpZC5nZXRDZWxsR3JpZFJlY3Qoc2VsZWN0R2VzdHVyZS5zdGFydCksXHJcbiAgICAgICAgICAgIGdyaWQuZ2V0Q2VsbEdyaWRSZWN0KHNlbGVjdEdlc3R1cmUuZW5kKVxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIHZhciBjZWxsUmVmcyA9IGdyaWQuZ2V0Q2VsbHNJbkdyaWRSZWN0KHJlZ2lvbilcclxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5yZWY7IH0pO1xyXG4gICAgICAgIGlmIChjZWxsUmVmcy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIGNlbGxSZWZzLnNwbGljZShjZWxsUmVmcy5pbmRleE9mKHNlbGVjdEdlc3R1cmUuc3RhcnQpLCAxKTtcclxuICAgICAgICAgICAgY2VsbFJlZnMuc3BsaWNlKDAsIDAsIHNlbGVjdEdlc3R1cmUuc3RhcnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlbGVjdChjZWxsUmVmcywgY2VsbFJlZnMubGVuZ3RoID09IDEpO1xyXG4gICAgfTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5kb1NlbGVjdCA9IGZ1bmN0aW9uIChjZWxscywgYXV0b1Njcm9sbCkge1xyXG4gICAgICAgIGlmIChjZWxscyA9PT0gdm9pZCAwKSB7IGNlbGxzID0gW107IH1cclxuICAgICAgICBpZiAoYXV0b1Njcm9sbCA9PT0gdm9pZCAwKSB7IGF1dG9TY3JvbGwgPSB0cnVlOyB9XHJcbiAgICAgICAgdmFyIGdyaWQgPSB0aGlzLmdyaWQ7XHJcbiAgICAgICAgaWYgKGNlbGxzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGlvbiA9IGNlbGxzO1xyXG4gICAgICAgICAgICBpZiAoYXV0b1Njcm9sbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3QoY2VsbHNbMF0pO1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5zY3JvbGxUbyhwcmltYXJ5UmVjdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0aW9uID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0R2VzdHVyZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZS5hbGlnblNlbGVjdG9ycyA9IGZ1bmN0aW9uIChhbmltYXRlKSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgZ3JpZCA9IF9hLmdyaWQsIHNlbGVjdGlvbiA9IF9hLnNlbGVjdGlvbiwgcHJpbWFyeVNlbGVjdG9yID0gX2EucHJpbWFyeVNlbGVjdG9yLCBjYXB0dXJlU2VsZWN0b3IgPSBfYS5jYXB0dXJlU2VsZWN0b3I7XHJcbiAgICAgICAgaWYgKHNlbGVjdGlvbi5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdmFyIHByaW1hcnlSZWN0ID0gZ3JpZC5nZXRDZWxsVmlld1JlY3Qoc2VsZWN0aW9uWzBdKTtcclxuICAgICAgICAgICAgcHJpbWFyeVNlbGVjdG9yLmdvdG8ocHJpbWFyeVJlY3QsIGFuaW1hdGUpO1xyXG4gICAgICAgICAgICAvL1RPRE86IEltcHJvdmUgdGhlIHNoaXQgb3V0IG9mIHRoaXM6XHJcbiAgICAgICAgICAgIHZhciBjYXB0dXJlUmVjdCA9IFJlY3RfMS5SZWN0LmZyb21NYW55KHNlbGVjdGlvbi5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGdyaWQuZ2V0Q2VsbFZpZXdSZWN0KHgpOyB9KSk7XHJcbiAgICAgICAgICAgIGNhcHR1cmVTZWxlY3Rvci5nb3RvKGNhcHR1cmVSZWN0LCBhbmltYXRlKTtcclxuICAgICAgICAgICAgY2FwdHVyZVNlbGVjdG9yLnRvZ2dsZShzZWxlY3Rpb24ubGVuZ3RoID4gMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBwcmltYXJ5U2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgICAgICBjYXB0dXJlU2VsZWN0b3IuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gU2VsZWN0b3JFeHRlbnNpb247XHJcbn0oKSk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5LCBPYmplY3RdKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cmV0dXJudHlwZVwiLCB2b2lkIDApXHJcbl0sIFNlbGVjdG9yRXh0ZW5zaW9uLnByb3RvdHlwZSwgXCJzZWxlY3RcIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLmNvbW1hbmQoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW10pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpyZXR1cm50eXBlXCIsIHZvaWQgMClcclxuXSwgU2VsZWN0b3JFeHRlbnNpb24ucHJvdG90eXBlLCBcInNlbGVjdEFsbFwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEuY29tbWFuZCgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbUG9pbnRfMS5Qb2ludCwgT2JqZWN0XSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxyXG5dLCBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUsIFwic2VsZWN0RWRnZVwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEuY29tbWFuZCgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbUG9pbnRfMS5Qb2ludCwgT2JqZWN0XSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxyXG5dLCBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUsIFwic2VsZWN0TGluZVwiLCBudWxsKTtcclxuX19kZWNvcmF0ZShbXHJcbiAgICBFeHRlbnNpYmlsaXR5XzEuY29tbWFuZCgpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIEZ1bmN0aW9uKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246cGFyYW10eXBlc1wiLCBbUG9pbnRfMS5Qb2ludCwgT2JqZWN0XSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxyXG5dLCBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUsIFwic2VsZWN0TmVpZ2hib3JcIiwgbnVsbCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgRXh0ZW5zaWJpbGl0eV8xLnJvdXRpbmUoKSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBGdW5jdGlvbiksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnBhcmFtdHlwZXNcIiwgW0FycmF5LCBCb29sZWFuXSksXHJcbiAgICBfX21ldGFkYXRhKFwiZGVzaWduOnJldHVybnR5cGVcIiwgdm9pZCAwKVxyXG5dLCBTZWxlY3RvckV4dGVuc2lvbi5wcm90b3R5cGUsIFwiZG9TZWxlY3RcIiwgbnVsbCk7XHJcbmV4cG9ydHMuU2VsZWN0b3JFeHRlbnNpb24gPSBTZWxlY3RvckV4dGVuc2lvbjtcclxudmFyIFNlbGVjdG9yID0gKGZ1bmN0aW9uIChfc3VwZXIpIHtcclxuICAgIF9fZXh0ZW5kcyhTZWxlY3RvciwgX3N1cGVyKTtcclxuICAgIGZ1bmN0aW9uIFNlbGVjdG9yKCkge1xyXG4gICAgICAgIHJldHVybiBfc3VwZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSB8fCB0aGlzO1xyXG4gICAgfVxyXG4gICAgU2VsZWN0b3IuY3JlYXRlID0gZnVuY3Rpb24gKGNvbnRhaW5lciwgcHJpbWFyeSkge1xyXG4gICAgICAgIGlmIChwcmltYXJ5ID09PSB2b2lkIDApIHsgcHJpbWFyeSA9IGZhbHNlOyB9XHJcbiAgICAgICAgdmFyIHJvb3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICByb290LmNsYXNzTmFtZSA9ICdncmlkLXNlbGVjdG9yICcgKyAocHJpbWFyeSA/ICdncmlkLXNlbGVjdG9yLXByaW1hcnknIDogJycpO1xyXG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChyb290KTtcclxuICAgICAgICBEb20uY3NzKHJvb3QsIHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXHJcbiAgICAgICAgICAgIGxlZnQ6ICcwcHgnLFxyXG4gICAgICAgICAgICB0b3A6ICcwcHgnLFxyXG4gICAgICAgICAgICBkaXNwbGF5OiAnbm9uZScsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBTZWxlY3Rvcihyb290KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gU2VsZWN0b3I7XHJcbn0oV2lkZ2V0XzEuQWJzV2lkZ2V0QmFzZSkpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1TZWxlY3RvckV4dGVuc2lvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIFBvaW50KHgsIHkpIHtcclxuICAgICAgICB0aGlzLnggPSAwO1xyXG4gICAgICAgIHRoaXMueSA9IDA7XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoeCkpIHtcclxuICAgICAgICAgICAgdGhpcy54ID0gKHhbMF0pO1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeFsxXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgPSAoeSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgUG9pbnQuYXZlcmFnZSA9IGZ1bmN0aW9uIChwb2ludHMpIHtcclxuICAgICAgICBpZiAoIXBvaW50cy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFBvaW50LmVtcHR5O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgeCA9IDAsIHkgPSAwO1xyXG4gICAgICAgIHBvaW50cy5mb3JFYWNoKGZ1bmN0aW9uIChwKSB7XHJcbiAgICAgICAgICAgIHggKz0gcC54O1xyXG4gICAgICAgICAgICB5ICs9IHAueTtcclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHggLyBwb2ludHMubGVuZ3RoLCB5IC8gcG9pbnRzLmxlbmd0aCk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQuZGlyZWN0aW9uID0gZnVuY3Rpb24gKGZyb20sIHRvKSB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHRvKS5zdWJ0cmFjdChmcm9tKS5ub3JtYWxpemUoKTtcclxuICAgIH07XHJcbiAgICBQb2ludC5jcmVhdGUgPSBmdW5jdGlvbiAoc291cmNlKSB7XHJcbiAgICAgICAgcmV0dXJuIHB0QXJnKHNvdXJjZSk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQuZnJvbUJ1ZmZlciA9IGZ1bmN0aW9uIChidWZmZXIsIGluZGV4KSB7XHJcbiAgICAgICAgaWYgKGluZGV4ID09PSB2b2lkIDApIHsgaW5kZXggPSAwOyB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChidWZmZXJbaW5kZXhdLCBidWZmZXJbaW5kZXggKyAxXSk7XHJcbiAgICB9O1xyXG4gICAgLy9yZWdpb24gR2VvbWV0cnlcclxuICAgIFBvaW50LnByb3RvdHlwZS5hbmdsZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMueCA8IDApXHJcbiAgICAgICAgICAgID8gMzYwIC0gTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZyAqIC0xXHJcbiAgICAgICAgICAgIDogTWF0aC5hdGFuMih0aGlzLngsIC10aGlzLnkpICogUG9pbnQucmFkMmRlZztcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUuYW5nbGVBYm91dCA9IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHB0LmNyb3NzKHRoaXMpLCBwdC5kb3QodGhpcykpO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS5jcm9zcyA9IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLnggKiBwdC55IC0gdGhpcy55ICogcHQueDtcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUuZGlzdGFuY2UgPSBmdW5jdGlvbiAodG8pIHtcclxuICAgICAgICB2YXIgcHQgPSBwdEFyZyh0byk7XHJcbiAgICAgICAgdmFyIGEgPSB0aGlzLnggLSBwdC54O1xyXG4gICAgICAgIHZhciBiID0gdGhpcy55IC0gcHQueTtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS5kb3QgPSBmdW5jdGlvbiAodmFsKSB7XHJcbiAgICAgICAgdmFyIHB0ID0gcHRBcmcodmFsKTtcclxuICAgICAgICByZXR1cm4gdGhpcy54ICogcHQueCArIHRoaXMueSAqIHB0Lnk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQucHJvdG90eXBlLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgbGVuID0gdGhpcy5sZW5ndGgoKTtcclxuICAgICAgICBpZiAobGVuID4gMC4wMDAwMSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tdWx0aXBseSgxIC8gbGVuKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY2xvbmUoKTtcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUucGVycCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueSAqIC0xLCB0aGlzLngpO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS5ycGVycCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yZXZlcnNlKCkucGVycCgpO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS5pbnZlcnNlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQodGhpcy54ICogLTEsIHRoaXMueSAqIC0xKTtcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUucmV2ZXJzZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIC0xLCB0aGlzLnkgKiAtMSk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQucHJvdG90eXBlLnJvdGF0ZSA9IGZ1bmN0aW9uIChyYWRpYW5zKSB7XHJcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKHJhZGlhbnMpO1xyXG4gICAgICAgIHZhciBzaW4gPSBNYXRoLnNpbihyYWRpYW5zKTtcclxuICAgICAgICB2YXIgbnggPSB0aGlzLnggKiBjb3MgLSB0aGlzLnkgKiBzaW47XHJcbiAgICAgICAgdmFyIG55ID0gdGhpcy55ICogY29zICsgdGhpcy54ICogc2luO1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQobngsIG55KTtcclxuICAgIH07XHJcbiAgICAvL2VuZHJlZ2lvblxyXG4gICAgLy9yZWdpb24gQXJpdGhtZXRpY1xyXG4gICAgUG9pbnQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWwpIHtcclxuICAgICAgICB2YXIgcHQgPSBwdEFyZyh2YWwpO1xyXG4gICAgICAgIGlmICghcHQpIHtcclxuICAgICAgICAgICAgdGhyb3cgJ2FkZDogcHQgcmVxdWlyZWQuJztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLnggKyBwdC54LCB0aGlzLnkgKyBwdC55KTtcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUuZGl2aWRlID0gZnVuY3Rpb24gKGRpdmlzb3IpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAvIGRpdmlzb3IsIHRoaXMueSAvIGRpdmlzb3IpO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uIChtdWx0aXBsZXIpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFBvaW50KHRoaXMueCAqIG11bHRpcGxlciwgdGhpcy55ICogbXVsdGlwbGVyKTtcclxuICAgIH07XHJcbiAgICBQb2ludC5wcm90b3R5cGUucm91bmQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludChNYXRoLnJvdW5kKHRoaXMueCksIE1hdGgucm91bmQodGhpcy55KSk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQucHJvdG90eXBlLnN1YnRyYWN0ID0gZnVuY3Rpb24gKHZhbCkge1xyXG4gICAgICAgIHZhciBwdCA9IHB0QXJnKHZhbCk7XHJcbiAgICAgICAgaWYgKCFwdCkge1xyXG4gICAgICAgICAgICB0aHJvdyAnc3VidHJhY3Q6IHB0IHJlcXVpcmVkLic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmFkZChwdC5yZXZlcnNlKCkpO1xyXG4gICAgfTtcclxuICAgIC8vZW5kcmVnaW9uXHJcbiAgICAvL3JlZ2lvbiBDb252ZXJzaW9uXHJcbiAgICBQb2ludC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7XHJcbiAgICB9O1xyXG4gICAgUG9pbnQucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIChhbm90aGVyKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMueCA9PT0gYW5vdGhlci54ICYmIHRoaXMueSA9PT0gYW5vdGhlci55O1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBbdGhpcy54LCB0aGlzLnldO1xyXG4gICAgfTtcclxuICAgIFBvaW50LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLnggKyBcIiwgXCIgKyB0aGlzLnkgKyBcIl1cIjtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUG9pbnQ7XHJcbn0oKSk7XHJcblBvaW50LnJhZDJkZWcgPSAzNjAgLyAoTWF0aC5QSSAqIDIpO1xyXG5Qb2ludC5kZWcycmFkID0gKE1hdGguUEkgKiAyKSAvIDM2MDtcclxuUG9pbnQuZW1wdHkgPSBuZXcgUG9pbnQoMCwgMCk7XHJcblBvaW50Lm1heCA9IG5ldyBQb2ludCgyMTQ3NDgzNjQ3LCAyMTQ3NDgzNjQ3KTtcclxuUG9pbnQubWluID0gbmV3IFBvaW50KC0yMTQ3NDgzNjQ3LCAtMjE0NzQ4MzY0Nyk7XHJcblBvaW50LnVwID0gbmV3IFBvaW50KDAsIC0xKTtcclxuZXhwb3J0cy5Qb2ludCA9IFBvaW50O1xyXG5mdW5jdGlvbiBwdEFyZyh2YWwpIHtcclxuICAgIGlmICh2YWwgIT09IG51bGwgfHwgdmFsICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICBpZiAodmFsIGluc3RhbmNlb2YgUG9pbnQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHZhbC54ICE9PSB1bmRlZmluZWQgJiYgdmFsLnkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbC54LCB2YWwueSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2YWwubGVmdCAhPT0gdW5kZWZpbmVkICYmIHZhbC50b3AgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbC5sZWZ0LCB2YWwudG9wKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgKHZhbCkgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgIHZhbCA9IHBhcnNlSW50KHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgKHZhbCkgPT09ICdudW1iZXInKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQodmFsLCB2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBQb2ludC5lbXB0eTtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Qb2ludC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFBvaW50XzEgPSByZXF1aXJlKFwiLi9Qb2ludFwiKTtcclxudmFyIFJlY3QgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gUmVjdChsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICB0aGlzLmxlZnQgPSAwO1xyXG4gICAgICAgIHRoaXMudG9wID0gMDtcclxuICAgICAgICB0aGlzLndpZHRoID0gMDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IDA7XHJcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcclxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBSZWN0LmZyb21FZGdlcyA9IGZ1bmN0aW9uIChsZWZ0LCB0b3AsIHJpZ2h0LCBib3R0b20pIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QobGVmdCwgdG9wLCByaWdodCAtIGxlZnQsIGJvdHRvbSAtIHRvcCk7XHJcbiAgICB9O1xyXG4gICAgUmVjdC5mcm9tTGlrZSA9IGZ1bmN0aW9uIChsaWtlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBSZWN0KGxpa2UubGVmdCwgbGlrZS50b3AsIGxpa2Uud2lkdGgsIGxpa2UuaGVpZ2h0KTtcclxuICAgIH07XHJcbiAgICBSZWN0LmZyb21NYW55ID0gZnVuY3Rpb24gKHJlY3RzKSB7XHJcbiAgICAgICAgdmFyIHBvaW50cyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcmVjdHMubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnBvaW50cygpOyB9KSk7XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9O1xyXG4gICAgUmVjdC5mcm9tUG9pbnRzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciBwb2ludHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICBwb2ludHNbX2ldID0gYXJndW1lbnRzW19pXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFJlY3QuZnJvbVBvaW50QnVmZmVyKHBvaW50cyk7XHJcbiAgICB9O1xyXG4gICAgUmVjdC5mcm9tUG9pbnRCdWZmZXIgPSBmdW5jdGlvbiAocG9pbnRzLCBpbmRleCwgbGVuZ3RoKSB7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzLnNsaWNlKGluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIHBvaW50cyA9IHBvaW50cy5zbGljZSgwLCBsZW5ndGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUmVjdC5mcm9tRWRnZXMoTWF0aC5taW4uYXBwbHkoTWF0aCwgcG9pbnRzLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcC54OyB9KSksIE1hdGgubWluLmFwcGx5KE1hdGgsIHBvaW50cy5tYXAoZnVuY3Rpb24gKHApIHsgcmV0dXJuIHAueTsgfSkpLCBNYXRoLm1heC5hcHBseShNYXRoLCBwb2ludHMubWFwKGZ1bmN0aW9uIChwKSB7IHJldHVybiBwLng7IH0pKSwgTWF0aC5tYXguYXBwbHkoTWF0aCwgcG9pbnRzLm1hcChmdW5jdGlvbiAocCkgeyByZXR1cm4gcC55OyB9KSkpO1xyXG4gICAgfTtcclxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShSZWN0LnByb3RvdHlwZSwgXCJyaWdodFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxlZnQgKyB0aGlzLndpZHRoO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFJlY3QucHJvdG90eXBlLCBcImJvdHRvbVwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnRvcCArIHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgUmVjdC5wcm90b3R5cGUuY2VudGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmxlZnQgKyAodGhpcy53aWR0aCAvIDIpLCB0aGlzLnRvcCArICh0aGlzLmhlaWdodCAvIDIpKTtcclxuICAgIH07XHJcbiAgICBSZWN0LnByb3RvdHlwZS50b3BMZWZ0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmxlZnQsIHRoaXMudG9wKTtcclxuICAgIH07XHJcbiAgICBSZWN0LnByb3RvdHlwZS5wb2ludHMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFtcclxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5sZWZ0LCB0aGlzLnRvcCksXHJcbiAgICAgICAgICAgIG5ldyBQb2ludF8xLlBvaW50KHRoaXMucmlnaHQsIHRoaXMudG9wKSxcclxuICAgICAgICAgICAgbmV3IFBvaW50XzEuUG9pbnQodGhpcy5yaWdodCwgdGhpcy5ib3R0b20pLFxyXG4gICAgICAgICAgICBuZXcgUG9pbnRfMS5Qb2ludCh0aGlzLmxlZnQsIHRoaXMuYm90dG9tKSxcclxuICAgICAgICBdO1xyXG4gICAgfTtcclxuICAgIFJlY3QucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQb2ludF8xLlBvaW50KHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcclxuICAgIH07XHJcbiAgICBSZWN0LnByb3RvdHlwZS5vZmZzZXQgPSBmdW5jdGlvbiAocHQpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QodGhpcy5sZWZ0ICsgcHQueCwgdGhpcy50b3AgKyBwdC55LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9O1xyXG4gICAgUmVjdC5wcm90b3R5cGUuY29udGFpbnMgPSBmdW5jdGlvbiAoaW5wdXQpIHtcclxuICAgICAgICBpZiAoaW5wdXRbJ3gnXSAhPT0gdW5kZWZpbmVkICYmIGlucHV0Wyd5J10gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB2YXIgcHQgPSBpbnB1dDtcclxuICAgICAgICAgICAgcmV0dXJuIChwdC54ID49IHRoaXMubGVmdFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueSA+PSB0aGlzLnRvcFxyXG4gICAgICAgICAgICAgICAgJiYgcHQueCA8PSB0aGlzLmxlZnQgKyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICAgICAmJiBwdC55IDw9IHRoaXMudG9wICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIHJlY3QgPSBpbnB1dDtcclxuICAgICAgICAgICAgcmV0dXJuIChyZWN0LmxlZnQgPj0gdGhpcy5sZWZ0ICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCA+PSB0aGlzLnRvcCAmJlxyXG4gICAgICAgICAgICAgICAgcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCA8PSB0aGlzLmxlZnQgKyB0aGlzLndpZHRoICYmXHJcbiAgICAgICAgICAgICAgICByZWN0LnRvcCArIHJlY3QuaGVpZ2h0IDw9IHRoaXMudG9wICsgdGhpcy5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBSZWN0LnByb3RvdHlwZS5pbmZsYXRlID0gZnVuY3Rpb24gKHNpemUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QodGhpcy5sZWZ0IC0gc2l6ZS54LCB0aGlzLnRvcCAtIHNpemUueSwgdGhpcy53aWR0aCArIHNpemUueCwgdGhpcy5oZWlnaHQgKyBzaXplLnkpO1xyXG4gICAgfTtcclxuICAgIFJlY3QucHJvdG90eXBlLmludGVyc2VjdHMgPSBmdW5jdGlvbiAocmVjdCkge1xyXG4gICAgICAgIHJldHVybiByZWN0LmxlZnQgKyByZWN0LndpZHRoID4gdGhpcy5sZWZ0XHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wICsgcmVjdC5oZWlnaHQgPiB0aGlzLnRvcFxyXG4gICAgICAgICAgICAmJiByZWN0LmxlZnQgPCB0aGlzLmxlZnQgKyB0aGlzLndpZHRoXHJcbiAgICAgICAgICAgICYmIHJlY3QudG9wIDwgdGhpcy50b3AgKyB0aGlzLmhlaWdodDtcclxuICAgIH07XHJcbiAgICBSZWN0LnByb3RvdHlwZS5ub3JtYWxpemUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMud2lkdGggPj0gMCAmJiB0aGlzLmhlaWdodCA+PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgeCA9IHRoaXMubGVmdDtcclxuICAgICAgICB2YXIgeSA9IHRoaXMudG9wO1xyXG4gICAgICAgIHZhciB3ID0gdGhpcy53aWR0aDtcclxuICAgICAgICB2YXIgaCA9IHRoaXMuaGVpZ2h0O1xyXG4gICAgICAgIGlmICh3IDwgMCkge1xyXG4gICAgICAgICAgICB4ICs9IHc7XHJcbiAgICAgICAgICAgIHcgPSBNYXRoLmFicyh3KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGggPCAwKSB7XHJcbiAgICAgICAgICAgIHkgKz0gaDtcclxuICAgICAgICAgICAgaCA9IE1hdGguYWJzKGgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IFJlY3QoeCwgeSwgdywgaCk7XHJcbiAgICB9O1xyXG4gICAgUmVjdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgcmV0dXJuIFwiW1wiICsgdGhpcy5sZWZ0ICsgXCIsIFwiICsgdGhpcy50b3AgKyBcIiwgXCIgKyB0aGlzLndpZHRoICsgXCIsIFwiICsgdGhpcy5oZWlnaHQgKyBcIl1cIjtcclxuICAgIH07XHJcbiAgICByZXR1cm4gUmVjdDtcclxufSgpKTtcclxuUmVjdC5lbXB0eSA9IG5ldyBSZWN0KDAsIDAsIDAsIDApO1xyXG5leHBvcnRzLlJlY3QgPSBSZWN0O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZWN0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgXyA9IHJlcXVpcmUoXCIuLi9taXNjL1V0aWxcIik7XHJcbnZhciBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyKHRhcmdldCkge1xyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgfVxyXG4gICAgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLndyYXAgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XHJcbiAgICAgICAgaWYgKCEhdGFyZ2V0WydhZGRFdmVudExpc3RlbmVyJ10pIHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIodGFyZ2V0KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcclxuICAgIH07XHJcbiAgICBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy50YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgY2FsbGJhY2spO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGNhbmNlbDogZnVuY3Rpb24gKCkgeyByZXR1cm4gX3RoaXMub2ZmKGV2ZW50LCBjYWxsYmFjayk7IH0sXHJcbiAgICAgICAgfTtcclxuICAgIH07XHJcbiAgICBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBjYWxsYmFjayk7XHJcbiAgICB9O1xyXG4gICAgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRhcmdldC5kaXNwYXRjaEV2ZW50KF8uZXh0ZW5kKG5ldyBFdmVudChldmVudCksIHsgYXJnczogYXJncyB9KSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlcjtcclxufSgpKTtcclxuZXhwb3J0cy5FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIgPSBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXI7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEtleXNfMSA9IHJlcXVpcmUoXCIuL0tleXNcIik7XHJcbnZhciBLZXlFeHByZXNzaW9uID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEtleUV4cHJlc3Npb24oa2V5cywgZXhjbHVzaXZlKSB7XHJcbiAgICAgICAgdGhpcy5leGNsdXNpdmUgPSBleGNsdXNpdmU7XHJcbiAgICAgICAgdGhpcy5jdHJsID0ga2V5cy5zb21lKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4ID09PSBLZXlzXzEuS2V5cy5DVFJMOyB9KTtcclxuICAgICAgICB0aGlzLmFsdCA9IGtleXMuc29tZShmdW5jdGlvbiAoeCkgeyByZXR1cm4geCA9PT0gS2V5c18xLktleXMuQUxUOyB9KTtcclxuICAgICAgICB0aGlzLnNoaWZ0ID0ga2V5cy5zb21lKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4ID09PSBLZXlzXzEuS2V5cy5TSElGVDsgfSk7XHJcbiAgICAgICAgdGhpcy5rZXkgPSBrZXlzLmZpbHRlcihmdW5jdGlvbiAoeCkgeyByZXR1cm4geCAhPT0gS2V5c18xLktleXMuQ1RSTCAmJiB4ICE9PSBLZXlzXzEuS2V5cy5BTFQgJiYgeCAhPT0gS2V5c18xLktleXMuU0hJRlQ7IH0pWzBdIHx8IG51bGw7XHJcbiAgICB9XHJcbiAgICBLZXlFeHByZXNzaW9uLnBhcnNlID0gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgdmFyIGV4Y2x1c2l2ZSA9IGlucHV0WzBdID09PSAnISc7XHJcbiAgICAgICAgaWYgKGV4Y2x1c2l2ZSkge1xyXG4gICAgICAgICAgICBpbnB1dCA9IGlucHV0LnN1YnN0cigxKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGtleXMgPSBpbnB1dFxyXG4gICAgICAgICAgICAuc3BsaXQoL1tcXHNcXC1cXCtdKy8pXHJcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIEtleXNfMS5LZXlzLnBhcnNlKHgpOyB9KTtcclxuICAgICAgICByZXR1cm4gbmV3IEtleUV4cHJlc3Npb24oa2V5cywgZXhjbHVzaXZlKTtcclxuICAgIH07XHJcbiAgICBLZXlFeHByZXNzaW9uLnByb3RvdHlwZS5tYXRjaGVzID0gZnVuY3Rpb24gKGtleURhdGEpIHtcclxuICAgICAgICBpZiAoa2V5RGF0YSBpbnN0YW5jZW9mIEtleUV4cHJlc3Npb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLmN0cmwgPT0ga2V5RGF0YS5jdHJsICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmFsdCA9PSBrZXlEYXRhLmFsdCAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBrZXlEYXRhLnNoaWZ0ICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmtleSA9PSBrZXlEYXRhLmtleSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGtleURhdGEgaW5zdGFuY2VvZiBLZXlib2FyZEV2ZW50KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAodGhpcy5jdHJsID09IGtleURhdGEuY3RybEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hbHQgPT0ga2V5RGF0YS5hbHRLZXkgJiZcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hpZnQgPT0ga2V5RGF0YS5zaGlmdEtleSAmJlxyXG4gICAgICAgICAgICAgICAgdGhpcy5rZXkgPT0ga2V5RGF0YS5rZXlDb2RlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgJ0tleUV4cHJlc3Npb24ubWF0Y2hlczogSW52YWxpZCBpbnB1dCc7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEtleUV4cHJlc3Npb247XHJcbn0oKSk7XHJcbmV4cG9ydHMuS2V5RXhwcmVzc2lvbiA9IEtleUV4cHJlc3Npb247XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUtleUV4cHJlc3Npb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBLZXlFeHByZXNzaW9uXzEgPSByZXF1aXJlKFwiLi9LZXlFeHByZXNzaW9uXCIpO1xyXG52YXIgRXZlbnRUYXJnZXRFdmVudEVtaXR0ZXJBZGFwdGVyXzEgPSByZXF1aXJlKFwiLi9FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXJcIik7XHJcbnZhciBLZXlJbnB1dCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBLZXlJbnB1dChlbWl0dGVycykge1xyXG4gICAgICAgIHRoaXMuZW1pdHRlcnMgPSBlbWl0dGVycztcclxuICAgICAgICB0aGlzLnN1YnMgPSBbXTtcclxuICAgIH1cclxuICAgIEtleUlucHV0LmZvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgZWxtdHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICBlbG10c1tfaV0gPSBhcmd1bWVudHNbX2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEtleUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfTtcclxuICAgIEtleUlucHV0LnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uIChleHBycywgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShleHBycykpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub24oW2V4cHJzXSwgY2FsbGJhY2spO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uIChyZSkge1xyXG4gICAgICAgICAgICB2YXIgc3MgPSB0aGlzXzEuZW1pdHRlcnMubWFwKGZ1bmN0aW9uIChlZSkgeyByZXR1cm4gX3RoaXMuY3JlYXRlTGlzdGVuZXIoZWUsIEtleUV4cHJlc3Npb25fMS5LZXlFeHByZXNzaW9uLnBhcnNlKHJlKSwgY2FsbGJhY2spOyB9KTtcclxuICAgICAgICAgICAgdGhpc18xLnN1YnMgPSB0aGlzXzEuc3Vicy5jb25jYXQoc3MpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIHRoaXNfMSA9IHRoaXM7XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBleHByc18xID0gZXhwcnM7IF9pIDwgZXhwcnNfMS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFyIHJlID0gZXhwcnNfMVtfaV07XHJcbiAgICAgICAgICAgIF9sb29wXzEocmUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBLZXlJbnB1dC5wcm90b3R5cGUuY3JlYXRlTGlzdGVuZXIgPSBmdW5jdGlvbiAoZWUsIGtlLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiBlZS5vbigna2V5ZG93bicsIGZ1bmN0aW9uIChldnQpIHtcclxuICAgICAgICAgICAgaWYgKGtlLm1hdGNoZXMoZXZ0KSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGtlLmV4Y2x1c2l2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gS2V5SW5wdXQ7XHJcbn0oKSk7XHJcbmV4cG9ydHMuS2V5SW5wdXQgPSBLZXlJbnB1dDtcclxuZnVuY3Rpb24gbm9ybWFsaXplKGttcykge1xyXG4gICAgcmV0dXJuIGttc1xyXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXJfMS5FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoeClcclxuICAgICAgICA6IHg7IH0pO1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUtleUlucHV0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgS2V5cyA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBLZXlzKCkge1xyXG4gICAgfVxyXG4gICAgS2V5cy5wYXJzZSA9IGZ1bmN0aW9uIChpbnB1dCwgdGhyb3duT25GYWlsKSB7XHJcbiAgICAgICAgaWYgKHRocm93bk9uRmFpbCA9PT0gdm9pZCAwKSB7IHRocm93bk9uRmFpbCA9IHRydWU7IH1cclxuICAgICAgICBzd2l0Y2ggKGlucHV0LnRyaW0oKSkge1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLU1BBQ0UnOiByZXR1cm4gS2V5cy5CQUNLU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1RBQic6IHJldHVybiBLZXlzLlRBQjtcclxuICAgICAgICAgICAgY2FzZSAnRU5URVInOiByZXR1cm4gS2V5cy5FTlRFUjtcclxuICAgICAgICAgICAgY2FzZSAnU0hJRlQnOiByZXR1cm4gS2V5cy5TSElGVDtcclxuICAgICAgICAgICAgY2FzZSAnQ1RSTCc6IHJldHVybiBLZXlzLkNUUkw7XHJcbiAgICAgICAgICAgIGNhc2UgJ0FMVCc6IHJldHVybiBLZXlzLkFMVDtcclxuICAgICAgICAgICAgY2FzZSAnUEFVU0UnOiByZXR1cm4gS2V5cy5QQVVTRTtcclxuICAgICAgICAgICAgY2FzZSAnQ0FQU19MT0NLJzogcmV0dXJuIEtleXMuQ0FQU19MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdFU0NBUEUnOiByZXR1cm4gS2V5cy5FU0NBUEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NQQUNFJzogcmV0dXJuIEtleXMuU1BBQ0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BBR0VfVVAnOiByZXR1cm4gS2V5cy5QQUdFX1VQO1xyXG4gICAgICAgICAgICBjYXNlICdQQUdFX0RPV04nOiByZXR1cm4gS2V5cy5QQUdFX0RPV047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VORCc6IHJldHVybiBLZXlzLkVORDtcclxuICAgICAgICAgICAgY2FzZSAnSE9NRSc6IHJldHVybiBLZXlzLkhPTUU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfQVJST1cnOiByZXR1cm4gS2V5cy5MRUZUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdVUF9BUlJPVyc6IHJldHVybiBLZXlzLlVQX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdSSUdIVF9BUlJPVyc6IHJldHVybiBLZXlzLlJJR0hUX0FSUk9XO1xyXG4gICAgICAgICAgICBjYXNlICdET1dOX0FSUk9XJzogcmV0dXJuIEtleXMuRE9XTl9BUlJPVztcclxuICAgICAgICAgICAgY2FzZSAnSU5TRVJUJzogcmV0dXJuIEtleXMuSU5TRVJUO1xyXG4gICAgICAgICAgICBjYXNlICdERUxFVEUnOiByZXR1cm4gS2V5cy5ERUxFVEU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8wJzogcmV0dXJuIEtleXMuS0VZXzA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8xJzogcmV0dXJuIEtleXMuS0VZXzE7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8yJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV8zJzogcmV0dXJuIEtleXMuS0VZXzM7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV80JzogcmV0dXJuIEtleXMuS0VZXzQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV81JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV82JzogcmV0dXJuIEtleXMuS0VZXzY7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV83JzogcmV0dXJuIEtleXMuS0VZXzc7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV84JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV85JzogcmV0dXJuIEtleXMuS0VZXzk7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9BJzogcmV0dXJuIEtleXMuS0VZX0E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9CJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9DJzogcmV0dXJuIEtleXMuS0VZX0M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9EJzogcmV0dXJuIEtleXMuS0VZX0Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9FJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9GJzogcmV0dXJuIEtleXMuS0VZX0Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9HJzogcmV0dXJuIEtleXMuS0VZX0c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9IJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9JJzogcmV0dXJuIEtleXMuS0VZX0k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9KJzogcmV0dXJuIEtleXMuS0VZX0o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9LJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9MJzogcmV0dXJuIEtleXMuS0VZX0w7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9NJzogcmV0dXJuIEtleXMuS0VZX007XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9OJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9PJzogcmV0dXJuIEtleXMuS0VZX087XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9QJzogcmV0dXJuIEtleXMuS0VZX1A7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9RJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9SJzogcmV0dXJuIEtleXMuS0VZX1I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9TJzogcmV0dXJuIEtleXMuS0VZX1M7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9UJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9VJzogcmV0dXJuIEtleXMuS0VZX1U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9WJzogcmV0dXJuIEtleXMuS0VZX1Y7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9XJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9YJzogcmV0dXJuIEtleXMuS0VZX1g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9ZJzogcmV0dXJuIEtleXMuS0VZX1k7XHJcbiAgICAgICAgICAgIGNhc2UgJ0tFWV9aJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJzAnOiByZXR1cm4gS2V5cy5LRVlfMDtcclxuICAgICAgICAgICAgY2FzZSAnMSc6IHJldHVybiBLZXlzLktFWV8xO1xyXG4gICAgICAgICAgICBjYXNlICcyJzogcmV0dXJuIEtleXMuS0VZXzI7XHJcbiAgICAgICAgICAgIGNhc2UgJzMnOiByZXR1cm4gS2V5cy5LRVlfMztcclxuICAgICAgICAgICAgY2FzZSAnNCc6IHJldHVybiBLZXlzLktFWV80O1xyXG4gICAgICAgICAgICBjYXNlICc1JzogcmV0dXJuIEtleXMuS0VZXzU7XHJcbiAgICAgICAgICAgIGNhc2UgJzYnOiByZXR1cm4gS2V5cy5LRVlfNjtcclxuICAgICAgICAgICAgY2FzZSAnNyc6IHJldHVybiBLZXlzLktFWV83O1xyXG4gICAgICAgICAgICBjYXNlICc4JzogcmV0dXJuIEtleXMuS0VZXzg7XHJcbiAgICAgICAgICAgIGNhc2UgJzknOiByZXR1cm4gS2V5cy5LRVlfOTtcclxuICAgICAgICAgICAgY2FzZSAnQSc6IHJldHVybiBLZXlzLktFWV9BO1xyXG4gICAgICAgICAgICBjYXNlICdCJzogcmV0dXJuIEtleXMuS0VZX0I7XHJcbiAgICAgICAgICAgIGNhc2UgJ0MnOiByZXR1cm4gS2V5cy5LRVlfQztcclxuICAgICAgICAgICAgY2FzZSAnRCc6IHJldHVybiBLZXlzLktFWV9EO1xyXG4gICAgICAgICAgICBjYXNlICdFJzogcmV0dXJuIEtleXMuS0VZX0U7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YnOiByZXR1cm4gS2V5cy5LRVlfRjtcclxuICAgICAgICAgICAgY2FzZSAnRyc6IHJldHVybiBLZXlzLktFWV9HO1xyXG4gICAgICAgICAgICBjYXNlICdIJzogcmV0dXJuIEtleXMuS0VZX0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0knOiByZXR1cm4gS2V5cy5LRVlfSTtcclxuICAgICAgICAgICAgY2FzZSAnSic6IHJldHVybiBLZXlzLktFWV9KO1xyXG4gICAgICAgICAgICBjYXNlICdLJzogcmV0dXJuIEtleXMuS0VZX0s7XHJcbiAgICAgICAgICAgIGNhc2UgJ0wnOiByZXR1cm4gS2V5cy5LRVlfTDtcclxuICAgICAgICAgICAgY2FzZSAnTSc6IHJldHVybiBLZXlzLktFWV9NO1xyXG4gICAgICAgICAgICBjYXNlICdOJzogcmV0dXJuIEtleXMuS0VZX047XHJcbiAgICAgICAgICAgIGNhc2UgJ08nOiByZXR1cm4gS2V5cy5LRVlfTztcclxuICAgICAgICAgICAgY2FzZSAnUCc6IHJldHVybiBLZXlzLktFWV9QO1xyXG4gICAgICAgICAgICBjYXNlICdRJzogcmV0dXJuIEtleXMuS0VZX1E7XHJcbiAgICAgICAgICAgIGNhc2UgJ1InOiByZXR1cm4gS2V5cy5LRVlfUjtcclxuICAgICAgICAgICAgY2FzZSAnUyc6IHJldHVybiBLZXlzLktFWV9TO1xyXG4gICAgICAgICAgICBjYXNlICdUJzogcmV0dXJuIEtleXMuS0VZX1Q7XHJcbiAgICAgICAgICAgIGNhc2UgJ1UnOiByZXR1cm4gS2V5cy5LRVlfVTtcclxuICAgICAgICAgICAgY2FzZSAnVic6IHJldHVybiBLZXlzLktFWV9WO1xyXG4gICAgICAgICAgICBjYXNlICdXJzogcmV0dXJuIEtleXMuS0VZX1c7XHJcbiAgICAgICAgICAgIGNhc2UgJ1gnOiByZXR1cm4gS2V5cy5LRVlfWDtcclxuICAgICAgICAgICAgY2FzZSAnWSc6IHJldHVybiBLZXlzLktFWV9ZO1xyXG4gICAgICAgICAgICBjYXNlICdaJzogcmV0dXJuIEtleXMuS0VZX1o7XHJcbiAgICAgICAgICAgIGNhc2UgJ0xFRlRfTUVUQSc6IHJldHVybiBLZXlzLkxFRlRfTUVUQTtcclxuICAgICAgICAgICAgY2FzZSAnUklHSFRfTUVUQSc6IHJldHVybiBLZXlzLlJJR0hUX01FVEE7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NFTEVDVCc6IHJldHVybiBLZXlzLlNFTEVDVDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzAnOiByZXR1cm4gS2V5cy5OVU1QQURfMDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzEnOiByZXR1cm4gS2V5cy5OVU1QQURfMTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzInOiByZXR1cm4gS2V5cy5OVU1QQURfMjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzMnOiByZXR1cm4gS2V5cy5OVU1QQURfMztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzQnOiByZXR1cm4gS2V5cy5OVU1QQURfNDtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzUnOiByZXR1cm4gS2V5cy5OVU1QQURfNTtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzYnOiByZXR1cm4gS2V5cy5OVU1QQURfNjtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzcnOiByZXR1cm4gS2V5cy5OVU1QQURfNztcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzgnOiByZXR1cm4gS2V5cy5OVU1QQURfODtcclxuICAgICAgICAgICAgY2FzZSAnTlVNUEFEXzknOiByZXR1cm4gS2V5cy5OVU1QQURfOTtcclxuICAgICAgICAgICAgY2FzZSAnTVVMVElQTFknOiByZXR1cm4gS2V5cy5NVUxUSVBMWTtcclxuICAgICAgICAgICAgY2FzZSAnQUREJzogcmV0dXJuIEtleXMuQUREO1xyXG4gICAgICAgICAgICBjYXNlICdTVUJUUkFDVCc6IHJldHVybiBLZXlzLlNVQlRSQUNUO1xyXG4gICAgICAgICAgICBjYXNlICdERUNJTUFMJzogcmV0dXJuIEtleXMuREVDSU1BTDtcclxuICAgICAgICAgICAgY2FzZSAnRElWSURFJzogcmV0dXJuIEtleXMuRElWSURFO1xyXG4gICAgICAgICAgICBjYXNlICdGMSc6IHJldHVybiBLZXlzLkYxO1xyXG4gICAgICAgICAgICBjYXNlICdGMic6IHJldHVybiBLZXlzLkYyO1xyXG4gICAgICAgICAgICBjYXNlICdGMyc6IHJldHVybiBLZXlzLkYzO1xyXG4gICAgICAgICAgICBjYXNlICdGNCc6IHJldHVybiBLZXlzLkY0O1xyXG4gICAgICAgICAgICBjYXNlICdGNSc6IHJldHVybiBLZXlzLkY1O1xyXG4gICAgICAgICAgICBjYXNlICdGNic6IHJldHVybiBLZXlzLkY2O1xyXG4gICAgICAgICAgICBjYXNlICdGNyc6IHJldHVybiBLZXlzLkY3O1xyXG4gICAgICAgICAgICBjYXNlICdGOCc6IHJldHVybiBLZXlzLkY4O1xyXG4gICAgICAgICAgICBjYXNlICdGOSc6IHJldHVybiBLZXlzLkY5O1xyXG4gICAgICAgICAgICBjYXNlICdGMTAnOiByZXR1cm4gS2V5cy5GMTA7XHJcbiAgICAgICAgICAgIGNhc2UgJ0YxMSc6IHJldHVybiBLZXlzLkYxMTtcclxuICAgICAgICAgICAgY2FzZSAnRjEyJzogcmV0dXJuIEtleXMuRjEyO1xyXG4gICAgICAgICAgICBjYXNlICdOVU1fTE9DSyc6IHJldHVybiBLZXlzLk5VTV9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTQ1JPTExfTE9DSyc6IHJldHVybiBLZXlzLlNDUk9MTF9MT0NLO1xyXG4gICAgICAgICAgICBjYXNlICdTRU1JQ09MT04nOiByZXR1cm4gS2V5cy5TRU1JQ09MT047XHJcbiAgICAgICAgICAgIGNhc2UgJ0VRVUFMUyc6IHJldHVybiBLZXlzLkVRVUFMUztcclxuICAgICAgICAgICAgY2FzZSAnQ09NTUEnOiByZXR1cm4gS2V5cy5DT01NQTtcclxuICAgICAgICAgICAgY2FzZSAnREFTSCc6IHJldHVybiBLZXlzLkRBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ1BFUklPRCc6IHJldHVybiBLZXlzLlBFUklPRDtcclxuICAgICAgICAgICAgY2FzZSAnRk9SV0FSRF9TTEFTSCc6IHJldHVybiBLZXlzLkZPUldBUkRfU0xBU0g7XHJcbiAgICAgICAgICAgIGNhc2UgJ0dSQVZFX0FDQ0VOVCc6IHJldHVybiBLZXlzLkdSQVZFX0FDQ0VOVDtcclxuICAgICAgICAgICAgY2FzZSAnT1BFTl9CUkFDS0VUJzogcmV0dXJuIEtleXMuT1BFTl9CUkFDS0VUO1xyXG4gICAgICAgICAgICBjYXNlICdCQUNLX1NMQVNIJzogcmV0dXJuIEtleXMuQkFDS19TTEFTSDtcclxuICAgICAgICAgICAgY2FzZSAnQ0xPU0VfQlJBQ0tFVCc6IHJldHVybiBLZXlzLkNMT1NFX0JSQUNLRVQ7XHJcbiAgICAgICAgICAgIGNhc2UgJ1NJTkdMRV9RVU9URSc6IHJldHVybiBLZXlzLlNJTkdMRV9RVU9URTtcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGlmICh0aHJvd25PbkZhaWwpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQga2V5OiAnICsgaW5wdXQ7XHJcbiAgICAgICAgICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBLZXlzO1xyXG59KCkpO1xyXG5LZXlzLkJBQ0tTUEFDRSA9IDg7XHJcbktleXMuVEFCID0gOTtcclxuS2V5cy5FTlRFUiA9IDEzO1xyXG5LZXlzLlNISUZUID0gMTY7XHJcbktleXMuQ1RSTCA9IDE3O1xyXG5LZXlzLkFMVCA9IDE4O1xyXG5LZXlzLlBBVVNFID0gMTk7XHJcbktleXMuQ0FQU19MT0NLID0gMjA7XHJcbktleXMuRVNDQVBFID0gMjc7XHJcbktleXMuU1BBQ0UgPSAzMjtcclxuS2V5cy5QQUdFX1VQID0gMzM7XHJcbktleXMuUEFHRV9ET1dOID0gMzQ7XHJcbktleXMuRU5EID0gMzU7XHJcbktleXMuSE9NRSA9IDM2O1xyXG5LZXlzLkxFRlRfQVJST1cgPSAzNztcclxuS2V5cy5VUF9BUlJPVyA9IDM4O1xyXG5LZXlzLlJJR0hUX0FSUk9XID0gMzk7XHJcbktleXMuRE9XTl9BUlJPVyA9IDQwO1xyXG5LZXlzLklOU0VSVCA9IDQ1O1xyXG5LZXlzLkRFTEVURSA9IDQ2O1xyXG5LZXlzLktFWV8wID0gNDg7XHJcbktleXMuS0VZXzEgPSA0OTtcclxuS2V5cy5LRVlfMiA9IDUwO1xyXG5LZXlzLktFWV8zID0gNTE7XHJcbktleXMuS0VZXzQgPSA1MjtcclxuS2V5cy5LRVlfNSA9IDUzO1xyXG5LZXlzLktFWV82ID0gNTQ7XHJcbktleXMuS0VZXzcgPSA1NTtcclxuS2V5cy5LRVlfOCA9IDU2O1xyXG5LZXlzLktFWV85ID0gNTc7XHJcbktleXMuS0VZX0EgPSA2NTtcclxuS2V5cy5LRVlfQiA9IDY2O1xyXG5LZXlzLktFWV9DID0gNjc7XHJcbktleXMuS0VZX0QgPSA2ODtcclxuS2V5cy5LRVlfRSA9IDY5O1xyXG5LZXlzLktFWV9GID0gNzA7XHJcbktleXMuS0VZX0cgPSA3MTtcclxuS2V5cy5LRVlfSCA9IDcyO1xyXG5LZXlzLktFWV9JID0gNzM7XHJcbktleXMuS0VZX0ogPSA3NDtcclxuS2V5cy5LRVlfSyA9IDc1O1xyXG5LZXlzLktFWV9MID0gNzY7XHJcbktleXMuS0VZX00gPSA3NztcclxuS2V5cy5LRVlfTiA9IDc4O1xyXG5LZXlzLktFWV9PID0gNzk7XHJcbktleXMuS0VZX1AgPSA4MDtcclxuS2V5cy5LRVlfUSA9IDgxO1xyXG5LZXlzLktFWV9SID0gODI7XHJcbktleXMuS0VZX1MgPSA4MztcclxuS2V5cy5LRVlfVCA9IDg0O1xyXG5LZXlzLktFWV9VID0gODU7XHJcbktleXMuS0VZX1YgPSA4NjtcclxuS2V5cy5LRVlfVyA9IDg3O1xyXG5LZXlzLktFWV9YID0gODg7XHJcbktleXMuS0VZX1kgPSA4OTtcclxuS2V5cy5LRVlfWiA9IDkwO1xyXG5LZXlzLkxFRlRfTUVUQSA9IDkxO1xyXG5LZXlzLlJJR0hUX01FVEEgPSA5MjtcclxuS2V5cy5TRUxFQ1QgPSA5MztcclxuS2V5cy5OVU1QQURfMCA9IDk2O1xyXG5LZXlzLk5VTVBBRF8xID0gOTc7XHJcbktleXMuTlVNUEFEXzIgPSA5ODtcclxuS2V5cy5OVU1QQURfMyA9IDk5O1xyXG5LZXlzLk5VTVBBRF80ID0gMTAwO1xyXG5LZXlzLk5VTVBBRF81ID0gMTAxO1xyXG5LZXlzLk5VTVBBRF82ID0gMTAyO1xyXG5LZXlzLk5VTVBBRF83ID0gMTAzO1xyXG5LZXlzLk5VTVBBRF84ID0gMTA0O1xyXG5LZXlzLk5VTVBBRF85ID0gMTA1O1xyXG5LZXlzLk1VTFRJUExZID0gMTA2O1xyXG5LZXlzLkFERCA9IDEwNztcclxuS2V5cy5TVUJUUkFDVCA9IDEwOTtcclxuS2V5cy5ERUNJTUFMID0gMTEwO1xyXG5LZXlzLkRJVklERSA9IDExMTtcclxuS2V5cy5GMSA9IDExMjtcclxuS2V5cy5GMiA9IDExMztcclxuS2V5cy5GMyA9IDExNDtcclxuS2V5cy5GNCA9IDExNTtcclxuS2V5cy5GNSA9IDExNjtcclxuS2V5cy5GNiA9IDExNztcclxuS2V5cy5GNyA9IDExODtcclxuS2V5cy5GOCA9IDExOTtcclxuS2V5cy5GOSA9IDEyMDtcclxuS2V5cy5GMTAgPSAxMjE7XHJcbktleXMuRjExID0gMTIyO1xyXG5LZXlzLkYxMiA9IDEyMztcclxuS2V5cy5OVU1fTE9DSyA9IDE0NDtcclxuS2V5cy5TQ1JPTExfTE9DSyA9IDE0NTtcclxuS2V5cy5TRU1JQ09MT04gPSAxODY7XHJcbktleXMuRVFVQUxTID0gMTg3O1xyXG5LZXlzLkNPTU1BID0gMTg4O1xyXG5LZXlzLkRBU0ggPSAxODk7XHJcbktleXMuUEVSSU9EID0gMTkwO1xyXG5LZXlzLkZPUldBUkRfU0xBU0ggPSAxOTE7XHJcbktleXMuR1JBVkVfQUNDRU5UID0gMTkyO1xyXG5LZXlzLk9QRU5fQlJBQ0tFVCA9IDIxOTtcclxuS2V5cy5CQUNLX1NMQVNIID0gMjIwO1xyXG5LZXlzLkNMT1NFX0JSQUNLRVQgPSAyMjE7XHJcbktleXMuU0lOR0xFX1FVT1RFID0gMjIyO1xyXG5leHBvcnRzLktleXMgPSBLZXlzO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1LZXlzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgUG9pbnRfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1BvaW50XCIpO1xyXG52YXIgTW91c2VEcmFnRXZlbnRTdXBwb3J0ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydChlbG10KSB7XHJcbiAgICAgICAgdGhpcy5lbG10ID0gZWxtdDtcclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmVsbXQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5saXN0ZW5lciA9IHRoaXMub25UYXJnZXRNb3VzZURvd24uYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgICBNb3VzZURyYWdFdmVudFN1cHBvcnQuY2hlY2sgPSBmdW5jdGlvbiAoZWxtdCkge1xyXG4gICAgICAgIHJldHVybiBlbG10LmRhdGFzZXRbJ01vdXNlRHJhZ0V2ZW50U3VwcG9ydCddID09PSAndHJ1ZSc7XHJcbiAgICB9O1xyXG4gICAgTW91c2VEcmFnRXZlbnRTdXBwb3J0LmVuYWJsZSA9IGZ1bmN0aW9uIChlbG10KSB7XHJcbiAgICAgICAgZWxtdC5kYXRhc2V0WydNb3VzZURyYWdFdmVudFN1cHBvcnQnXSA9ICd0cnVlJztcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRHJhZ0V2ZW50U3VwcG9ydChlbG10KTtcclxuICAgIH07XHJcbiAgICBNb3VzZURyYWdFdmVudFN1cHBvcnQucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5lbG10LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMubGlzdGVuZXIpO1xyXG4gICAgfTtcclxuICAgIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydC5wcm90b3R5cGUub25UYXJnZXRNb3VzZURvd24gPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIC8vZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3RhcnRQb2ludCA9IHRoaXMubGFzdFBvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG4gICAgICAgIHZhciBtb3ZlSGFuZGxlciA9IHRoaXMub25XaW5kb3dNb3VzZU1vdmUuYmluZCh0aGlzKTtcclxuICAgICAgICB2YXIgdXBIYW5kbGVyID0gdGhpcy5vbldpbmRvd01vdXNlVXAuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICAgICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB1cEhhbmRsZXIpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG1vdmVIYW5kbGVyKTtcclxuICAgICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHVwSGFuZGxlcik7XHJcbiAgICB9O1xyXG4gICAgTW91c2VEcmFnRXZlbnRTdXBwb3J0LnByb3RvdHlwZS5vbldpbmRvd01vdXNlTW92ZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgdmFyIG5ld1BvaW50ID0gbmV3IFBvaW50XzEuUG9pbnQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xyXG4gICAgICAgIGlmICh0aGlzLnNob3VsZERyYWcpIHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzRHJhZ2dpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxtdC5kaXNwYXRjaEV2ZW50KHRoaXMuY3JlYXRlRXZlbnQoJ2RyYWdiZWdpbicsIGUpKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNEcmFnZ2luZyA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnJywgZSwgbmV3UG9pbnQuc3VidHJhY3QodGhpcy5sYXN0UG9pbnQpKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5sYXN0UG9pbnQgPSBuZXdQb2ludDtcclxuICAgIH07XHJcbiAgICBNb3VzZURyYWdFdmVudFN1cHBvcnQucHJvdG90eXBlLm9uV2luZG93TW91c2VVcCA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNEcmFnZ2luZykge1xyXG4gICAgICAgICAgICB0aGlzLmVsbXQuZGlzcGF0Y2hFdmVudCh0aGlzLmNyZWF0ZUV2ZW50KCdkcmFnZW5kJywgZSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNob3VsZERyYWcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmlzRHJhZ2dpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmxhc3RQb2ludCA9IG5ldyBQb2ludF8xLlBvaW50KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcclxuICAgICAgICBpZiAodGhpcy5jYW5jZWwpIHtcclxuICAgICAgICAgICAgdGhpcy5jYW5jZWwoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgTW91c2VEcmFnRXZlbnRTdXBwb3J0LnByb3RvdHlwZS5jcmVhdGVFdmVudCA9IGZ1bmN0aW9uICh0eXBlLCBzb3VyY2UsIGRpc3QpIHtcclxuICAgICAgICB2YXIgZXZlbnQgPSAobmV3IE1vdXNlRXZlbnQodHlwZSwgc291cmNlKSk7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRYID0gdGhpcy5zdGFydFBvaW50Lng7XHJcbiAgICAgICAgZXZlbnQuc3RhcnRZID0gdGhpcy5zdGFydFBvaW50Lnk7XHJcbiAgICAgICAgaWYgKGRpc3QpIHtcclxuICAgICAgICAgICAgZXZlbnQuZGlzdFggPSBkaXN0Lng7XHJcbiAgICAgICAgICAgIGV2ZW50LmRpc3RZID0gZGlzdC55O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZXZlbnQ7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIE1vdXNlRHJhZ0V2ZW50U3VwcG9ydDtcclxufSgpKTtcclxuZXhwb3J0cy5Nb3VzZURyYWdFdmVudFN1cHBvcnQgPSBNb3VzZURyYWdFdmVudFN1cHBvcnQ7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1vdXNlRHJhZ0V2ZW50U3VwcG9ydC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEtleXNfMSA9IHJlcXVpcmUoXCIuL0tleXNcIik7XHJcbnZhciBfID0gcmVxdWlyZShcIi4uL21pc2MvVXRpbFwiKTtcclxuZnVuY3Rpb24gcGFyc2VfZXZlbnQodmFsdWUpIHtcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpIHtcclxuICAgICAgICBjYXNlICdkb3duJzpcclxuICAgICAgICBjYXNlICdtb3ZlJzpcclxuICAgICAgICBjYXNlICd1cCc6XHJcbiAgICAgICAgICAgIHJldHVybiAoJ21vdXNlJyArIHZhbHVlKTtcclxuICAgICAgICBjYXNlICdjbGljayc6XHJcbiAgICAgICAgY2FzZSAnZGJsY2xpY2snOlxyXG4gICAgICAgIGNhc2UgJ2Rvd24nOlxyXG4gICAgICAgIGNhc2UgJ21vdmUnOlxyXG4gICAgICAgIGNhc2UgJ3VwJzpcclxuICAgICAgICBjYXNlICdkcmFnYmVnaW4nOlxyXG4gICAgICAgIGNhc2UgJ2RyYWcnOlxyXG4gICAgICAgIGNhc2UgJ2RyYWdlbmQnOlxyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgdGhyb3cgJ0ludmFsaWQgTW91c2VFdmVudFR5cGU6ICcgKyB2YWx1ZTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBwYXJzZV9idXR0b24odmFsdWUpIHtcclxuICAgIHZhbHVlID0gKHZhbHVlIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKTtcclxuICAgIHN3aXRjaCAodmFsdWUpIHtcclxuICAgICAgICBjYXNlICdwcmltYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24xJzpcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgY2FzZSAnc2Vjb25kYXJ5JzpcclxuICAgICAgICBjYXNlICdidXR0b24yJzpcclxuICAgICAgICAgICAgcmV0dXJuIDE7XHJcbiAgICAgICAgY2FzZSAnYnV0dG9uMyc6XHJcbiAgICAgICAgICAgIHJldHVybiAyO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93ICdJbnZhbGlkIE1vdXNlQnV0dG9uOiAnICsgdmFsdWU7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gZGl2aWRlX2V4cHJlc3Npb24odmFsdWUpIHtcclxuICAgIHZhciBwYXJ0cyA9IHZhbHVlLnNwbGl0KCc6Jyk7XHJcbiAgICBpZiAocGFydHMubGVuZ3RoID09IDEpIHtcclxuICAgICAgICBwYXJ0cy5zcGxpY2UoMCwgMCwgJ2Rvd24nKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXJ0cy5zbGljZSgwLCAyKTtcclxufVxyXG52YXIgTW91c2VFeHByZXNzaW9uID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIE1vdXNlRXhwcmVzc2lvbihjZmcpIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gbnVsbDtcclxuICAgICAgICB0aGlzLmJ1dHRvbiA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5jdHJsID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5hbHQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnNoaWZ0ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5leGNsdXNpdmUgPSBmYWxzZTtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCBjZmcpO1xyXG4gICAgfVxyXG4gICAgTW91c2VFeHByZXNzaW9uLnBhcnNlID0gZnVuY3Rpb24gKGlucHV0KSB7XHJcbiAgICAgICAgdmFyIGNmZyA9IHt9O1xyXG4gICAgICAgIGNmZy5leGNsdXNpdmUgPSBpbnB1dFswXSA9PT0gJyEnO1xyXG4gICAgICAgIGlmIChjZmcuZXhjbHVzaXZlKSB7XHJcbiAgICAgICAgICAgIGlucHV0ID0gaW5wdXQuc3Vic3RyKDEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgX2EgPSBkaXZpZGVfZXhwcmVzc2lvbihpbnB1dCksIGxlZnQgPSBfYVswXSwgcmlnaHQgPSBfYVsxXTtcclxuICAgICAgICBjZmcuZXZlbnQgPSBwYXJzZV9ldmVudChsZWZ0KTtcclxuICAgICAgICByaWdodC5zcGxpdCgvW1xcc1xcLVxcK10rLylcclxuICAgICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24gKHgpIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IEtleXNfMS5LZXlzLnBhcnNlKHgsIGZhbHNlKTtcclxuICAgICAgICAgICAgaWYgKGtleSAhPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChrZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEtleXNfMS5LZXlzLkNUUkw6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5jdHJsID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBLZXlzXzEuS2V5cy5BTFQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNmZy5hbHQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEtleXNfMS5LZXlzLlNISUZUOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZmcuc2hpZnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNmZy5idXR0b24gPSBwYXJzZV9idXR0b24oeCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gbmV3IE1vdXNlRXhwcmVzc2lvbihjZmcpO1xyXG4gICAgfTtcclxuICAgIE1vdXNlRXhwcmVzc2lvbi5wcm90b3R5cGUubWF0Y2hlcyA9IGZ1bmN0aW9uIChtb3VzZURhdGEpIHtcclxuICAgICAgICByZXR1cm4gKHRoaXMuZXZlbnQgPT0gbW91c2VEYXRhLnR5cGUgJiZcclxuICAgICAgICAgICAgdGhpcy5jdHJsID09IG1vdXNlRGF0YS5jdHJsS2V5ICYmXHJcbiAgICAgICAgICAgIHRoaXMuYWx0ID09IG1vdXNlRGF0YS5hbHRLZXkgJiZcclxuICAgICAgICAgICAgdGhpcy5zaGlmdCA9PSBtb3VzZURhdGEuc2hpZnRLZXkgJiZcclxuICAgICAgICAgICAgKHRoaXMuYnV0dG9uID09IG51bGwgfHwgdGhpcy5idXR0b24gPT0gbW91c2VEYXRhLmJ1dHRvbikpO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBNb3VzZUV4cHJlc3Npb247XHJcbn0oKSk7XHJcbmV4cG9ydHMuTW91c2VFeHByZXNzaW9uID0gTW91c2VFeHByZXNzaW9uO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Nb3VzZUV4cHJlc3Npb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXJfMSA9IHJlcXVpcmUoXCIuL0V2ZW50VGFyZ2V0RXZlbnRFbWl0dGVyQWRhcHRlclwiKTtcclxudmFyIE1vdXNlRXhwcmVzc2lvbl8xID0gcmVxdWlyZShcIi4vTW91c2VFeHByZXNzaW9uXCIpO1xyXG52YXIgTW91c2VJbnB1dCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBNb3VzZUlucHV0KGVtaXR0ZXJzKSB7XHJcbiAgICAgICAgdGhpcy5lbWl0dGVycyA9IGVtaXR0ZXJzO1xyXG4gICAgICAgIHRoaXMuc3VicyA9IFtdO1xyXG4gICAgfVxyXG4gICAgTW91c2VJbnB1dC5mb3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGVsbXRzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgZWxtdHNbX2ldID0gYXJndW1lbnRzW19pXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ldyBNb3VzZUlucHV0KG5vcm1hbGl6ZShlbG10cykpO1xyXG4gICAgfTtcclxuICAgIE1vdXNlSW5wdXQucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV4cHIsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB2YXIgc3MgPSB0aGlzLmVtaXR0ZXJzLm1hcChmdW5jdGlvbiAoZWUpIHsgcmV0dXJuIF90aGlzLmNyZWF0ZUxpc3RlbmVyKGVlLCBNb3VzZUV4cHJlc3Npb25fMS5Nb3VzZUV4cHJlc3Npb24ucGFyc2UoZXhwciksIGNhbGxiYWNrKTsgfSk7XHJcbiAgICAgICAgdGhpcy5zdWJzID0gdGhpcy5zdWJzLmNvbmNhdChzcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9O1xyXG4gICAgTW91c2VJbnB1dC5wcm90b3R5cGUuY3JlYXRlTGlzdGVuZXIgPSBmdW5jdGlvbiAodGFyZ2V0LCBleHByLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHJldHVybiB0YXJnZXQub24oZXhwci5ldmVudCwgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICBpZiAoZXhwci5tYXRjaGVzKGV2dCkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChleHByLmV4Y2x1c2l2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICByZXR1cm4gTW91c2VJbnB1dDtcclxufSgpKTtcclxuZXhwb3J0cy5Nb3VzZUlucHV0ID0gTW91c2VJbnB1dDtcclxuZnVuY3Rpb24gbm9ybWFsaXplKGttcykge1xyXG4gICAgcmV0dXJuIGttc1xyXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICghIXhbJ2FkZEV2ZW50TGlzdGVuZXInXSlcclxuICAgICAgICA/IG5ldyBFdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXJfMS5FdmVudFRhcmdldEV2ZW50RW1pdHRlckFkYXB0ZXIoeClcclxuICAgICAgICA6IHg7IH0pO1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1vdXNlSW5wdXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIHBhcnNlKGh0bWwpIHtcclxuICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xyXG4gICAgdmFyIGJvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdib2R5Jyk7XHJcbiAgICBmcmFnLmFwcGVuZENoaWxkKGJvZHkpO1xyXG4gICAgYm9keS5pbm5lckhUTUwgPSBodG1sO1xyXG4gICAgcmV0dXJuIGJvZHkuZmlyc3RFbGVtZW50Q2hpbGQ7XHJcbn1cclxuZXhwb3J0cy5wYXJzZSA9IHBhcnNlO1xyXG5mdW5jdGlvbiBjc3MoZSwgc3R5bGVzKSB7XHJcbiAgICBmb3IgKHZhciBwcm9wIGluIHN0eWxlcykge1xyXG4gICAgICAgIGUuc3R5bGVbcHJvcF0gPSBzdHlsZXNbcHJvcF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZTtcclxufVxyXG5leHBvcnRzLmNzcyA9IGNzcztcclxuZnVuY3Rpb24gaGlkZShlKSB7XHJcbiAgICByZXR1cm4gY3NzKGUsIHsgZGlzcGxheTogJ25vbmUnIH0pO1xyXG59XHJcbmV4cG9ydHMuaGlkZSA9IGhpZGU7XHJcbmZ1bmN0aW9uIHNob3coZSkge1xyXG4gICAgcmV0dXJuIGNzcyhlLCB7IGRpc3BsYXk6ICdibG9jaycgfSk7XHJcbn1cclxuZXhwb3J0cy5zaG93ID0gc2hvdztcclxuZnVuY3Rpb24gdG9nZ2xlKGUsIHZpc2libGUpIHtcclxuICAgIHJldHVybiB2aXNpYmxlID8gc2hvdyhlKSA6IGhpZGUoZSk7XHJcbn1cclxuZXhwb3J0cy50b2dnbGUgPSB0b2dnbGU7XHJcbmZ1bmN0aW9uIHNpbmdsZVRyYW5zaXRpb24oZSwgcHJvcCwgbWlsbGlzLCBlYXNlKSB7XHJcbiAgICBpZiAoZWFzZSA9PT0gdm9pZCAwKSB7IGVhc2UgPSAnbGluZWFyJzsgfVxyXG4gICAgZS5zdHlsZS50cmFuc2l0aW9uID0gcHJvcCArIFwiIFwiICsgbWlsbGlzICsgXCJtcyBcIiArIGVhc2U7XHJcbiAgICBjb25zb2xlLmxvZyhlLnN0eWxlLnRyYW5zaXRpb24pO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7IHJldHVybiBlLnN0eWxlLnRyYW5zaXRpb24gPSAnJzsgfSwgbWlsbGlzKTtcclxufVxyXG5leHBvcnRzLnNpbmdsZVRyYW5zaXRpb24gPSBzaW5nbGVUcmFuc2l0aW9uO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1Eb20uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIHByb3BlcnR5KGRlZmF1bHRWYWx1ZSwgZmlsdGVyKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGN0b3IsIHByb3BOYW1lKSB7XHJcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIHByb3BOYW1lLCB7XHJcbiAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZhbCA9IHRoaXNbJ19fJyArIHByb3BOYW1lXTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAodmFsID09PSB1bmRlZmluZWQpID8gZGVmYXVsdFZhbHVlIDogdmFsO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uIChuZXdWYWwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXNbJ19fJyArIHByb3BOYW1lXSA9IG5ld1ZhbDtcclxuICAgICAgICAgICAgICAgIGZpbHRlcih0aGlzLCBuZXdWYWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMucHJvcGVydHkgPSBwcm9wZXJ0eTtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UHJvcGVydHkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIGV4dGVuZCh0YXJnZXQsIGRhdGEpIHtcclxuICAgIGZvciAodmFyIGsgaW4gZGF0YSkge1xyXG4gICAgICAgIHRhcmdldFtrXSA9IGRhdGFba107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGFyZ2V0O1xyXG59XHJcbmV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO1xyXG5mdW5jdGlvbiBpbmRleChhcnIsIGluZGV4ZXIpIHtcclxuICAgIHZhciBvYmogPSB7fTtcclxuICAgIGZvciAodmFyIF9pID0gMCwgYXJyXzEgPSBhcnI7IF9pIDwgYXJyXzEubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgdmFyIHRtID0gYXJyXzFbX2ldO1xyXG4gICAgICAgIG9ialtpbmRleGVyKHRtKV0gPSB0bTtcclxuICAgIH1cclxuICAgIHJldHVybiBvYmo7XHJcbn1cclxuZXhwb3J0cy5pbmRleCA9IGluZGV4O1xyXG5mdW5jdGlvbiB2YWx1ZXMoaXgpIHtcclxuICAgIHZhciBhID0gW107XHJcbiAgICBmb3IgKHZhciBrIGluIGl4KSB7XHJcbiAgICAgICAgYS5wdXNoKGl4W2tdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBhO1xyXG59XHJcbmV4cG9ydHMudmFsdWVzID0gdmFsdWVzO1xyXG5mdW5jdGlvbiB6aXBQYWlycyhwYWlycykge1xyXG4gICAgdmFyIG9iaiA9IHt9O1xyXG4gICAgZm9yICh2YXIgX2kgPSAwLCBwYWlyc18xID0gcGFpcnM7IF9pIDwgcGFpcnNfMS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICB2YXIgcGFpciA9IHBhaXJzXzFbX2ldO1xyXG4gICAgICAgIG9ialtwYWlyWzBdXSA9IHBhaXJbMV07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gb2JqO1xyXG59XHJcbmV4cG9ydHMuemlwUGFpcnMgPSB6aXBQYWlycztcclxuZnVuY3Rpb24gdW56aXBQYWlycyhwYWlycykge1xyXG4gICAgdmFyIGFyciA9IFtdO1xyXG4gICAgZm9yICh2YXIga2V5IGluIHBhaXJzKSB7XHJcbiAgICAgICAgYXJyLnB1c2goW2tleSwgcGFpcnNba2V5XV0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGFycjtcclxufVxyXG5leHBvcnRzLnVuemlwUGFpcnMgPSB1bnppcFBhaXJzO1xyXG5mdW5jdGlvbiBtYXgoYXJyLCBzZWxlY3Rvcikge1xyXG4gICAgaWYgKGFyci5sZW5ndGggPT09IDApXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgdCA9IGFyclswXTtcclxuICAgIGZvciAodmFyIF9pID0gMCwgYXJyXzIgPSBhcnI7IF9pIDwgYXJyXzIubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgdmFyIHggPSBhcnJfMltfaV07XHJcbiAgICAgICAgaWYgKHNlbGVjdG9yKHQpIDwgc2VsZWN0b3IoeCkpIHtcclxuICAgICAgICAgICAgdCA9IHg7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHQ7XHJcbn1cclxuZXhwb3J0cy5tYXggPSBtYXg7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVV0aWwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciB1dGlsID0gcmVxdWlyZShcIi4uL21pc2MvVXRpbFwiKTtcclxudmFyIEdyaWRNb2RlbEluZGV4ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEdyaWRNb2RlbEluZGV4KG1vZGVsKSB7XHJcbiAgICAgICAgdGhpcy5yZWZzID0gdXRpbC5pbmRleChtb2RlbC5jZWxscywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgucmVmOyB9KTtcclxuICAgICAgICB0aGlzLmNvb3JkcyA9IHt9O1xyXG4gICAgICAgIGZvciAodmFyIF9pID0gMCwgX2EgPSBtb2RlbC5jZWxsczsgX2kgPCBfYS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFyIGMgPSBfYVtfaV07XHJcbiAgICAgICAgICAgIHZhciB4ID0gdGhpcy5jb29yZHNbYy5jb2xSZWZdIHx8ICh0aGlzLmNvb3Jkc1tjLmNvbFJlZl0gPSB7fSk7XHJcbiAgICAgICAgICAgIHhbYy5yb3dSZWZdID0gYztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBHcmlkTW9kZWxJbmRleC5wcm90b3R5cGUuZmluZENlbGwgPSBmdW5jdGlvbiAocmVmKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmVmc1tyZWZdIHx8IG51bGw7XHJcbiAgICB9O1xyXG4gICAgR3JpZE1vZGVsSW5kZXgucHJvdG90eXBlLmZpbmRDZWxsTmVpZ2hib3IgPSBmdW5jdGlvbiAocmVmLCB2ZWN0b3IpIHtcclxuICAgICAgICB2YXIgY2VsbCA9IHRoaXMuZmluZENlbGwocmVmKTtcclxuICAgICAgICB2YXIgY29sID0gY2VsbC5jb2xSZWYgKyB2ZWN0b3IueDtcclxuICAgICAgICB2YXIgcm93ID0gY2VsbC5yb3dSZWYgKyB2ZWN0b3IueTtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2NhdGVDZWxsKGNvbCwgcm93KTtcclxuICAgIH07XHJcbiAgICBHcmlkTW9kZWxJbmRleC5wcm90b3R5cGUubG9jYXRlQ2VsbCA9IGZ1bmN0aW9uIChjb2wsIHJvdykge1xyXG4gICAgICAgIHJldHVybiAodGhpcy5jb29yZHNbY29sXSB8fCB7fSlbcm93XSB8fCBudWxsO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBHcmlkTW9kZWxJbmRleDtcclxufSgpKTtcclxuZXhwb3J0cy5HcmlkTW9kZWxJbmRleCA9IEdyaWRNb2RlbEluZGV4O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1HcmlkTW9kZWxJbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIEdyaWRNb2RlbEluZGV4XzEgPSByZXF1aXJlKFwiLi9HcmlkTW9kZWxJbmRleFwiKTtcclxudmFyIFJhbmdlXzEgPSByZXF1aXJlKFwiLi9SYW5nZVwiKTtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1JlY3RcIik7XHJcbnZhciBRdWVyeSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBRdWVyeShtb2RlbCkge1xyXG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcclxuICAgIH1cclxuICAgIFF1ZXJ5Lm92ZXIgPSBmdW5jdGlvbiAobW9kZWwpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFF1ZXJ5KG1vZGVsKTtcclxuICAgIH07XHJcbiAgICBRdWVyeS5wcm90b3R5cGUudmVjdG9yID0gZnVuY3Rpb24gKGZyb20sIHRvLCB0b0luY2x1c2l2ZSkge1xyXG4gICAgICAgIGlmICh0b0luY2x1c2l2ZSA9PT0gdm9pZCAwKSB7IHRvSW5jbHVzaXZlID0gZmFsc2U7IH1cclxuICAgICAgICBpZiAodG9JbmNsdXNpdmUpIHtcclxuICAgICAgICAgICAgdG8gPSB0by5hZGQoMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBpbmRleCA9IG5ldyBHcmlkTW9kZWxJbmRleF8xLkdyaWRNb2RlbEluZGV4KHRoaXMubW9kZWwpO1xyXG4gICAgICAgIHZhciBkaW1zID0gUmVjdF8xLlJlY3QuZnJvbVBvaW50cyhmcm9tLCB0byk7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciByID0gZGltcy50b3A7IHIgPCBkaW1zLmJvdHRvbTsgcisrKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGMgPSBkaW1zLmxlZnQ7IGMgPCBkaW1zLnJpZ2h0OyBjKyspIHtcclxuICAgICAgICAgICAgICAgIHZhciBjZWxsID0gaW5kZXgubG9jYXRlQ2VsbChjLCByKTtcclxuICAgICAgICAgICAgICAgIGlmIChjZWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUmFuZ2VfMS5SYW5nZS5jcmVhdGUodGhpcy5tb2RlbCwgcmVzdWx0cyk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIFF1ZXJ5O1xyXG59KCkpO1xyXG5leHBvcnRzLlF1ZXJ5ID0gUXVlcnk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVF1ZXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgXyA9IHJlcXVpcmUoXCIuLi9taXNjL3V0aWxcIik7XHJcbnZhciBSYW5nZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBSYW5nZSh2YWx1ZXMpIHtcclxuICAgICAgICBfLmV4dGVuZCh0aGlzLCB2YWx1ZXMpO1xyXG4gICAgfVxyXG4gICAgUmFuZ2UuY3JlYXRlID0gZnVuY3Rpb24gKG1vZGVsLCBjZWxsUmVmcykge1xyXG4gICAgICAgIHZhciBsb29rdXAgPSBfLmluZGV4KGNlbGxSZWZzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XHJcbiAgICAgICAgdmFyIGNlbGxzID0gW107XHJcbiAgICAgICAgdmFyIGxjID0gTnVtYmVyLk1BWF9WQUxVRSwgbHIgPSBOdW1iZXIuTUFYX1ZBTFVFO1xyXG4gICAgICAgIHZhciBoYyA9IE51bWJlci5NSU5fVkFMVUUsIGhyID0gTnVtYmVyLk1JTl9WQUxVRTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9hID0gbW9kZWwuY2VsbHM7IF9pIDwgX2EubGVuZ3RoOyBfaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBjID0gX2FbX2ldO1xyXG4gICAgICAgICAgICBpZiAoIWxvb2t1cFtjLnJlZl0pXHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgY2VsbHMucHVzaChjKTtcclxuICAgICAgICAgICAgaWYgKGxjID4gYy5jb2xSZWYpXHJcbiAgICAgICAgICAgICAgICBsYyA9IGMuY29sUmVmO1xyXG4gICAgICAgICAgICBpZiAoaGMgPCBjLmNvbFJlZilcclxuICAgICAgICAgICAgICAgIGhjID0gYy5jb2xSZWY7XHJcbiAgICAgICAgICAgIGlmIChsciA+IGMucm93UmVmKVxyXG4gICAgICAgICAgICAgICAgbHIgPSBjLnJvd1JlZjtcclxuICAgICAgICAgICAgaWYgKGhyIDwgYy5yb3dSZWYpXHJcbiAgICAgICAgICAgICAgICBociA9IGMucm93UmVmO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbHRyID0gY2VsbHMuc29ydChsdHJfc29ydCk7XHJcbiAgICAgICAgdmFyIHR0YiA9IGNlbGxzLnNsaWNlKDApLnNvcnQodHRiX3NvcnQpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IGx0cixcclxuICAgICAgICAgICAgdHRiOiB0dGIsXHJcbiAgICAgICAgICAgIHdpZHRoOiBoYyAtIGxjLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IGhyIC0gbHIsXHJcbiAgICAgICAgICAgIGxlbmd0aDogKGhjIC0gbGMpICogKGhyIC0gbHIpLFxyXG4gICAgICAgICAgICBjb3VudDogY2VsbHMubGVuZ3RoLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIFJhbmdlLmVtcHR5ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2Uoe1xyXG4gICAgICAgICAgICBsdHI6IFtdLFxyXG4gICAgICAgICAgICB0dGI6IFtdLFxyXG4gICAgICAgICAgICB3aWR0aDogMCxcclxuICAgICAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICBsZW5ndGg6IDAsXHJcbiAgICAgICAgICAgIGNvdW50OiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBSYW5nZTtcclxufSgpKTtcclxuZXhwb3J0cy5SYW5nZSA9IFJhbmdlO1xyXG5mdW5jdGlvbiBsdHJfc29ydChhLCBiKSB7XHJcbiAgICB2YXIgbiA9IDA7XHJcbiAgICBuID0gYS5yb3dSZWYgLSBiLnJvd1JlZjtcclxuICAgIGlmIChuID09PSAwKSB7XHJcbiAgICAgICAgbiA9IGEuY29sUmVmIC0gYi5jb2xSZWY7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbjtcclxufVxyXG5mdW5jdGlvbiB0dGJfc29ydChhLCBiKSB7XHJcbiAgICB2YXIgbiA9IDA7XHJcbiAgICBuID0gYS5jb2xSZWYgLSBiLmNvbFJlZjtcclxuICAgIGlmIChuID09PSAwKSB7XHJcbiAgICAgICAgbiA9IGEucm93UmVmIC0gYi5yb3dSZWY7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbjtcclxufVxyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1SYW5nZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIHNob3J0aWQgPSByZXF1aXJlKFwic2hvcnRpZFwiKTtcclxudmFyIERlZmF1bHRDZWxsID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERlZmF1bHRDZWxsKGNvbFJlZiwgcm93UmVmLCByZWYsIHZhbHVlKSB7XHJcbiAgICAgICAgaWYgKHJlZiA9PT0gdm9pZCAwKSB7IHJlZiA9IG51bGw7IH1cclxuICAgICAgICBpZiAodmFsdWUgPT09IHZvaWQgMCkgeyB2YWx1ZSA9IG51bGw7IH1cclxuICAgICAgICB0aGlzLmNvbFNwYW4gPSAxO1xyXG4gICAgICAgIHRoaXMucm93U3BhbiA9IDE7XHJcbiAgICAgICAgdGhpcy52YWx1ZSA9ICcnO1xyXG4gICAgICAgIHRoaXMuY29sUmVmID0gY29sUmVmO1xyXG4gICAgICAgIHRoaXMucm93UmVmID0gcm93UmVmO1xyXG4gICAgICAgIHRoaXMucmVmID0gcmVmIHx8IHNob3J0aWQuZ2VuZXJhdGUoKTtcclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRGVmYXVsdENlbGw7XHJcbn0oKSk7XHJcbmV4cG9ydHMuRGVmYXVsdENlbGwgPSBEZWZhdWx0Q2VsbDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RGVmYXVsdENlbGwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEZWZhdWx0Q29sdW1uID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERlZmF1bHRDb2x1bW4ocmVmLCB3aWR0aCkge1xyXG4gICAgICAgIGlmICh3aWR0aCA9PT0gdm9pZCAwKSB7IHdpZHRoID0gMTAwOyB9XHJcbiAgICAgICAgdGhpcy5yZWYgPSByZWY7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIERlZmF1bHRDb2x1bW47XHJcbn0oKSk7XHJcbmV4cG9ydHMuRGVmYXVsdENvbHVtbiA9IERlZmF1bHRDb2x1bW47XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURlZmF1bHRDb2x1bW4uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEZWZhdWx0R3JpZCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBEZWZhdWx0R3JpZCgpIHtcclxuICAgICAgICB0aGlzLmNlbGxzID0gW107XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gW107XHJcbiAgICAgICAgdGhpcy5yb3dzID0gW107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gRGVmYXVsdEdyaWQ7XHJcbn0oKSk7XHJcbmV4cG9ydHMuRGVmYXVsdEdyaWQgPSBEZWZhdWx0R3JpZDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RGVmYXVsdEdyaWQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEZWZhdWx0Um93ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERlZmF1bHRSb3cocmVmLCBoZWlnaHQpIHtcclxuICAgICAgICBpZiAoaGVpZ2h0ID09PSB2b2lkIDApIHsgaGVpZ2h0ID0gMjE7IH1cclxuICAgICAgICB0aGlzLnJlZiA9IHJlZjtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgIH1cclxuICAgIHJldHVybiBEZWZhdWx0Um93O1xyXG59KCkpO1xyXG5leHBvcnRzLkRlZmF1bHRSb3cgPSBEZWZhdWx0Um93O1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1EZWZhdWx0Um93LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59O1xyXG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcclxufTtcclxudmFyIERlZmF1bHRDZWxsXzEgPSByZXF1aXJlKFwiLi4vZGVmYXVsdC9EZWZhdWx0Q2VsbFwiKTtcclxudmFyIFJlbmRlcmVyXzEgPSByZXF1aXJlKFwiLi4vLi4vdWkvUmVuZGVyZXJcIik7XHJcbnZhciBGbGV4Q2VsbCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoRmxleENlbGwsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBGbGV4Q2VsbCgpIHtcclxuICAgICAgICByZXR1cm4gX3N1cGVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgfHwgdGhpcztcclxuICAgIH1cclxuICAgIHJldHVybiBGbGV4Q2VsbDtcclxufShEZWZhdWx0Q2VsbF8xLkRlZmF1bHRDZWxsKSk7XHJcbkZsZXhDZWxsID0gX19kZWNvcmF0ZShbXHJcbiAgICBSZW5kZXJlcl8xLnJlbmRlcmVyKGRyYXcpLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjpwYXJhbXR5cGVzXCIsIFtdKVxyXG5dLCBGbGV4Q2VsbCk7XHJcbmV4cG9ydHMuRmxleENlbGwgPSBGbGV4Q2VsbDtcclxuZnVuY3Rpb24gZHJhdyhnZngsIHJlZ2lvbiwgY2VsbCkge1xyXG4gICAgZ2Z4LmZpbGxTdHlsZSA9ICd3aGl0ZSc7XHJcbiAgICBnZnguc3Ryb2tlU3R5bGUgPSAnbGlnaHRncmF5JztcclxuICAgIGdmeC5saW5lV2lkdGggPSAxO1xyXG4gICAgdmFyIGF2ID0gZ2Z4LmxpbmVXaWR0aCAlIDIgPT0gMCA/IDAgOiAwLjU7XHJcbiAgICBnZnguZmlsbFJlY3QoLWF2LCAtYXYsIHJlZ2lvbi53aWR0aCwgcmVnaW9uLmhlaWdodCk7XHJcbiAgICBnZnguc3Ryb2tlUmVjdCgtYXYsIC1hdiwgcmVnaW9uLndpZHRoLCByZWdpb24uaGVpZ2h0KTtcclxuICAgIGdmeC5maWxsU3R5bGUgPSAnYmxhY2snO1xyXG4gICAgZ2Z4LnRleHRCYXNlbGluZSA9ICdtaWRkbGUnO1xyXG4gICAgZ2Z4LmZvbnQgPSAnMTNweCBTZWdvZSBVSSc7XHJcbiAgICBnZnguZmlsbFRleHQoY2VsbC52YWx1ZSwgMywgMCArIChyZWdpb24uaGVpZ2h0IC8gMikpO1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZsZXhDZWxsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRGVmYXVsdEdyaWRfMSA9IHJlcXVpcmUoXCIuLi9kZWZhdWx0L0RlZmF1bHRHcmlkXCIpO1xyXG52YXIgRmxleENlbGxfMSA9IHJlcXVpcmUoXCIuL0ZsZXhDZWxsXCIpO1xyXG52YXIgRmxleEdyaWRCdWlsZGVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEZsZXhHcmlkQnVpbGRlcihjb2x1bW5zLCByb3dzKSB7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5zID0gY29sdW1ucztcclxuICAgICAgICB0aGlzLnJvd3MgPSByb3dzO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlSGVhZGVyID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNyZWF0ZU1hcmdpbiA9IHRydWU7XHJcbiAgICB9XHJcbiAgICBGbGV4R3JpZEJ1aWxkZXIucHJvdG90eXBlLmJ1aWxkID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnRmxleEdyaWRCdWlsZGVyLmJ1aWxkJyk7XHJcbiAgICAgICAgdmFyIGhvcmkgPSB0aGlzLmNvbHVtbnMgKyAodGhpcy5jcmVhdGVNYXJnaW4gPyAxIDogMCk7XHJcbiAgICAgICAgdmFyIHZlcnQgPSB0aGlzLnJvd3MgKyAodGhpcy5jcmVhdGVIZWFkZXIgPyAxIDogMCk7XHJcbiAgICAgICAgdmFyIGdyaWQgPSBuZXcgRGVmYXVsdEdyaWRfMS5EZWZhdWx0R3JpZCgpO1xyXG4gICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgaG9yaTsgYysrKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHIgPSAwOyByIDwgdmVydDsgcisrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMuY3JlYXRlSGVhZGVyIHx8IHRoaXMuY3JlYXRlTWFyZ2luKSAmJiAoYyArIHIpID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBncmlkLmNlbGxzLnB1c2gobmV3IEZsZXhDZWxsXzEuRmxleENlbGwoYywgciwgbnVsbCwgJ1gnKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNyZWF0ZUhlYWRlciAmJiByID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBncmlkLmNlbGxzLnB1c2gobmV3IEZsZXhDZWxsXzEuRmxleENlbGwoYywgciwgbnVsbCwgU3RyaW5nLmZyb21DaGFyQ29kZSg2NCArIGMpKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmNyZWF0ZU1hcmdpbiAmJiBjID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBncmlkLmNlbGxzLnB1c2gobmV3IEZsZXhDZWxsXzEuRmxleENlbGwoYywgciwgbnVsbCwgXCJcIiArIHIpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGdyaWQuY2VsbHMucHVzaChuZXcgRmxleENlbGxfMS5GbGV4Q2VsbChjLCByLCBudWxsLCBcIkNlbGwgXCIgKyBjICsgXCJ4XCIgKyByKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS50aW1lRW5kKCdGbGV4R3JpZEJ1aWxkZXIuYnVpbGQnKTtcclxuICAgICAgICByZXR1cm4gZ3JpZDtcclxuICAgIH07XHJcbiAgICByZXR1cm4gRmxleEdyaWRCdWlsZGVyO1xyXG59KCkpO1xyXG5leHBvcnRzLkZsZXhHcmlkQnVpbGRlciA9IEZsZXhHcmlkQnVpbGRlcjtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RmxleEdyaWRCdWlsZGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICogQSBkZWNvcmF0b3IgdGhhdCBtYXJrcyBhIG1ldGhvZCBhcyBhIF9jb21tYW5kXzsgYW4gZXh0ZXJuYWxseSBjYWxsYWJsZSBsb2dpYyBibG9jayB0aGF0IHBlcmZvcm1zIHNvbWUgdGFzay4gIEEgbmFtZVxyXG4gKiBmb3IgdGhlIGNvbW1hbmQgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZCBhcyB0aGUgY29tbWFuZCB3aWxsIGJlXHJcbiAqIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCBjb21tYW5kIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBjb21tYW5kKG5hbWUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoY3Rvciwga2V5LCBkZXNjcmlwdG9yKSB7XHJcbiAgICAgICAgdmFyIG1kayA9ICdncmlkOmNvbW1hbmRzJztcclxuICAgICAgICB2YXIgbGlzdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEobWRrLCBjdG9yKTtcclxuICAgICAgICBpZiAoIWxpc3QpIHtcclxuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShtZGssIChsaXN0ID0gW10pLCBjdG9yKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSB8fCBrZXksXHJcbiAgICAgICAgICAgIGtleToga2V5LFxyXG4gICAgICAgICAgICBpbXBsOiBkZXNjcmlwdG9yLnZhbHVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLmNvbW1hbmQgPSBjb21tYW5kO1xyXG47XHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgbWV0aG9kIGFzIGEgX3JvdXRpbmVfOyBhIGxvZ2ljIGJsb2NrIHRoYXQgY2FuIGJlIGhvb2tlZCBpbnRvIG9yIG92ZXJyaWRkZW4gYnkgb3RoZXJcclxuICogbW9kdWxlcy4gIEEgbmFtZSBmb3IgdGhlIHJvdXRpbmUgY2FuIGJlIG9wdGlvbmFsbHkgc3BlY2lmaWVkLCBvdGhlcndpc2UgdGhlIG5hbWUgb2YgdGhlIG1ldGhvZCBiZWluZyBleHBvcnRlZFxyXG4gKiBhcyB0aGUgcm91dGluZSB3aWxsIGJlIHVzZWQuXHJcbiAqIEBwYXJhbSBuYW1lIFRoZSBvcHRpb25hbCByb3V0aW5lIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiByb3V0aW5lKG5hbWUpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoY3Rvciwga2V5LCBkZXNjcmlwdG9yKSB7XHJcbiAgICAgICAgdmFyIHJvdXRpbmUgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG4gICAgICAgIHZhciB3cmFwcGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICB2YXIga2VybmVsID0gKHRoaXNbJ19fa2VybmVsJ10gfHwgdGhpc1sna2VybmVsJ10pO1xyXG4gICAgICAgICAgICByZXR1cm4ga2VybmVsLnJvdXRpbmVzLnNpZ25hbChrZXksIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMCksIHJvdXRpbmUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICByZXR1cm4geyB2YWx1ZTogd3JhcHBlciB9O1xyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLnJvdXRpbmUgPSByb3V0aW5lO1xyXG47XHJcbi8qKlxyXG4gKiBBIGRlY29yYXRvciB0aGF0IG1hcmtzIGEgZmllbGQgYXMgYSBfdmFyaWFibGVfOyBhIHJlYWRhYmxlIGFuZCBvcHRpb25hbGx5IHdyaXRhYmxlIHZhbHVlIHRoYXQgY2FuIGJlIGNvbnN1bWVkIGJ5XHJcbiAqIG1vZHVsZXMuICBBIG5hbWUgZm9yIHRoZSB2YXJpYWJsZSBjYW4gYmUgb3B0aW9uYWxseSBzcGVjaWZpZWQsIG90aGVyd2lzZSB0aGUgbmFtZSBvZiB0aGUgZmllbGQgYmVpbmcgZXhwb3J0ZWRcclxuICogYXMgdGhlIHZhcmlhYmxlIHdpbGwgYmUgdXNlZC5cclxuICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIHZhcmlhYmxlIG5hbWVcclxuICogQHJldHVybnMgZGVjb3JhdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiB2YXJpYWJsZShuYW1lLCBtdXRhYmxlKSB7XHJcbiAgICBpZiAobXV0YWJsZSA9PT0gdm9pZCAwKSB7IG11dGFibGUgPSB0cnVlOyB9XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGN0b3IsIGtleSkge1xyXG4gICAgICAgIHZhciBtZGsgPSAnZ3JpZDp2YXJpYWJsZXMnO1xyXG4gICAgICAgIHZhciBsaXN0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShtZGssIGN0b3IpO1xyXG4gICAgICAgIGlmICghbGlzdCkge1xyXG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKG1kaywgKGxpc3QgPSBbXSksIGN0b3IpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsaXN0LnB1c2goe1xyXG4gICAgICAgICAgICBuYW1lOiBuYW1lIHx8IGtleSxcclxuICAgICAgICAgICAga2V5OiBrZXksXHJcbiAgICAgICAgICAgIG11dGFibGU6IG11dGFibGUsXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy9sZXQgdmFsU3RvcmVLZXkgPSAhIW5hbWUgPyBrZXkgOiBgX18ke2tleX1gO1xyXG4gICAgICAgIC8vbGV0IHVzZUFsdFZhbHVlU3RvcmUgPSAhbmFtZTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vT2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IsIG5hbWUgfHwga2V5LCB7XHJcbiAgICAgICAgLy8gICAgY29uZmlndXJhYmxlOiBmYWxzZSxcclxuICAgICAgICAvLyAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIC8vICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzW3ZhbFN0b3JlS2V5XTsgfSxcclxuICAgICAgICAvLyAgICBzZXQ6IGZ1bmN0aW9uKG5ld1ZhbCkgeyB0aGlzW3ZhbFN0b3JlS2V5XSA9IG5ld1ZhbDsgfVxyXG4gICAgICAgIC8vfSk7XHJcbiAgICB9O1xyXG59XHJcbmV4cG9ydHMudmFyaWFibGUgPSB2YXJpYWJsZTtcclxuO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1FeHRlbnNpYmlsaXR5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgX19leHRlbmRzID0gKHRoaXMgJiYgdGhpcy5fX2V4dGVuZHMpIHx8IGZ1bmN0aW9uIChkLCBiKSB7XHJcbiAgICBmb3IgKHZhciBwIGluIGIpIGlmIChiLmhhc093blByb3BlcnR5KHApKSBkW3BdID0gYltwXTtcclxuICAgIGZ1bmN0aW9uIF9fKCkgeyB0aGlzLmNvbnN0cnVjdG9yID0gZDsgfVxyXG4gICAgZC5wcm90b3R5cGUgPSBiID09PSBudWxsID8gT2JqZWN0LmNyZWF0ZShiKSA6IChfXy5wcm90b3R5cGUgPSBiLnByb3RvdHlwZSwgbmV3IF9fKCkpO1xyXG59O1xyXG52YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XHJcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xyXG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcclxuICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XHJcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xyXG59O1xyXG52YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcclxuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcclxufTtcclxudmFyIEdyaWRLZXJuZWxfMSA9IHJlcXVpcmUoXCIuL0dyaWRLZXJuZWxcIik7XHJcbnZhciBEZWZhdWx0R3JpZF8xID0gcmVxdWlyZShcIi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0R3JpZFwiKTtcclxudmFyIEdyaWRNb2RlbEluZGV4XzEgPSByZXF1aXJlKFwiLi8uLi9tb2RlbC9HcmlkTW9kZWxJbmRleFwiKTtcclxudmFyIERlZmF1bHRDZWxsVmlzdWFsXzEgPSByZXF1aXJlKFwiLi9pbnRlcm5hbC9EZWZhdWx0Q2VsbFZpc3VhbFwiKTtcclxudmFyIEV2ZW50RW1pdHRlcl8xID0gcmVxdWlyZShcIi4vaW50ZXJuYWwvRXZlbnRFbWl0dGVyXCIpO1xyXG52YXIgR3JpZExheW91dF8xID0gcmVxdWlyZShcIi4vaW50ZXJuYWwvR3JpZExheW91dFwiKTtcclxudmFyIFByb3BlcnR5XzEgPSByZXF1aXJlKFwiLi4vbWlzYy9Qcm9wZXJ0eVwiKTtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1JlY3RcIik7XHJcbnZhciBQb2ludF8xID0gcmVxdWlyZShcIi4uL2dlb20vUG9pbnRcIik7XHJcbnZhciBHcmlkRWxlbWVudCA9IChmdW5jdGlvbiAoX3N1cGVyKSB7XHJcbiAgICBfX2V4dGVuZHMoR3JpZEVsZW1lbnQsIF9zdXBlcik7XHJcbiAgICBmdW5jdGlvbiBHcmlkRWxlbWVudChjYW52YXMpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSBfc3VwZXIuY2FsbCh0aGlzKSB8fCB0aGlzO1xyXG4gICAgICAgIF90aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgICAgICBfdGhpcy5kaXJ0eSA9IGZhbHNlO1xyXG4gICAgICAgIF90aGlzLmJ1ZmZlcnMgPSB7fTtcclxuICAgICAgICBfdGhpcy52aXN1YWxzID0ge307XHJcbiAgICAgICAgX3RoaXMucm9vdCA9IGNhbnZhcztcclxuICAgICAgICB2YXIga2VybmVsID0gX3RoaXMua2VybmVsID0gbmV3IEdyaWRLZXJuZWxfMS5HcmlkS2VybmVsKF90aGlzLmVtaXQuYmluZChfdGhpcykpO1xyXG4gICAgICAgIFsnbW91c2Vkb3duJywgJ21vdXNlbW92ZScsICdtb3VzZXVwJywgJ2NsaWNrJywgJ2RibGNsaWNrJywgJ2RyYWdiZWdpbicsICdkcmFnJywgJ2RyYWdlbmQnXVxyXG4gICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbiAoeCkgeyByZXR1cm4gX3RoaXMuZm9yd2FyZE1vdXNlRXZlbnQoeCk7IH0pO1xyXG4gICAgICAgIFsna2V5ZG93bicsICdrZXlwcmVzcycsICdrZXl1cCddXHJcbiAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uICh4KSB7IHJldHVybiBfdGhpcy5mb3J3YXJkS2V5RXZlbnQoeCk7IH0pO1xyXG4gICAgICAgIGtlcm5lbC52YXJpYWJsZXMuZGVmaW5lKCd3aWR0aCcsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy53aWR0aDsgfSB9KTtcclxuICAgICAgICBrZXJuZWwudmFyaWFibGVzLmRlZmluZSgnaGVpZ2h0JywgeyBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIF90aGlzLmhlaWdodDsgfSB9KTtcclxuICAgICAgICBrZXJuZWwudmFyaWFibGVzLmRlZmluZSgnbW9kZWxJbmRleCcsIHsgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5tb2RlbEluZGV4OyB9IH0pO1xyXG4gICAgICAgIHJldHVybiBfdGhpcztcclxuICAgIH1cclxuICAgIEdyaWRFbGVtZW50LmNyZWF0ZSA9IGZ1bmN0aW9uICh0YXJnZXQpIHtcclxuICAgICAgICB2YXIgY2FudmFzID0gdGFyZ2V0Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XHJcbiAgICAgICAgY2FudmFzLmlkID0gdGFyZ2V0LmlkO1xyXG4gICAgICAgIGNhbnZhcy5jbGFzc05hbWUgPSB0YXJnZXQuY2xhc3NOYW1lID0gJyBncmlkJztcclxuICAgICAgICBjYW52YXMudGFiSW5kZXggPSAwO1xyXG4gICAgICAgIGNhbnZhcy53aWR0aCA9IHRhcmdldC5jbGllbnRXaWR0aDtcclxuICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdGFyZ2V0LmNsaWVudEhlaWdodDtcclxuICAgICAgICB0YXJnZXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoY2FudmFzLCB0YXJnZXQpO1xyXG4gICAgICAgIHRhcmdldC5yZW1vdmUoKTtcclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRFbGVtZW50KGNhbnZhcyk7XHJcbiAgICB9O1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEdyaWRFbGVtZW50LnByb3RvdHlwZSwgXCJ3aWR0aFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50V2lkdGg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoR3JpZEVsZW1lbnQucHJvdG90eXBlLCBcImhlaWdodFwiLCB7XHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEdyaWRFbGVtZW50LnByb3RvdHlwZSwgXCJ2aXJ0dWFsV2lkdGhcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQud2lkdGg7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoR3JpZEVsZW1lbnQucHJvdG90eXBlLCBcInZpcnR1YWxIZWlnaHRcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXlvdXQuaGVpZ2h0O1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgIH0pO1xyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEdyaWRFbGVtZW50LnByb3RvdHlwZSwgXCJzY3JvbGxcIiwge1xyXG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50XzEuUG9pbnQodGhpcy5zY3JvbGxMZWZ0LCB0aGlzLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxyXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZXh0ZW5kID0gZnVuY3Rpb24gKGV4dCkge1xyXG4gICAgICAgIHRoaXMua2VybmVsLmluc3RhbGwoZXh0KTtcclxuICAgICAgICBpZiAoZXh0LmluaXQpIHtcclxuICAgICAgICAgICAgZXh0LmluaXQodGhpcywgdGhpcy5rZXJuZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZm9jdXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5yb290LmZvY3VzKCk7XHJcbiAgICB9O1xyXG4gICAgR3JpZEVsZW1lbnQucHJvdG90eXBlLnNjcm9sbFRvID0gZnVuY3Rpb24gKHB0T3JSZWN0KSB7XHJcbiAgICAgICAgdmFyIGRlc3QgPSBwdE9yUmVjdDtcclxuICAgICAgICBpZiAoZGVzdC53aWR0aCA9PT0gdW5kZWZpbmVkICYmIGRlc3QuaGVpZ2h0ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgZGVzdCA9IG5ldyBSZWN0XzEuUmVjdChkZXN0LngsIGRlc3QueSwgMSwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmxlZnQgPCAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsTGVmdCArPSBkZXN0LmxlZnQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnJpZ2h0ID4gdGhpcy53aWR0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbExlZnQgKz0gZGVzdC5yaWdodCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LnRvcCA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5zY3JvbGxUb3AgKz0gZGVzdC50b3A7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChkZXN0LmJvdHRvbSA+IHRoaXMuaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsVG9wICs9IGRlc3QuYm90dG9tIC0gdGhpcy5oZWlnaHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEdyaWRFbGVtZW50LnByb3RvdHlwZS5nZXRDZWxsQXRHcmlkUG9pbnQgPSBmdW5jdGlvbiAocHQpIHtcclxuICAgICAgICB2YXIgcmVmcyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyhuZXcgUmVjdF8xLlJlY3QocHQueCwgcHQueSwgMSwgMSkpO1xyXG4gICAgICAgIGlmIChyZWZzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tb2RlbEluZGV4LmZpbmRDZWxsKHJlZnNbMF0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZ2V0Q2VsbEF0Vmlld1BvaW50ID0gZnVuY3Rpb24gKHB0KSB7XHJcbiAgICAgICAgdmFyIHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICB2YXIgZ3B0ID0gUG9pbnRfMS5Qb2ludC5jcmVhdGUocHQpLmFkZCh2aWV3cG9ydC50b3BMZWZ0KCkpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdldENlbGxBdEdyaWRQb2ludChncHQpO1xyXG4gICAgfTtcclxuICAgIEdyaWRFbGVtZW50LnByb3RvdHlwZS5nZXRDZWxsc0luR3JpZFJlY3QgPSBmdW5jdGlvbiAocmVjdCkge1xyXG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICAgICAgdmFyIHJlZnMgPSB0aGlzLmxheW91dC5jYXB0dXJlQ2VsbHMocmVjdCk7XHJcbiAgICAgICAgcmV0dXJuIHJlZnMubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBfdGhpcy5tb2RlbEluZGV4LmZpbmRDZWxsKHgpOyB9KTtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZ2V0Q2VsbHNJblZpZXdSZWN0ID0gZnVuY3Rpb24gKHJlY3QpIHtcclxuICAgICAgICB2YXIgdmlld3BvcnQgPSB0aGlzLmNvbXB1dGVWaWV3cG9ydCgpO1xyXG4gICAgICAgIHZhciBncnQgPSBSZWN0XzEuUmVjdC5mcm9tTGlrZShyZWN0KS5vZmZzZXQodmlld3BvcnQudG9wTGVmdCgpKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRDZWxsc0luR3JpZFJlY3QoZ3J0KTtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZ2V0Q2VsbEdyaWRSZWN0ID0gZnVuY3Rpb24gKHJlZikge1xyXG4gICAgICAgIHZhciByZWdpb24gPSB0aGlzLmxheW91dC5xdWVyeUNlbGwocmVmKTtcclxuICAgICAgICByZXR1cm4gISFyZWdpb24gPyBSZWN0XzEuUmVjdC5mcm9tTGlrZShyZWdpb24pIDogbnVsbDtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZ2V0Q2VsbFZpZXdSZWN0ID0gZnVuY3Rpb24gKHJlZikge1xyXG4gICAgICAgIHZhciByZWN0ID0gdGhpcy5nZXRDZWxsR3JpZFJlY3QocmVmKTtcclxuICAgICAgICBpZiAocmVjdCkge1xyXG4gICAgICAgICAgICByZWN0ID0gcmVjdC5vZmZzZXQodGhpcy5zY3JvbGwuaW52ZXJzZSgpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlY3Q7XHJcbiAgICB9O1xyXG4gICAgR3JpZEVsZW1lbnQucHJvdG90eXBlLmludmFsaWRhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5idWZmZXJzID0ge307XHJcbiAgICAgICAgdGhpcy5tb2RlbEluZGV4ID0gbmV3IEdyaWRNb2RlbEluZGV4XzEuR3JpZE1vZGVsSW5kZXgodGhpcy5tb2RlbCk7XHJcbiAgICAgICAgdGhpcy5sYXlvdXQgPSBHcmlkTGF5b3V0XzEuR3JpZExheW91dC5jb21wdXRlKHRoaXMubW9kZWwpO1xyXG4gICAgICAgIHRoaXMucmVkcmF3KCk7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdpbnZhbGlkYXRlJyk7XHJcbiAgICB9O1xyXG4gICAgR3JpZEVsZW1lbnQucHJvdG90eXBlLnJlZHJhdyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZGlydHkpIHtcclxuICAgICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmRyYXcuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEdyaWRFbGVtZW50LnByb3RvdHlwZS5kcmF3ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudXBkYXRlVmlzdWFscygpO1xyXG4gICAgICAgIHRoaXMuZHJhd1Zpc3VhbHMoKTtcclxuICAgICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5lbWl0KCdkcmF3Jyk7XHJcbiAgICB9O1xyXG4gICAgR3JpZEVsZW1lbnQucHJvdG90eXBlLmNvbXB1dGVWaWV3cG9ydCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFJlY3RfMS5SZWN0KE1hdGguZmxvb3IodGhpcy5zY3JvbGxMZWZ0KSwgTWF0aC5mbG9vcih0aGlzLnNjcm9sbFRvcCksIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgfTtcclxuICAgIEdyaWRFbGVtZW50LnByb3RvdHlwZS51cGRhdGVWaXN1YWxzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGNvbnNvbGUudGltZSgnR3JpZEVsZW1lbnQudXBkYXRlVmlzdWFscycpO1xyXG4gICAgICAgIHZhciB2aWV3cG9ydCA9IHRoaXMuY29tcHV0ZVZpZXdwb3J0KCk7XHJcbiAgICAgICAgdmFyIHZpc2libGVDZWxscyA9IHRoaXMubGF5b3V0LmNhcHR1cmVDZWxscyh2aWV3cG9ydCk7XHJcbiAgICAgICAgdmFyIHZpc3VhbHMgPSB7fTtcclxuICAgICAgICB2YXIgYXBwbHkgPSBmdW5jdGlvbiAodmlzdWFsLCByZWdpb24pIHtcclxuICAgICAgICAgICAgdmlzdWFsLmxlZnQgPSByZWdpb24ubGVmdDtcclxuICAgICAgICAgICAgdmlzdWFsLnRvcCA9IHJlZ2lvbi50b3A7XHJcbiAgICAgICAgICAgIHZpc3VhbC53aWR0aCA9IHJlZ2lvbi53aWR0aDtcclxuICAgICAgICAgICAgdmlzdWFsLmhlaWdodCA9IHJlZ2lvbi5oZWlnaHQ7XHJcbiAgICAgICAgICAgIHJldHVybiB2aXN1YWw7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIHZpc2libGVDZWxsc18xID0gdmlzaWJsZUNlbGxzOyBfaSA8IHZpc2libGVDZWxsc18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICB2YXIgdmNyID0gdmlzaWJsZUNlbGxzXzFbX2ldO1xyXG4gICAgICAgICAgICB2YXIgcmVnaW9uID0gdGhpcy5sYXlvdXQucXVlcnlDZWxsKHZjcik7XHJcbiAgICAgICAgICAgIC8vSWYgdmlzdWFsIGFscmVhZHkgZXhpc3RzLCB1cGRhdGUgYW5kIGFkZCBleGlzdGluZ1xyXG4gICAgICAgICAgICBpZiAodGhpcy52aXN1YWxzW3Zjcl0pIHtcclxuICAgICAgICAgICAgICAgIHZpc3VhbHNbdmNyXSA9IGFwcGx5KHRoaXMudmlzdWFsc1t2Y3JdLCByZWdpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdmlzdWFsc1t2Y3JdID0gYXBwbHkodGhpcy5jcmVhdGVWaXN1YWwoKSwgcmVnaW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLnRpbWVFbmQoJ0dyaWRFbGVtZW50LnVwZGF0ZVZpc3VhbHMnKTtcclxuICAgICAgICB0aGlzLnZpc3VhbHMgPSB2aXN1YWxzO1xyXG4gICAgfTtcclxuICAgIEdyaWRFbGVtZW50LnByb3RvdHlwZS5kcmF3VmlzdWFscyA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBjb25zb2xlLnRpbWUoJ0dyaWRFbGVtZW50LmRyYXdWaXN1YWxzJyk7XHJcbiAgICAgICAgdmFyIHZpZXdwb3J0ID0gdGhpcy5jb21wdXRlVmlld3BvcnQoKTtcclxuICAgICAgICB2YXIgZ2Z4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnLCB7IGFscGhhOiB0cnVlIH0pO1xyXG4gICAgICAgIGdmeC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgZ2Z4LnNhdmUoKTtcclxuICAgICAgICBnZngudHJhbnNsYXRlKHZpZXdwb3J0LmxlZnQgKiAtMSwgdmlld3BvcnQudG9wICogLTEpO1xyXG4gICAgICAgIGZvciAodmFyIGNyIGluIHRoaXMudmlzdWFscykge1xyXG4gICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMubW9kZWxJbmRleC5maW5kQ2VsbChjcik7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWwgPSB0aGlzLnZpc3VhbHNbY3JdO1xyXG4gICAgICAgICAgICBpZiAoIXZpZXdwb3J0LmludGVyc2VjdHModmlzdWFsKSkge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tjZWxsLnJlZl07XHJcbiAgICAgICAgICAgIGlmICghYnVmZmVyKSB7XHJcbiAgICAgICAgICAgICAgICBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbY2VsbC5yZWZdID0gdGhpcy5jcmVhdGVCdWZmZXIodmlzdWFsLndpZHRoLCB2aXN1YWwuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICAgICAgICAgIHZhciByZW5kZXJlciA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2N1c3RvbTpyZW5kZXJlcicsIGNlbGwuY29uc3RydWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgcmVuZGVyZXIoYnVmZmVyLmdmeCwgdmlzdWFsLCBjZWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBnZnguZHJhd0ltYWdlKGJ1ZmZlci5jYW52YXMsIHZpc3VhbC5sZWZ0IC0gYnVmZmVyLmluZmxhdGlvbiwgdmlzdWFsLnRvcCAtIGJ1ZmZlci5pbmZsYXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnZngucmVzdG9yZSgpO1xyXG4gICAgICAgIGNvbnNvbGUudGltZUVuZCgnR3JpZEVsZW1lbnQuZHJhd1Zpc3VhbHMnKTtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuY3JlYXRlQnVmZmVyID0gZnVuY3Rpb24gKHdpZHRoLCBoZWlnaHQpIHtcclxuICAgICAgICByZXR1cm4gbmV3IEJ1ZmZlcih3aWR0aCwgaGVpZ2h0LCAyNSk7XHJcbiAgICB9O1xyXG4gICAgR3JpZEVsZW1lbnQucHJvdG90eXBlLmNyZWF0ZVZpc3VhbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IERlZmF1bHRDZWxsVmlzdWFsXzEuRGVmYXVsdENlbGxWaXN1YWwoKTtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZm9yd2FyZE1vdXNlRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGZ1bmN0aW9uIChuZSkge1xyXG4gICAgICAgICAgICB2YXIgcHQgPSBuZXcgUG9pbnRfMS5Qb2ludChuZS5vZmZzZXRYLCBuZS5vZmZzZXRZKTtcclxuICAgICAgICAgICAgdmFyIGNlbGwgPSBfdGhpcy5nZXRDZWxsQXRWaWV3UG9pbnQocHQpO1xyXG4gICAgICAgICAgICB2YXIgZ2UgPSBuZTtcclxuICAgICAgICAgICAgZ2UuY2VsbCA9IGNlbGwgfHwgbnVsbDtcclxuICAgICAgICAgICAgZ2UuZ3JpZFggPSBwdC54O1xyXG4gICAgICAgICAgICBnZS5ncmlkWSA9IHB0Lnk7XHJcbiAgICAgICAgICAgIF90aGlzLmVtaXQoZXZlbnQsIGdlKTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbiAgICBHcmlkRWxlbWVudC5wcm90b3R5cGUuZm9yd2FyZEtleUV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBmdW5jdGlvbiAobmUpIHtcclxuICAgICAgICAgICAgX3RoaXMuZW1pdChldmVudCwgbmUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBHcmlkRWxlbWVudDtcclxufShFdmVudEVtaXR0ZXJfMS5FdmVudEVtaXR0ZXJCYXNlKSk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgUHJvcGVydHlfMS5wcm9wZXJ0eShuZXcgRGVmYXVsdEdyaWRfMS5EZWZhdWx0R3JpZCgpLCBmdW5jdGlvbiAodCkgeyByZXR1cm4gdC5pbnZhbGlkYXRlKCk7IH0pLFxyXG4gICAgX19tZXRhZGF0YShcImRlc2lnbjp0eXBlXCIsIE9iamVjdClcclxuXSwgR3JpZEVsZW1lbnQucHJvdG90eXBlLCBcIm1vZGVsXCIsIHZvaWQgMCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgUHJvcGVydHlfMS5wcm9wZXJ0eSgwLCBmdW5jdGlvbiAodCkgeyB0LnJlZHJhdygpOyB0LmVtaXQoJ3Njcm9sbCcpOyB9KSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBOdW1iZXIpXHJcbl0sIEdyaWRFbGVtZW50LnByb3RvdHlwZSwgXCJzY3JvbGxMZWZ0XCIsIHZvaWQgMCk7XHJcbl9fZGVjb3JhdGUoW1xyXG4gICAgUHJvcGVydHlfMS5wcm9wZXJ0eSgwLCBmdW5jdGlvbiAodCkgeyB0LnJlZHJhdygpOyB0LmVtaXQoJ3Njcm9sbCcpOyB9KSxcclxuICAgIF9fbWV0YWRhdGEoXCJkZXNpZ246dHlwZVwiLCBOdW1iZXIpXHJcbl0sIEdyaWRFbGVtZW50LnByb3RvdHlwZSwgXCJzY3JvbGxUb3BcIiwgdm9pZCAwKTtcclxuZXhwb3J0cy5HcmlkRWxlbWVudCA9IEdyaWRFbGVtZW50O1xyXG52YXIgQnVmZmVyID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEJ1ZmZlcih3aWR0aCwgaGVpZ2h0LCBpbmZsYXRpb24pIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgdGhpcy5pbmZsYXRpb24gPSBpbmZsYXRpb247XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoICsgKGluZmxhdGlvbiAqIDIpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodCArIChpbmZsYXRpb24gKiAyKTtcclxuICAgICAgICB0aGlzLmdmeCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAgICAgdGhpcy5nZngudHJhbnNsYXRlKGluZmxhdGlvbiwgaW5mbGF0aW9uKTtcclxuICAgIH1cclxuICAgIHJldHVybiBCdWZmZXI7XHJcbn0oKSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUdyaWRFbGVtZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG4vKipcclxuICogSW1wbGVtZW50cyB0aGUgY29yZSBvZiB0aGUgR3JpZCBleHRlbnNpYmlsaXR5IHN5c3RlbS5cclxuICovXHJcbnZhciBHcmlkS2VybmVsID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIEdyaWRLZXJuZWwoZW1pdHRlcikge1xyXG4gICAgICAgIHRoaXMuZW1pdHRlciA9IGVtaXR0ZXI7XHJcbiAgICAgICAgdGhpcy5jb21tYW5kcyA9IG5ldyBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwoKTtcclxuICAgICAgICB0aGlzLnJvdXRpbmVzID0gbmV3IEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbCgpO1xyXG4gICAgICAgIHRoaXMudmFyaWFibGVzID0gbmV3IEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwoKTtcclxuICAgIH1cclxuICAgIEdyaWRLZXJuZWwucHJvdG90eXBlLmluc3RhbGwgPSBmdW5jdGlvbiAoZXh0KSB7XHJcbiAgICAgICAgdmFyIF9hID0gdGhpcywgY29tbWFuZHMgPSBfYS5jb21tYW5kcywgdmFyaWFibGVzID0gX2EudmFyaWFibGVzO1xyXG4gICAgICAgIGlmIChleHRbJ19fa2VybmVsJ10pIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0V4dGVuc2lvbiBhcHBlYXJzIHRvIGhhdmUgYWxyZWFkeSBiZWVuIGluc3RhbGxlZCBpbnRvIHRoaXMgb3IgYW5vdGhlciBncmlkLi4uPyc7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGV4dFsnX19rZXJuZWwnXSA9IHRoaXM7XHJcbiAgICAgICAgdmFyIGNtZHMgPSBSZWZsZWN0LmdldE1ldGFkYXRhKCdncmlkOmNvbW1hbmRzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIGNtZHNfMSA9IGNtZHM7IF9pIDwgY21kc18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IGNtZHNfMVtfaV07XHJcbiAgICAgICAgICAgIGNvbW1hbmRzLmRlZmluZShjLm5hbWUsIGMuaW1wbC5iaW5kKGV4dCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdmFycyA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoJ2dyaWQ6dmFyaWFibGVzJywgZXh0KSB8fCBbXTtcclxuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uICh2KSB7XHJcbiAgICAgICAgICAgIHZhcmlhYmxlcy5kZWZpbmUodi5uYW1lLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IChmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzW3Yua2V5XTsgfSkuYmluZChleHQpLFxyXG4gICAgICAgICAgICAgICAgc2V0OiAhIXYubXV0YWJsZSA/IChmdW5jdGlvbiAodmFsKSB7IHRoaXNbdi5rZXldID0gdmFsOyB9KS5iaW5kKGV4dCkgOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgZm9yICh2YXIgX2IgPSAwLCB2YXJzXzEgPSB2YXJzOyBfYiA8IHZhcnNfMS5sZW5ndGg7IF9iKyspIHtcclxuICAgICAgICAgICAgdmFyIHYgPSB2YXJzXzFbX2JdO1xyXG4gICAgICAgICAgICBfbG9vcF8xKHYpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gR3JpZEtlcm5lbDtcclxufSgpKTtcclxuZXhwb3J0cy5HcmlkS2VybmVsID0gR3JpZEtlcm5lbDtcclxudmFyIEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwoKSB7XHJcbiAgICAgICAgdGhpcy5zdG9yZSA9IHt9O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZpbmVzIHRoZSBzcGVjaWZpZWQgY29tbWFuZCBmb3IgZXh0ZW5zaW9ucyBvciBjb25zdW1lcnMgdG8gdXNlLlxyXG4gICAgICovXHJcbiAgICBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGwucHJvdG90eXBlLmRlZmluZSA9IGZ1bmN0aW9uIChjb21tYW5kLCBpbXBsKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RvcmVbY29tbWFuZF0pIHtcclxuICAgICAgICAgICAgdGhyb3cgJ0NvbW1hbmQgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVbY29tbWFuZF0gPSBpbXBsO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICogRXhlY3V0ZXMgdGhlIHNwZWNpZmllZCBncmlkIGNvbW1hbmQuXHJcbiAgICAgKi9cclxuICAgIEdyaWRLZXJuZWxDb21tYW5kSHViSW1wbC5wcm90b3R5cGUuZXhlYyA9IGZ1bmN0aW9uIChjb21tYW5kKSB7XHJcbiAgICAgICAgdmFyIGFyZ3MgPSBbXTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICBhcmdzW19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaW1wbCA9IHRoaXMuc3RvcmVbY29tbWFuZF07XHJcbiAgICAgICAgaWYgKGltcGwpIHtcclxuICAgICAgICAgICAgaW1wbC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgY29tbWFuZDogJyArIGNvbW1hbmQ7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIHJldHVybiBHcmlkS2VybmVsQ29tbWFuZEh1YkltcGw7XHJcbn0oKSk7XHJcbnZhciBHcmlkS2VybmVsUm91dGluZUh1YkltcGwgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsKCkge1xyXG4gICAgICAgIHRoaXMuaG9va3MgPSB7fTtcclxuICAgICAgICB0aGlzLm92ZXJyaWRlcyA9IHt9O1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRzIGEgaG9vayB0byB0aGUgc3BlY2lmaWVkIHNpZ25hbCB0aGF0IGVuYWJsZXMgZXh0ZW5zaW9ucyB0byBvdmVycmlkZSBncmlkIGJlaGF2aW9yXHJcbiAgICAgKiBkZWZpbmVkIGluIHRoZSBjb3JlIG9yIG90aGVyIGV4dGVuc2lvbnMuXHJcbiAgICAgKi9cclxuICAgIEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbC5wcm90b3R5cGUuaG9vayA9IGZ1bmN0aW9uIChyb3V0aW5lLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXSB8fCAodGhpcy5ob29rc1tyb3V0aW5lXSA9IFtdKTtcclxuICAgICAgICBsaXN0LnB1c2goY2FsbGJhY2spO1xyXG4gICAgfTtcclxuICAgIEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbC5wcm90b3R5cGUub3ZlcnJpZGUgPSBmdW5jdGlvbiAocm91dGluZSwgY2FsbGJhY2spIHtcclxuICAgICAgICB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSA9IGNhbGxiYWNrO1xyXG4gICAgfTtcclxuICAgIC8qKlxyXG4gICAgICogU2lnbmFscyB0aGF0IGEgcm91dGluZSBpcyBhYm91dCB0byBydW4gdGhhdCBjYW4gYmUgaG9va2VkIG9yIG92ZXJyaWRkZW4gYnkgZXh0ZW5zaW9ucy4gIEFyZ3VtZW50c1xyXG4gICAgICogc2hvdWxkIGJlIHN1cHBvcnRpbmcgZGF0YSBvciByZWxldmFudCBvYmplY3RzIHRvIHRoZSByb3V0aW5lLiAgVGhlIHZhbHVlIHJldHVybmVkIHdpbGwgYmUgYHRydWVgXHJcbiAgICAgKiBpZiB0aGUgcm91dGluZSBoYXMgYmVlbiBvdmVycmlkZGVuIGJ5IGFuIGV4dGVuc2lvbi5cclxuICAgICAqL1xyXG4gICAgR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsLnByb3RvdHlwZS5zaWduYWwgPSBmdW5jdGlvbiAocm91dGluZSwgYXJncywgaW1wbCkge1xyXG4gICAgICAgIHRoaXMuaW52b2tlSG9va3MoXCJiZWZvcmU6XCIgKyByb3V0aW5lLCBhcmdzKTtcclxuICAgICAgICBpZiAoISF0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXSkge1xyXG4gICAgICAgICAgICBhcmdzLnB1c2goaW1wbCk7XHJcbiAgICAgICAgICAgIGltcGwgPSB0aGlzLm92ZXJyaWRlc1tyb3V0aW5lXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9IGltcGwuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgdGhpcy5pbnZva2VIb29rcyhyb3V0aW5lLCBhcmdzKTtcclxuICAgICAgICB0aGlzLmludm9rZUhvb2tzKFwiYWZ0ZXI6XCIgKyByb3V0aW5lLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfTtcclxuICAgIEdyaWRLZXJuZWxSb3V0aW5lSHViSW1wbC5wcm90b3R5cGUuaW52b2tlSG9va3MgPSBmdW5jdGlvbiAocm91dGluZSwgYXJncykge1xyXG4gICAgICAgIHZhciBsaXN0ID0gdGhpcy5ob29rc1tyb3V0aW5lXTtcclxuICAgICAgICBpZiAobGlzdCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIGxpc3RfMSA9IGxpc3Q7IF9pIDwgbGlzdF8xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICAgICAgdmFyIGhvb2sgPSBsaXN0XzFbX2ldO1xyXG4gICAgICAgICAgICAgICAgaG9vay5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICByZXR1cm4gR3JpZEtlcm5lbFJvdXRpbmVIdWJJbXBsO1xyXG59KCkpO1xyXG52YXIgR3JpZEtlcm5lbFZhcmlhYmxlSHViSW1wbCA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsKCkge1xyXG4gICAgICAgIHRoaXMuc3RvcmUgPSB7fTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogRGVmaW5lcyB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlIGZvciBleHRlbnNpb25zIG9yIGNvbnN1bWVycyB0byB1c2UuXHJcbiAgICAgKi9cclxuICAgIEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGwucHJvdG90eXBlLmRlZmluZSA9IGZ1bmN0aW9uICh2YXJpYWJsZSwgaW1wbCkge1xyXG4gICAgICAgIGlmICh0aGlzLnN0b3JlW3ZhcmlhYmxlXSkge1xyXG4gICAgICAgICAgICB0aHJvdyAnVmFyaWFibGUgd2l0aCBuYW1lIGFscmVhZHkgcmVnaXN0ZXJlZDogJyArIHZhcmlhYmxlO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0b3JlW3ZhcmlhYmxlXSA9IGltcGw7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBHZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAodmFyaWFibGUpIHtcclxuICAgICAgICB2YXIgaW1wbCA9IHRoaXMuc3RvcmVbdmFyaWFibGVdO1xyXG4gICAgICAgIGlmIChpbXBsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBpbXBsLmdldCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aHJvdyAnVW5yZWNvZ25pemVkIHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIHRoZSB2YWx1ZSBvZiB0aGUgc3BlY2lmaWVkIHZhcmlhYmxlLlxyXG4gICAgICovXHJcbiAgICBHcmlkS2VybmVsVmFyaWFibGVIdWJJbXBsLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAodmFyaWFibGUsIHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIGltcGwgPSB0aGlzLnN0b3JlW3ZhcmlhYmxlXTtcclxuICAgICAgICBpZiAoaW1wbCkge1xyXG4gICAgICAgICAgICBpZiAoaW1wbC5zZXQpIHtcclxuICAgICAgICAgICAgICAgIGltcGwuc2V0KHZhbHVlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRocm93ICdDYW5ub3Qgc2V0IHJlYWRvbmx5IHZhcmlhYmxlOiAnICsgdmFyaWFibGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93ICdVbnJlY29nbml6ZWQgdmFyaWFibGU6ICcgKyB2YXJpYWJsZTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEdyaWRLZXJuZWxWYXJpYWJsZUh1YkltcGw7XHJcbn0oKSk7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUdyaWRLZXJuZWwuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbmZ1bmN0aW9uIHJlbmRlcmVyKGZ1bmMpIHtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoY3Rvcikge1xyXG4gICAgICAgIC8vbm9pbnNwZWN0aW9uIFR5cGVTY3JpcHRVbnJlc29sdmVkRnVuY3Rpb25cclxuICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKCdjdXN0b206cmVuZGVyZXInLCBmdW5jLCBjdG9yKTtcclxuICAgIH07XHJcbn1cclxuZXhwb3J0cy5yZW5kZXJlciA9IHJlbmRlcmVyO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZW5kZXJlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi9nZW9tL1JlY3RcIik7XHJcbnZhciBEb20gPSByZXF1aXJlKFwiLi4vbWlzYy9Eb21cIik7XHJcbi8qKlxyXG4gKiBQcm92aWRlcyBhbiBhYnN0cmFjdCBiYXNlIGNsYXNzIGZvciBXaWRnZXQgaW1wbGVtZW50YXRpb25zIHRoYXQgYXJlIGV4cGVjdGVkIHRvIHJlcHJlc2VudCBXaWRnZXRzIHdpdGhcclxuICogYWJzb2x1dGVseSBwb3NpdGlvbmVkIHJvb3QgZWxlbWVudHMuXHJcbiAqL1xyXG52YXIgQWJzV2lkZ2V0QmFzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBBYnNXaWRnZXRCYXNlKHJvb3QpIHtcclxuICAgICAgICB0aGlzLnJvb3QgPSByb290O1xyXG4gICAgfVxyXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEFic1dpZGdldEJhc2UucHJvdG90eXBlLCBcInZpZXdSZWN0XCIsIHtcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBHZXRzIGEgUmVjdCBvYmplY3QgdGhhdCBkZXNjcmliZXMgdGhlIGRpbWVuc2lvbnMgb2YgdGhlIFdpZGdldCByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgb2YgdGhlIGdyaWQuXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUmVjdF8xLlJlY3QocGFyc2VJbnQodGhpcy5yb290LnN0eWxlLmxlZnQpLCBwYXJzZUludCh0aGlzLnJvb3Quc3R5bGUudG9wKSwgdGhpcy5yb290LmNsaWVudFdpZHRoLCB0aGlzLnJvb3QuY2xpZW50SGVpZ2h0KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIC8qKlxyXG4gICAgICogTW92ZXMgdGhlIFdpZGdldCB0byB0aGUgc3BlY2lmaWVkIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSB2aWV3cG9ydCBvZiB0aGUgZ3JpZC5cclxuICAgICAqXHJcbiAgICAgKiBAcGFyYW0gdmlld1JlY3RcclxuICAgICAqIEBwYXJhbSBhbmltYXRlXHJcbiAgICAgKi9cclxuICAgIEFic1dpZGdldEJhc2UucHJvdG90eXBlLmdvdG8gPSBmdW5jdGlvbiAodmlld1JlY3QsIGF1dG9TaG93KSB7XHJcbiAgICAgICAgaWYgKGF1dG9TaG93ID09PSB2b2lkIDApIHsgYXV0b1Nob3cgPSB0cnVlOyB9XHJcbiAgICAgICAgaWYgKGF1dG9TaG93KSB7XHJcbiAgICAgICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERvbS5jc3ModGhpcy5yb290LCB7XHJcbiAgICAgICAgICAgIGxlZnQ6IHZpZXdSZWN0LmxlZnQgLSAxICsgXCJweFwiLFxyXG4gICAgICAgICAgICB0b3A6IHZpZXdSZWN0LnRvcCAtIDEgKyBcInB4XCIsXHJcbiAgICAgICAgICAgIHdpZHRoOiB2aWV3UmVjdC53aWR0aCArIDEgKyBcInB4XCIsXHJcbiAgICAgICAgICAgIGhlaWdodDogdmlld1JlY3QuaGVpZ2h0ICsgMSArIFwicHhcIixcclxuICAgICAgICAgICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBIaWRlcyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBBYnNXaWRnZXRCYXNlLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIERvbS5oaWRlKHRoaXMucm9vdCk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBTaG93cyB0aGUgd2hvbGUgd2lkZ2V0LlxyXG4gICAgICovXHJcbiAgICBBYnNXaWRnZXRCYXNlLnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIERvbS5zaG93KHRoaXMucm9vdCk7XHJcbiAgICB9O1xyXG4gICAgLyoqXHJcbiAgICAgKiBUb2dnbGVzIHRoZSB2aXNpYmlsaXR5IG9mIHRoZSB3aG9sZSB3aWRnZXQuXHJcbiAgICAgKlxyXG4gICAgICogQHBhcmFtIHZpc2libGVcclxuICAgICAqL1xyXG4gICAgQWJzV2lkZ2V0QmFzZS5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24gKHZpc2libGUpIHtcclxuICAgICAgICBEb20udG9nZ2xlKHRoaXMucm9vdCwgdmlzaWJsZSk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEFic1dpZGdldEJhc2U7XHJcbn0oKSk7XHJcbmV4cG9ydHMuQWJzV2lkZ2V0QmFzZSA9IEFic1dpZGdldEJhc2U7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVdpZGdldC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcclxudmFyIERlZmF1bHRDZWxsVmlzdWFsID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIGZ1bmN0aW9uIERlZmF1bHRDZWxsVmlzdWFsKGxlZnQsIHRvcCwgd2lkdGgsIGhlaWdodCkge1xyXG4gICAgICAgIGlmIChsZWZ0ID09PSB2b2lkIDApIHsgbGVmdCA9IDA7IH1cclxuICAgICAgICBpZiAodG9wID09PSB2b2lkIDApIHsgdG9wID0gMDsgfVxyXG4gICAgICAgIGlmICh3aWR0aCA9PT0gdm9pZCAwKSB7IHdpZHRoID0gMDsgfVxyXG4gICAgICAgIGlmIChoZWlnaHQgPT09IHZvaWQgMCkgeyBoZWlnaHQgPSAwOyB9XHJcbiAgICAgICAgdGhpcy5sZWZ0ID0gbGVmdDtcclxuICAgICAgICB0aGlzLnRvcCA9IHRvcDtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB9XHJcbiAgICBEZWZhdWx0Q2VsbFZpc3VhbC5wcm90b3R5cGUuZHJhdyA9IGZ1bmN0aW9uIChnZngsIG1vZGVsKSB7XHJcbiAgICAgICAgZ2Z4LnN0cm9rZVN0eWxlID0gJ2JsYWNrJztcclxuICAgICAgICBnZnguc3Ryb2tlUmVjdCh0aGlzLmxlZnQsIHRoaXMudG9wLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIERlZmF1bHRDZWxsVmlzdWFsO1xyXG59KCkpO1xyXG5leHBvcnRzLkRlZmF1bHRDZWxsVmlzdWFsID0gRGVmYXVsdENlbGxWaXN1YWw7XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURlZmF1bHRDZWxsVmlzdWFsLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xyXG52YXIgRXZlbnRFbWl0dGVyQmFzZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICBmdW5jdGlvbiBFdmVudEVtaXR0ZXJCYXNlKCkge1xyXG4gICAgICAgIHRoaXMuYnVja2V0cyA9IHt9O1xyXG4gICAgfVxyXG4gICAgRXZlbnRFbWl0dGVyQmFzZS5wcm90b3R5cGUub24gPSBmdW5jdGlvbiAoZXZlbnQsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICAgICB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCkucHVzaChjYWxsYmFjayk7XHJcbiAgICAgICAgcmV0dXJuIHsgY2FuY2VsOiBmdW5jdGlvbiAoKSB7IHJldHVybiBfdGhpcy5vZmYoZXZlbnQsIGNhbGxiYWNrKTsgfSB9O1xyXG4gICAgfTtcclxuICAgIEV2ZW50RW1pdHRlckJhc2UucHJvdG90eXBlLm9mZiA9IGZ1bmN0aW9uIChldmVudCwgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgbGlzdCA9IHRoaXMuZ2V0Q2FsbGJhY2tMaXN0KGV2ZW50KTtcclxuICAgICAgICB2YXIgaWR4ID0gbGlzdC5pbmRleE9mKGNhbGxiYWNrKTtcclxuICAgICAgICBpZiAoaWR4ID49IDApIHtcclxuICAgICAgICAgICAgbGlzdC5zcGxpY2UoaWR4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgRXZlbnRFbWl0dGVyQmFzZS5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHZhciBhcmdzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgYXJnc1tfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGxpc3QgPSB0aGlzLmdldENhbGxiYWNrTGlzdChldmVudCk7XHJcbiAgICAgICAgZm9yICh2YXIgX2EgPSAwLCBsaXN0XzEgPSBsaXN0OyBfYSA8IGxpc3RfMS5sZW5ndGg7IF9hKyspIHtcclxuICAgICAgICAgICAgdmFyIGNhbGxiYWNrID0gbGlzdF8xW19hXTtcclxuICAgICAgICAgICAgY2FsbGJhY2suYXBwbHkobnVsbCwgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIEV2ZW50RW1pdHRlckJhc2UucHJvdG90eXBlLmdldENhbGxiYWNrTGlzdCA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJ1Y2tldHNbZXZlbnRdIHx8ICh0aGlzLmJ1Y2tldHNbZXZlbnRdID0gW10pO1xyXG4gICAgfTtcclxuICAgIHJldHVybiBFdmVudEVtaXR0ZXJCYXNlO1xyXG59KCkpO1xyXG5leHBvcnRzLkV2ZW50RW1pdHRlckJhc2UgPSBFdmVudEVtaXR0ZXJCYXNlO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1FdmVudEVtaXR0ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XHJcbnZhciBEZWZhdWx0Q29sdW1uXzEgPSByZXF1aXJlKFwiLi4vLi4vbW9kZWwvZGVmYXVsdC9EZWZhdWx0Q29sdW1uXCIpO1xyXG52YXIgRGVmYXVsdFJvd18xID0gcmVxdWlyZShcIi4uLy4uL21vZGVsL2RlZmF1bHQvRGVmYXVsdFJvd1wiKTtcclxudmFyIFJlY3RfMSA9IHJlcXVpcmUoXCIuLi8uLi9nZW9tL1JlY3RcIik7XHJcbnZhciBfID0gcmVxdWlyZShcIi4uLy4uL21pc2MvVXRpbFwiKTtcclxudmFyIEdyaWRMYXlvdXQgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgZnVuY3Rpb24gR3JpZExheW91dCh3aWR0aCwgaGVpZ2h0LCBjb2x1bW5zLCByb3dzLCBjZWxscywgY2VsbExvb2t1cCkge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICB0aGlzLmNvbHVtbnMgPSBjb2x1bW5zO1xyXG4gICAgICAgIHRoaXMucm93cyA9IHJvd3M7XHJcbiAgICAgICAgdGhpcy5jZWxscyA9IGNlbGxzO1xyXG4gICAgICAgIHRoaXMuY2VsbExvb2t1cCA9IGNlbGxMb29rdXA7XHJcbiAgICAgICAgdGhpcy5jb2x1bW5JbmRleCA9IF8uaW5kZXgoY29sdW1ucywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgucmVmOyB9KTtcclxuICAgICAgICB0aGlzLnJvd0luZGV4ID0gXy5pbmRleChyb3dzLCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5yZWY7IH0pO1xyXG4gICAgICAgIHRoaXMuY2VsbEluZGV4ID0gXy5pbmRleChjZWxscywgZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgucmVmOyB9KTtcclxuICAgIH1cclxuICAgIEdyaWRMYXlvdXQuY29tcHV0ZSA9IGZ1bmN0aW9uIChtb2RlbCkge1xyXG4gICAgICAgIHZhciBjb2xMb29rdXAgPSBtb2RlbC5jb2x1bW5zLnJlZHVjZShmdW5jdGlvbiAodCwgeCkgeyB0W3gucmVmXSA9IHg7IHJldHVybiB0OyB9LCB7fSk7XHJcbiAgICAgICAgdmFyIHJvd0xvb2t1cCA9IG1vZGVsLnJvd3MucmVkdWNlKGZ1bmN0aW9uICh0LCB4KSB7IHRbeC5yZWZdID0geDsgcmV0dXJuIHQ7IH0sIHt9KTtcclxuICAgICAgICB2YXIgY2VsbExvb2t1cCA9IGJ1aWxkQ2VsbExvb2t1cChtb2RlbC5jZWxscyk7IC8vYnkgY29sIHRoZW4gcm93XHJcbiAgICAgICAgLy8gQ29tcHV0ZSBhbGwgZXhwZWN0ZWQgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIHZhciBtYXhDb2wgPSBtb2RlbC5jZWxscy5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguY29sUmVmICsgKHguY29sU3BhbiAtIDEpOyB9KS5yZWR1Y2UoZnVuY3Rpb24gKHQsIHgpIHsgcmV0dXJuIHQgPiB4ID8gdCA6IHg7IH0sIDApO1xyXG4gICAgICAgIHZhciBtYXhSb3cgPSBtb2RlbC5jZWxscy5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgucm93UmVmICsgKHgucm93U3BhbiAtIDEpOyB9KS5yZWR1Y2UoZnVuY3Rpb24gKHQsIHgpIHsgcmV0dXJuIHQgPiB4ID8gdCA6IHg7IH0sIDApO1xyXG4gICAgICAgIC8vIEdlbmVyYXRlIG1pc3NpbmcgY29sdW1ucyBhbmQgcm93c1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG1heENvbDsgaSsrKSB7XHJcbiAgICAgICAgICAgIChjb2xMb29rdXBbaV0gfHwgKGNvbExvb2t1cFtpXSA9IG5ldyBEZWZhdWx0Q29sdW1uXzEuRGVmYXVsdENvbHVtbihpKSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8PSBtYXhSb3c7IGkrKykge1xyXG4gICAgICAgICAgICAocm93TG9va3VwW2ldIHx8IChyb3dMb29rdXBbaV0gPSBuZXcgRGVmYXVsdFJvd18xLkRlZmF1bHRSb3coaSkpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQ29tcHV0ZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHdob2xlIGdyaWRcclxuICAgICAgICB2YXIgd2lkdGggPSBfLnZhbHVlcyhjb2xMb29rdXApLnJlZHVjZShmdW5jdGlvbiAodCwgeCkgeyByZXR1cm4gdCArIHgud2lkdGg7IH0sIDApO1xyXG4gICAgICAgIHZhciBoZWlnaHQgPSBfLnZhbHVlcyhyb3dMb29rdXApLnJlZHVjZShmdW5jdGlvbiAodCwgeCkgeyByZXR1cm4gdCArIHguaGVpZ2h0OyB9LCAwKTtcclxuICAgICAgICAvLyBDb21wdXRlIHRoZSBsYXlvdXQgcmVnaW9ucyBmb3IgdGhlIHZhcmlvdXMgYml0c1xyXG4gICAgICAgIHZhciBjb2xSZWdzID0gW107XHJcbiAgICAgICAgdmFyIHJvd1JlZ3MgPSBbXTtcclxuICAgICAgICB2YXIgY2VsbFJlZ3MgPSBbXTtcclxuICAgICAgICB2YXIgYWNjTGVmdCA9IDA7XHJcbiAgICAgICAgZm9yICh2YXIgY2kgPSAwOyBjaSA8PSBtYXhDb2w7IGNpKyspIHtcclxuICAgICAgICAgICAgdmFyIGNvbCA9IGNvbExvb2t1cFtjaV07XHJcbiAgICAgICAgICAgIGNvbFJlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICByZWY6IGNvbC5yZWYsXHJcbiAgICAgICAgICAgICAgICBsZWZ0OiBhY2NMZWZ0LFxyXG4gICAgICAgICAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgICAgICAgICAgd2lkdGg6IGNvbC53aWR0aCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdmFyIGFjY1RvcCA9IDA7XHJcbiAgICAgICAgICAgIGZvciAodmFyIHJpID0gMDsgcmkgPD0gbWF4Um93OyByaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcm93ID0gcm93TG9va3VwW3JpXTtcclxuICAgICAgICAgICAgICAgIGlmIChjaSA9PT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJvd1JlZ3MucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZjogcm93LnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiB3aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiByb3cuaGVpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYgKGNlbGxMb29rdXBbY2ldICE9PSB1bmRlZmluZWQgJiYgY2VsbExvb2t1cFtjaV1bcmldICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IGNlbGxMb29rdXBbY2ldW3JpXTtcclxuICAgICAgICAgICAgICAgICAgICBjZWxsUmVncy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVmOiBjZWxsLnJlZixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGVmdDogYWNjTGVmdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9wOiBhY2NUb3AsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiBjb2wud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogcm93LmhlaWdodCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGFjY1RvcCArPSByb3cuaGVpZ2h0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFjY0xlZnQgKz0gY29sLndpZHRoO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3IEdyaWRMYXlvdXQod2lkdGgsIGhlaWdodCwgY29sUmVncywgcm93UmVncywgY2VsbFJlZ3MsIGNlbGxMb29rdXApO1xyXG4gICAgfTtcclxuICAgIEdyaWRMYXlvdXQucHJvdG90eXBlLnF1ZXJ5Q29sdW1uID0gZnVuY3Rpb24gKHJlZikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbHVtbkluZGV4W3JlZl0gfHwgbnVsbDtcclxuICAgIH07XHJcbiAgICBHcmlkTGF5b3V0LnByb3RvdHlwZS5xdWVyeVJvdyA9IGZ1bmN0aW9uIChyZWYpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9O1xyXG4gICAgR3JpZExheW91dC5wcm90b3R5cGUucXVlcnlDZWxsID0gZnVuY3Rpb24gKHJlZikge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNlbGxJbmRleFtyZWZdIHx8IG51bGw7XHJcbiAgICB9O1xyXG4gICAgR3JpZExheW91dC5wcm90b3R5cGUuY2FwdHVyZUNvbHVtbnMgPSBmdW5jdGlvbiAocmVnaW9uKSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29sdW1uc1xyXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uICh4KSB7IHJldHVybiBSZWN0XzEuUmVjdC5wcm90b3R5cGUuaW50ZXJzZWN0cy5jYWxsKHgsIHJlZ2lvbik7IH0pXHJcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHgucmVmOyB9KTtcclxuICAgIH07XHJcbiAgICBHcmlkTGF5b3V0LnByb3RvdHlwZS5jYXB0dXJlUm93cyA9IGZ1bmN0aW9uIChyZWdpb24pIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5yb3dzXHJcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIFJlY3RfMS5SZWN0LnByb3RvdHlwZS5pbnRlcnNlY3RzLmNhbGwoeCwgcmVnaW9uKTsgfSlcclxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5yZWY7IH0pO1xyXG4gICAgfTtcclxuICAgIEdyaWRMYXlvdXQucHJvdG90eXBlLmNhcHR1cmVDZWxscyA9IGZ1bmN0aW9uIChyZWdpb24pIHtcclxuICAgICAgICB2YXIgY29scyA9IHRoaXMuY2FwdHVyZUNvbHVtbnMocmVnaW9uKTtcclxuICAgICAgICB2YXIgcm93cyA9IHRoaXMuY2FwdHVyZVJvd3MocmVnaW9uKTtcclxuICAgICAgICB2YXIgY2VsbHMgPSBuZXcgQXJyYXkoKTtcclxuICAgICAgICBmb3IgKHZhciBfaSA9IDAsIGNvbHNfMSA9IGNvbHM7IF9pIDwgY29sc18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgICAgICB2YXIgYyA9IGNvbHNfMVtfaV07XHJcbiAgICAgICAgICAgIGZvciAodmFyIF9hID0gMCwgcm93c18xID0gcm93czsgX2EgPCByb3dzXzEubGVuZ3RoOyBfYSsrKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgciA9IHJvd3NfMVtfYV07XHJcbiAgICAgICAgICAgICAgICB2YXIgY2VsbCA9IHRoaXMuY2VsbExvb2t1cFtjXVtyXTtcclxuICAgICAgICAgICAgICAgIGlmICghIWNlbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjZWxscy5wdXNoKGNlbGwucmVmKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gY2VsbHM7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIEdyaWRMYXlvdXQ7XHJcbn0oKSk7XHJcbmV4cG9ydHMuR3JpZExheW91dCA9IEdyaWRMYXlvdXQ7XHJcbmZ1bmN0aW9uIGJ1aWxkQ2VsbExvb2t1cChjZWxscykge1xyXG4gICAgdmFyIGl4ID0ge307XHJcbiAgICBmb3IgKHZhciBfaSA9IDAsIGNlbGxzXzEgPSBjZWxsczsgX2kgPCBjZWxsc18xLmxlbmd0aDsgX2krKykge1xyXG4gICAgICAgIHZhciBjID0gY2VsbHNfMVtfaV07XHJcbiAgICAgICAgdmFyIGNpeCA9IGl4W2MuY29sUmVmXSB8fCAoaXhbYy5jb2xSZWZdID0ge30pO1xyXG4gICAgICAgIGNpeFtjLnJvd1JlZl0gPSBjO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGl4O1xyXG59XHJcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUdyaWRMYXlvdXQuanMubWFwIiwiLyoqXHJcbiAqIEVtYmVkZGluZyBvZiBDbGlwYm9hcmQuanMgLSBodHRwczovL2dpdGh1Yi5jb20vemVub3JvY2hhL2NsaXBib2FyZC5qcy9cclxuICpcclxuICogQWZ0ZXIgdmFyaW91cyBhdHRlbXB0cywgSSB3YXMgdW5hYmxlIHRvIG5wbSBpbnN0YWxsIGluY2x1ZGluZyB0eXBlcyBlZmZlY3RpdmVseSBhbmQgYmVjYXVzZSBhbiBpbmRleC5qcyBpcyBub3RcclxuICogdXNlZCBJIGNhbm5vdCB1c2UgdGhlIFR5cGVTY3JpcHQgMi4xIHVua25vd24gbW9kdWxlIGltcG9ydCwgc28gcmVzb3J0aW5nIHRvIGxvY2FsIGVtYmVkZGVkIHZlcnNpb24uICBXaWxsIHJlbW92ZVxyXG4gKiBpbiB0aGUgZnV0dXJlIGlmIHBvc3NpYmxlLlxyXG4gKlxyXG4gKiBNb2RpZmljYXRpb25zIGhhdmUgYmVlbiBtYWRlIHRvIG1ha2UgdGhlIGNvZGUgY29tcGlsZTpcclxuICogLSBSZW1vdmVkIFByb21pc2UgcG9seWZpbGwgKGltcG9ydGVkIGluc3RlYWQpXHJcbiAqIC0gUmVzdHJ1Y3R1cmVkIGV4cG9ydCBhbmQgYWRkZWQgdHlwZWQgaW50ZXJmYWNlXHJcbiAqIC0gU29tZSBjaGFuZ2VzIHRvIHByZXZlbnQgdHlwZSBjaGVja2luZyB3aGVyZSB1bmRlc2lyZWRcclxuICovXHJcblwidXNlIHN0cmljdFwiO1xyXG52YXIgZXM2X3Byb21pc2VfMSA9IHJlcXVpcmUoXCJlczYtcHJvbWlzZVwiKTtcclxuLy9EZWNsYXJlIHdpbmRvdyBhcyBhbiBhbnkgdmFyIGFsaWFzIHRvIHByZXZlbnQgVFMgbW9hbmluZy4uLlxyXG52YXIgd25kID0gd2luZG93O1xyXG52YXIgY2xpcGJvYXJkID0ge307XHJcbmNsaXBib2FyZC5jb3B5ID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICB2YXIgX2RhdGEgPSBudWxsOyAvLyBNYXAgZnJvbSBkYXRhIHR5cGUgKGUuZy4gXCJ0ZXh0L2h0bWxcIikgdG8gdmFsdWUuXHJcbiAgICB2YXIgX2JvZ3VzU2VsZWN0aW9uID0gZmFsc2U7XHJcbiAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xyXG4gICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICBfZGF0YSA9IG51bGw7XHJcbiAgICAgICAgaWYgKF9ib2d1c1NlbGVjdGlvbikge1xyXG4gICAgICAgICAgICB3aW5kb3cuZ2V0U2VsZWN0aW9uKCkucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIF9ib2d1c1NlbGVjdGlvbiA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNvcHlcIiwgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoX2ludGVyY2VwdCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gX2RhdGEpIHtcclxuICAgICAgICAgICAgICAgIGUuY2xpcGJvYXJkRGF0YS5zZXREYXRhKGtleSwgX2RhdGFba2V5XSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgLy8gV29ya2Fyb3VuZCBmb3IgU2FmYXJpOiBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTU2NTI5XHJcbiAgICBmdW5jdGlvbiBib2d1c1NlbGVjdCgpIHtcclxuICAgICAgICB2YXIgc2VsID0gZG9jdW1lbnQuZ2V0U2VsZWN0aW9uKCk7XHJcbiAgICAgICAgLy8gSWYgXCJub3RoaW5nXCIgaXMgc2VsZWN0ZWQuLi5cclxuICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5Q29tbWFuZEVuYWJsZWQoXCJjb3B5XCIpICYmIHNlbC5pc0NvbGxhcHNlZCkge1xyXG4gICAgICAgICAgICAvLyAuLi4gdGVtcG9yYXJpbHkgc2VsZWN0IHRoZSBlbnRpcmUgYm9keS5cclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgLy8gV2Ugc2VsZWN0IHRoZSBlbnRpcmUgYm9keSBiZWNhdXNlOlxyXG4gICAgICAgICAgICAvLyAtIGl0J3MgZ3VhcmFudGVlZCB0byBleGlzdCxcclxuICAgICAgICAgICAgLy8gLSBpdCB3b3JrcyAodW5saWtlLCBzYXksIGRvY3VtZW50LmhlYWQsIG9yIHBoYW50b20gZWxlbWVudCB0aGF0IGlzXHJcbiAgICAgICAgICAgIC8vICAgbm90IGluc2VydGVkIGludG8gdGhlIERPTSksXHJcbiAgICAgICAgICAgIC8vIC0gaXQgZG9lc24ndCBzZWVtIHRvIGZsaWNrZXIgKGR1ZSB0byB0aGUgc3luY2hyb25vdXMgY29weSBldmVudCksIGFuZFxyXG4gICAgICAgICAgICAvLyAtIGl0IGF2b2lkcyBtb2RpZnlpbmcgdGhlIERPTSAoY2FuIHRyaWdnZXIgbXV0YXRpb24gb2JzZXJ2ZXJzKS5cclxuICAgICAgICAgICAgLy9cclxuICAgICAgICAgICAgLy8gQmVjYXVzZSB3ZSBjYW4ndCBkbyBwcm9wZXIgZmVhdHVyZSBkZXRlY3Rpb24gKHdlIGFscmVhZHkgY2hlY2tlZFxyXG4gICAgICAgICAgICAvLyBkb2N1bWVudC5xdWVyeUNvbW1hbmRFbmFibGVkKFwiY29weVwiKSAsIHdoaWNoIGFjdHVhbGx5IGdpdmVzIGEgZmFsc2VcclxuICAgICAgICAgICAgLy8gbmVnYXRpdmUgZm9yIEJsaW5rIHdoZW4gbm90aGluZyBpcyBzZWxlY3RlZCkgYW5kIFVBIHNuaWZmaW5nIGlzIG5vdFxyXG4gICAgICAgICAgICAvLyByZWxpYWJsZSAoYSBsb3Qgb2YgVUEgc3RyaW5ncyBjb250YWluIFwiU2FmYXJpXCIpLCB0aGlzIHdpbGwgYWxzb1xyXG4gICAgICAgICAgICAvLyBoYXBwZW4gZm9yIHNvbWUgYnJvd3NlcnMgb3RoZXIgdGhhbiBTYWZhcmkuIDotKClcclxuICAgICAgICAgICAgdmFyIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcclxuICAgICAgICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGRvY3VtZW50LmJvZHkpO1xyXG4gICAgICAgICAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xyXG4gICAgICAgICAgICBfYm9ndXNTZWxlY3Rpb24gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIDtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgZXM2X3Byb21pc2VfMS5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgX2ludGVyY2VwdCA9IHRydWU7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgX2RhdGEgPSB7IFwidGV4dC9wbGFpblwiOiBkYXRhIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBpZiAoZGF0YSBpbnN0YW5jZW9mIE5vZGUpIHtcclxuICAgICAgICAgICAgICAgIF9kYXRhID0geyBcInRleHQvaHRtbFwiOiBuZXcgWE1MU2VyaWFsaXplcigpLnNlcmlhbGl6ZVRvU3RyaW5nKGRhdGEpIH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBfZGF0YSA9IGRhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGJvZ3VzU2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJjb3B5XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9jdW1lbnQuZXhlY0NvbW1hbmQgaXMgc3luY2hyb25vdXM6IGh0dHA6Ly93d3cudzMub3JnL1RSLzIwMTUvV0QtY2xpcGJvYXJkLWFwaXMtMjAxNTA0MjEvI2ludGVncmF0aW9uLXdpdGgtcmljaC10ZXh0LWVkaXRpbmctYXBpc1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFNvIHdlIGNhbiBjYWxsIHJlc29sdmUoKSBiYWNrIGhlcmUuXHJcbiAgICAgICAgICAgICAgICAgICAgY2xlYW51cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVuYWJsZSB0byBjb3B5LiBQZXJoYXBzIGl0J3Mgbm90IGF2YWlsYWJsZSBpbiB5b3VyIGJyb3dzZXI/XCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH07XHJcbn0pKCk7XHJcbmNsaXBib2FyZC5wYXN0ZSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgX2ludGVyY2VwdCA9IGZhbHNlO1xyXG4gICAgdmFyIF9yZXNvbHZlO1xyXG4gICAgdmFyIF9kYXRhVHlwZTtcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwYXN0ZVwiLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGlmIChfaW50ZXJjZXB0KSB7XHJcbiAgICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB2YXIgcmVzb2x2ZSA9IF9yZXNvbHZlO1xyXG4gICAgICAgICAgICBfcmVzb2x2ZSA9IG51bGw7XHJcbiAgICAgICAgICAgIHJlc29sdmUoZS5jbGlwYm9hcmREYXRhLmdldERhdGEoX2RhdGFUeXBlKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGRhdGFUeXBlKSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBlczZfcHJvbWlzZV8xLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xyXG4gICAgICAgICAgICBfaW50ZXJjZXB0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgX3Jlc29sdmUgPSByZXNvbHZlO1xyXG4gICAgICAgICAgICBfZGF0YVR5cGUgPSBkYXRhVHlwZSB8fCBcInRleHQvcGxhaW5cIjtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJwYXN0ZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIF9pbnRlcmNlcHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiVW5hYmxlIHRvIHBhc3RlLiBQYXN0aW5nIG9ubHkgd29ya3MgaW4gSW50ZXJuZXQgRXhwbG9yZXIgYXQgdGhlIG1vbWVudC5cIikpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBfaW50ZXJjZXB0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKGUpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufSkoKTtcclxuLy8gSGFuZGxlIElFIGJlaGF2aW91ci5cclxuaWYgKHR5cGVvZiBDbGlwYm9hcmRFdmVudCA9PT0gXCJ1bmRlZmluZWRcIiAmJlxyXG4gICAgdHlwZW9mIHduZC5jbGlwYm9hcmREYXRhICE9PSBcInVuZGVmaW5lZFwiICYmXHJcbiAgICB0eXBlb2Ygd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YSAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgY2xpcGJvYXJkLmNvcHkgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgZXM2X3Byb21pc2VfMS5Qcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcclxuICAgICAgICAgICAgLy8gSUUgc3VwcG9ydHMgc3RyaW5nIGFuZCBVUkwgdHlwZXM6IGh0dHBzOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvbXM1MzY3NDQodj12cy44NSkuYXNweFxyXG4gICAgICAgICAgICAvLyBXZSBvbmx5IHN1cHBvcnQgdGhlIHN0cmluZyB0eXBlIGZvciBub3cuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZGF0YSAhPT0gXCJzdHJpbmdcIiAmJiAhKFwidGV4dC9wbGFpblwiIGluIGRhdGEpKSB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3UgbXVzdCBwcm92aWRlIGEgdGV4dC9wbGFpbiB0eXBlLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgc3RyRGF0YSA9ICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGRhdGEgOiBkYXRhW1widGV4dC9wbGFpblwiXSk7XHJcbiAgICAgICAgICAgIHZhciBjb3B5U3VjY2VlZGVkID0gd25kLmNsaXBib2FyZERhdGEuc2V0RGF0YShcIlRleHRcIiwgc3RyRGF0YSk7XHJcbiAgICAgICAgICAgIGlmIChjb3B5U3VjY2VlZGVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiQ29weWluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuICAgIGNsaXBib2FyZC5wYXN0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gbmV3IGVzNl9wcm9taXNlXzEuUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcbiAgICAgICAgICAgIHZhciBzdHJEYXRhID0gd25kLmNsaXBib2FyZERhdGEuZ2V0RGF0YShcIlRleHRcIik7XHJcbiAgICAgICAgICAgIGlmIChzdHJEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHN0ckRhdGEpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVGhlIHVzZXIgcmVqZWN0ZWQgdGhlIHBhc3RlIHJlcXVlc3QuXHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUGFzdGluZyB3YXMgcmVqZWN0ZWQuXCIpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxufVxyXG5leHBvcnRzLkNsaXBib2FyZCA9IGNsaXBib2FyZDtcclxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xpcGJvYXJkLmpzLm1hcCIsIi8qIVxuICogQG92ZXJ2aWV3IGVzNi1wcm9taXNlIC0gYSB0aW55IGltcGxlbWVudGF0aW9uIG9mIFByb21pc2VzL0ErLlxuICogQGNvcHlyaWdodCBDb3B5cmlnaHQgKGMpIDIwMTQgWWVodWRhIEthdHosIFRvbSBEYWxlLCBTdGVmYW4gUGVubmVyIGFuZCBjb250cmlidXRvcnMgKENvbnZlcnNpb24gdG8gRVM2IEFQSSBieSBKYWtlIEFyY2hpYmFsZClcbiAqIEBsaWNlbnNlICAgTGljZW5zZWQgdW5kZXIgTUlUIGxpY2Vuc2VcbiAqICAgICAgICAgICAgU2VlIGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9zdGVmYW5wZW5uZXIvZXM2LXByb21pc2UvbWFzdGVyL0xJQ0VOU0VcbiAqIEB2ZXJzaW9uICAgNC4wLjVcbiAqL1xuXG4oZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICAgIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAgIChnbG9iYWwuRVM2UHJvbWlzZSA9IGZhY3RvcnkoKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gb2JqZWN0T3JGdW5jdGlvbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJyB8fCB0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbn1cblxudmFyIF9pc0FycmF5ID0gdW5kZWZpbmVkO1xuaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gIF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpID09PSAnW29iamVjdCBBcnJheV0nO1xuICB9O1xufSBlbHNlIHtcbiAgX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xufVxuXG52YXIgaXNBcnJheSA9IF9pc0FycmF5O1xuXG52YXIgbGVuID0gMDtcbnZhciB2ZXJ0eE5leHQgPSB1bmRlZmluZWQ7XG52YXIgY3VzdG9tU2NoZWR1bGVyRm4gPSB1bmRlZmluZWQ7XG5cbnZhciBhc2FwID0gZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gIHF1ZXVlW2xlbl0gPSBjYWxsYmFjaztcbiAgcXVldWVbbGVuICsgMV0gPSBhcmc7XG4gIGxlbiArPSAyO1xuICBpZiAobGVuID09PSAyKSB7XG4gICAgLy8gSWYgbGVuIGlzIDIsIHRoYXQgbWVhbnMgdGhhdCB3ZSBuZWVkIHRvIHNjaGVkdWxlIGFuIGFzeW5jIGZsdXNoLlxuICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgLy8gd2lsbCBiZSBwcm9jZXNzZWQgYnkgdGhpcyBmbHVzaCB0aGF0IHdlIGFyZSBzY2hlZHVsaW5nLlxuICAgIGlmIChjdXN0b21TY2hlZHVsZXJGbikge1xuICAgICAgY3VzdG9tU2NoZWR1bGVyRm4oZmx1c2gpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZUZsdXNoKCk7XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBzZXRTY2hlZHVsZXIoc2NoZWR1bGVGbikge1xuICBjdXN0b21TY2hlZHVsZXJGbiA9IHNjaGVkdWxlRm47XG59XG5cbmZ1bmN0aW9uIHNldEFzYXAoYXNhcEZuKSB7XG4gIGFzYXAgPSBhc2FwRm47XG59XG5cbnZhciBicm93c2VyV2luZG93ID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB1bmRlZmluZWQ7XG52YXIgYnJvd3Nlckdsb2JhbCA9IGJyb3dzZXJXaW5kb3cgfHwge307XG52YXIgQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBicm93c2VyR2xvYmFsLk11dGF0aW9uT2JzZXJ2ZXIgfHwgYnJvd3Nlckdsb2JhbC5XZWJLaXRNdXRhdGlvbk9ic2VydmVyO1xudmFyIGlzTm9kZSA9IHR5cGVvZiBzZWxmID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgKHt9KS50b1N0cmluZy5jYWxsKHByb2Nlc3MpID09PSAnW29iamVjdCBwcm9jZXNzXSc7XG5cbi8vIHRlc3QgZm9yIHdlYiB3b3JrZXIgYnV0IG5vdCBpbiBJRTEwXG52YXIgaXNXb3JrZXIgPSB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBpbXBvcnRTY3JpcHRzICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnO1xuXG4vLyBub2RlXG5mdW5jdGlvbiB1c2VOZXh0VGljaygpIHtcbiAgLy8gbm9kZSB2ZXJzaW9uIDAuMTAueCBkaXNwbGF5cyBhIGRlcHJlY2F0aW9uIHdhcm5pbmcgd2hlbiBuZXh0VGljayBpcyB1c2VkIHJlY3Vyc2l2ZWx5XG4gIC8vIHNlZSBodHRwczovL2dpdGh1Yi5jb20vY3Vqb2pzL3doZW4vaXNzdWVzLzQxMCBmb3IgZGV0YWlsc1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgfTtcbn1cblxuLy8gdmVydHhcbmZ1bmN0aW9uIHVzZVZlcnR4VGltZXIoKSB7XG4gIGlmICh0eXBlb2YgdmVydHhOZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICB2ZXJ0eE5leHQoZmx1c2gpO1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gdXNlU2V0VGltZW91dCgpO1xufVxuXG5mdW5jdGlvbiB1c2VNdXRhdGlvbk9ic2VydmVyKCkge1xuICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBCcm93c2VyTXV0YXRpb25PYnNlcnZlcihmbHVzaCk7XG4gIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICBvYnNlcnZlci5vYnNlcnZlKG5vZGUsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIG5vZGUuZGF0YSA9IGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyO1xuICB9O1xufVxuXG4vLyB3ZWIgd29ya2VyXG5mdW5jdGlvbiB1c2VNZXNzYWdlQ2hhbm5lbCgpIHtcbiAgdmFyIGNoYW5uZWwgPSBuZXcgTWVzc2FnZUNoYW5uZWwoKTtcbiAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmbHVzaDtcbiAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gdXNlU2V0VGltZW91dCgpIHtcbiAgLy8gU3RvcmUgc2V0VGltZW91dCByZWZlcmVuY2Ugc28gZXM2LXByb21pc2Ugd2lsbCBiZSB1bmFmZmVjdGVkIGJ5XG4gIC8vIG90aGVyIGNvZGUgbW9kaWZ5aW5nIHNldFRpbWVvdXQgKGxpa2Ugc2lub24udXNlRmFrZVRpbWVycygpKVxuICB2YXIgZ2xvYmFsU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGdsb2JhbFNldFRpbWVvdXQoZmx1c2gsIDEpO1xuICB9O1xufVxuXG52YXIgcXVldWUgPSBuZXcgQXJyYXkoMTAwMCk7XG5mdW5jdGlvbiBmbHVzaCgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHZhciBjYWxsYmFjayA9IHF1ZXVlW2ldO1xuICAgIHZhciBhcmcgPSBxdWV1ZVtpICsgMV07XG5cbiAgICBjYWxsYmFjayhhcmcpO1xuXG4gICAgcXVldWVbaV0gPSB1bmRlZmluZWQ7XG4gICAgcXVldWVbaSArIDFdID0gdW5kZWZpbmVkO1xuICB9XG5cbiAgbGVuID0gMDtcbn1cblxuZnVuY3Rpb24gYXR0ZW1wdFZlcnR4KCkge1xuICB0cnkge1xuICAgIHZhciByID0gcmVxdWlyZTtcbiAgICB2YXIgdmVydHggPSByKCd2ZXJ0eCcpO1xuICAgIHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgcmV0dXJuIHVzZVZlcnR4VGltZXIoKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB1c2VTZXRUaW1lb3V0KCk7XG4gIH1cbn1cblxudmFyIHNjaGVkdWxlRmx1c2ggPSB1bmRlZmluZWQ7XG4vLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuaWYgKGlzTm9kZSkge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlTmV4dFRpY2soKTtcbn0gZWxzZSBpZiAoQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU11dGF0aW9uT2JzZXJ2ZXIoKTtcbn0gZWxzZSBpZiAoaXNXb3JrZXIpIHtcbiAgc2NoZWR1bGVGbHVzaCA9IHVzZU1lc3NhZ2VDaGFubmVsKCk7XG59IGVsc2UgaWYgKGJyb3dzZXJXaW5kb3cgPT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICBzY2hlZHVsZUZsdXNoID0gYXR0ZW1wdFZlcnR4KCk7XG59IGVsc2Uge1xuICBzY2hlZHVsZUZsdXNoID0gdXNlU2V0VGltZW91dCgpO1xufVxuXG5mdW5jdGlvbiB0aGVuKG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gIHZhciBfYXJndW1lbnRzID0gYXJndW1lbnRzO1xuXG4gIHZhciBwYXJlbnQgPSB0aGlzO1xuXG4gIHZhciBjaGlsZCA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKG5vb3ApO1xuXG4gIGlmIChjaGlsZFtQUk9NSVNFX0lEXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbWFrZVByb21pc2UoY2hpbGQpO1xuICB9XG5cbiAgdmFyIF9zdGF0ZSA9IHBhcmVudC5fc3RhdGU7XG5cbiAgaWYgKF9zdGF0ZSkge1xuICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgY2FsbGJhY2sgPSBfYXJndW1lbnRzW19zdGF0ZSAtIDFdO1xuICAgICAgYXNhcChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBpbnZva2VDYWxsYmFjayhfc3RhdGUsIGNoaWxkLCBjYWxsYmFjaywgcGFyZW50Ll9yZXN1bHQpO1xuICAgICAgfSk7XG4gICAgfSkoKTtcbiAgfSBlbHNlIHtcbiAgICBzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICB9XG5cbiAgcmV0dXJuIGNoaWxkO1xufVxuXG4vKipcbiAgYFByb21pc2UucmVzb2x2ZWAgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlY29tZSByZXNvbHZlZCB3aXRoIHRoZVxuICBwYXNzZWQgYHZhbHVlYC4gSXQgaXMgc2hvcnRoYW5kIGZvciB0aGUgZm9sbG93aW5nOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHJlc29sdmUoMSk7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gdmFsdWUgPT09IDFcbiAgfSk7XG4gIGBgYFxuXG4gIEluc3RlYWQgb2Ygd3JpdGluZyB0aGUgYWJvdmUsIHlvdXIgY29kZSBub3cgc2ltcGx5IGJlY29tZXMgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKDEpO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gdmFsdWUgPT09IDFcbiAgfSk7XG4gIGBgYFxuXG4gIEBtZXRob2QgcmVzb2x2ZVxuICBAc3RhdGljXG4gIEBwYXJhbSB7QW55fSB2YWx1ZSB2YWx1ZSB0aGF0IHRoZSByZXR1cm5lZCBwcm9taXNlIHdpbGwgYmUgcmVzb2x2ZWQgd2l0aFxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB0aGF0IHdpbGwgYmVjb21lIGZ1bGZpbGxlZCB3aXRoIHRoZSBnaXZlblxuICBgdmFsdWVgXG4qL1xuZnVuY3Rpb24gcmVzb2x2ZShvYmplY3QpIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICBpZiAob2JqZWN0ICYmIHR5cGVvZiBvYmplY3QgPT09ICdvYmplY3QnICYmIG9iamVjdC5jb25zdHJ1Y3RvciA9PT0gQ29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gb2JqZWN0O1xuICB9XG5cbiAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3Iobm9vcCk7XG4gIF9yZXNvbHZlKHByb21pc2UsIG9iamVjdCk7XG4gIHJldHVybiBwcm9taXNlO1xufVxuXG52YXIgUFJPTUlTRV9JRCA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygxNik7XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG52YXIgUEVORElORyA9IHZvaWQgMDtcbnZhciBGVUxGSUxMRUQgPSAxO1xudmFyIFJFSkVDVEVEID0gMjtcblxudmFyIEdFVF9USEVOX0VSUk9SID0gbmV3IEVycm9yT2JqZWN0KCk7XG5cbmZ1bmN0aW9uIHNlbGZGdWxmaWxsbWVudCgpIHtcbiAgcmV0dXJuIG5ldyBUeXBlRXJyb3IoXCJZb3UgY2Fubm90IHJlc29sdmUgYSBwcm9taXNlIHdpdGggaXRzZWxmXCIpO1xufVxuXG5mdW5jdGlvbiBjYW5ub3RSZXR1cm5Pd24oKSB7XG4gIHJldHVybiBuZXcgVHlwZUVycm9yKCdBIHByb21pc2VzIGNhbGxiYWNrIGNhbm5vdCByZXR1cm4gdGhhdCBzYW1lIHByb21pc2UuJyk7XG59XG5cbmZ1bmN0aW9uIGdldFRoZW4ocHJvbWlzZSkge1xuICB0cnkge1xuICAgIHJldHVybiBwcm9taXNlLnRoZW47XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBlcnJvcjtcbiAgICByZXR1cm4gR0VUX1RIRU5fRVJST1I7XG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5VGhlbih0aGVuLCB2YWx1ZSwgZnVsZmlsbG1lbnRIYW5kbGVyLCByZWplY3Rpb25IYW5kbGVyKSB7XG4gIHRyeSB7XG4gICAgdGhlbi5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGU7XG4gIH1cbn1cblxuZnVuY3Rpb24gaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlLCB0aGVuKSB7XG4gIGFzYXAoZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICB2YXIgc2VhbGVkID0gZmFsc2U7XG4gICAgdmFyIGVycm9yID0gdHJ5VGhlbih0aGVuLCB0aGVuYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICBpZiAoc2VhbGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIGlmIChzZWFsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc2VhbGVkID0gdHJ1ZTtcblxuICAgICAgX3JlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgIH0sICdTZXR0bGU6ICcgKyAocHJvbWlzZS5fbGFiZWwgfHwgJyB1bmtub3duIHByb21pc2UnKSk7XG5cbiAgICBpZiAoIXNlYWxlZCAmJiBlcnJvcikge1xuICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgIH1cbiAgfSwgcHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU93blRoZW5hYmxlKHByb21pc2UsIHRoZW5hYmxlKSB7XG4gIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IEZVTEZJTExFRCkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gIH0gZWxzZSBpZiAodGhlbmFibGUuX3N0YXRlID09PSBSRUpFQ1RFRCkge1xuICAgIF9yZWplY3QocHJvbWlzZSwgdGhlbmFibGUuX3Jlc3VsdCk7XG4gIH0gZWxzZSB7XG4gICAgc3Vic2NyaWJlKHRoZW5hYmxlLCB1bmRlZmluZWQsIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgcmV0dXJuIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICByZXR1cm4gX3JlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbiQkKSB7XG4gIGlmIChtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yID09PSBwcm9taXNlLmNvbnN0cnVjdG9yICYmIHRoZW4kJCA9PT0gdGhlbiAmJiBtYXliZVRoZW5hYmxlLmNvbnN0cnVjdG9yLnJlc29sdmUgPT09IHJlc29sdmUpIHtcbiAgICBoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAodGhlbiQkID09PSBHRVRfVEhFTl9FUlJPUikge1xuICAgICAgX3JlamVjdChwcm9taXNlLCBHRVRfVEhFTl9FUlJPUi5lcnJvcik7XG4gICAgfSBlbHNlIGlmICh0aGVuJCQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICB9IGVsc2UgaWYgKGlzRnVuY3Rpb24odGhlbiQkKSkge1xuICAgICAgaGFuZGxlRm9yZWlnblRoZW5hYmxlKHByb21pc2UsIG1heWJlVGhlbmFibGUsIHRoZW4kJCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZ1bGZpbGwocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKSB7XG4gIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgIF9yZWplY3QocHJvbWlzZSwgc2VsZkZ1bGZpbGxtZW50KCkpO1xuICB9IGVsc2UgaWYgKG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCB2YWx1ZSwgZ2V0VGhlbih2YWx1ZSkpO1xuICB9IGVsc2Uge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICBpZiAocHJvbWlzZS5fb25lcnJvcikge1xuICAgIHByb21pc2UuX29uZXJyb3IocHJvbWlzZS5fcmVzdWx0KTtcbiAgfVxuXG4gIHB1Ymxpc2gocHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgaWYgKHByb21pc2UuX3N0YXRlICE9PSBQRU5ESU5HKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHJvbWlzZS5fcmVzdWx0ID0gdmFsdWU7XG4gIHByb21pc2UuX3N0YXRlID0gRlVMRklMTEVEO1xuXG4gIGlmIChwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggIT09IDApIHtcbiAgICBhc2FwKHB1Ymxpc2gsIHByb21pc2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gUEVORElORykge1xuICAgIHJldHVybjtcbiAgfVxuICBwcm9taXNlLl9zdGF0ZSA9IFJFSkVDVEVEO1xuICBwcm9taXNlLl9yZXN1bHQgPSByZWFzb247XG5cbiAgYXNhcChwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKSB7XG4gIHZhciBfc3Vic2NyaWJlcnMgPSBwYXJlbnQuX3N1YnNjcmliZXJzO1xuICB2YXIgbGVuZ3RoID0gX3N1YnNjcmliZXJzLmxlbmd0aDtcblxuICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gIF9zdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gIF9zdWJzY3JpYmVyc1tsZW5ndGggKyBGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgX3N1YnNjcmliZXJzW2xlbmd0aCArIFJFSkVDVEVEXSA9IG9uUmVqZWN0aW9uO1xuXG4gIGlmIChsZW5ndGggPT09IDAgJiYgcGFyZW50Ll9zdGF0ZSkge1xuICAgIGFzYXAocHVibGlzaCwgcGFyZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBwdWJsaXNoKHByb21pc2UpIHtcbiAgdmFyIHN1YnNjcmliZXJzID0gcHJvbWlzZS5fc3Vic2NyaWJlcnM7XG4gIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgaWYgKHN1YnNjcmliZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBjaGlsZCA9IHVuZGVmaW5lZCxcbiAgICAgIGNhbGxiYWNrID0gdW5kZWZpbmVkLFxuICAgICAgZGV0YWlsID0gcHJvbWlzZS5fcmVzdWx0O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3Vic2NyaWJlcnMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgIGNhbGxiYWNrID0gc3Vic2NyaWJlcnNbaSArIHNldHRsZWRdO1xuXG4gICAgaWYgKGNoaWxkKSB7XG4gICAgICBpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgfVxuICB9XG5cbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMubGVuZ3RoID0gMDtcbn1cblxuZnVuY3Rpb24gRXJyb3JPYmplY3QoKSB7XG4gIHRoaXMuZXJyb3IgPSBudWxsO1xufVxuXG52YXIgVFJZX0NBVENIX0VSUk9SID0gbmV3IEVycm9yT2JqZWN0KCk7XG5cbmZ1bmN0aW9uIHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gY2FsbGJhY2soZGV0YWlsKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIFRSWV9DQVRDSF9FUlJPUi5lcnJvciA9IGU7XG4gICAgcmV0dXJuIFRSWV9DQVRDSF9FUlJPUjtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gIHZhciBoYXNDYWxsYmFjayA9IGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgdmFsdWUgPSB1bmRlZmluZWQsXG4gICAgICBlcnJvciA9IHVuZGVmaW5lZCxcbiAgICAgIHN1Y2NlZWRlZCA9IHVuZGVmaW5lZCxcbiAgICAgIGZhaWxlZCA9IHVuZGVmaW5lZDtcblxuICBpZiAoaGFzQ2FsbGJhY2spIHtcbiAgICB2YWx1ZSA9IHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpO1xuXG4gICAgaWYgKHZhbHVlID09PSBUUllfQ0FUQ0hfRVJST1IpIHtcbiAgICAgIGZhaWxlZCA9IHRydWU7XG4gICAgICBlcnJvciA9IHZhbHVlLmVycm9yO1xuICAgICAgdmFsdWUgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgX3JlamVjdChwcm9taXNlLCBjYW5ub3RSZXR1cm5Pd24oKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gZGV0YWlsO1xuICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gIH1cblxuICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICAvLyBub29wXG4gIH0gZWxzZSBpZiAoaGFzQ2FsbGJhY2sgJiYgc3VjY2VlZGVkKSB7XG4gICAgICBfcmVzb2x2ZShwcm9taXNlLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmIChmYWlsZWQpIHtcbiAgICAgIF9yZWplY3QocHJvbWlzZSwgZXJyb3IpO1xuICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gRlVMRklMTEVEKSB7XG4gICAgICBmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IFJFSkVDVEVEKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVQcm9taXNlKHByb21pc2UsIHJlc29sdmVyKSB7XG4gIHRyeSB7XG4gICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpIHtcbiAgICAgIF9yZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICB9LCBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgX3JlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgIH0pO1xuICB9IGNhdGNoIChlKSB7XG4gICAgX3JlamVjdChwcm9taXNlLCBlKTtcbiAgfVxufVxuXG52YXIgaWQgPSAwO1xuZnVuY3Rpb24gbmV4dElkKCkge1xuICByZXR1cm4gaWQrKztcbn1cblxuZnVuY3Rpb24gbWFrZVByb21pc2UocHJvbWlzZSkge1xuICBwcm9taXNlW1BST01JU0VfSURdID0gaWQrKztcbiAgcHJvbWlzZS5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gIHByb21pc2UuX3Jlc3VsdCA9IHVuZGVmaW5lZDtcbiAgcHJvbWlzZS5fc3Vic2NyaWJlcnMgPSBbXTtcbn1cblxuZnVuY3Rpb24gRW51bWVyYXRvcihDb25zdHJ1Y3RvciwgaW5wdXQpIHtcbiAgdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICB0aGlzLnByb21pc2UgPSBuZXcgQ29uc3RydWN0b3Iobm9vcCk7XG5cbiAgaWYgKCF0aGlzLnByb21pc2VbUFJPTUlTRV9JRF0pIHtcbiAgICBtYWtlUHJvbWlzZSh0aGlzLnByb21pc2UpO1xuICB9XG5cbiAgaWYgKGlzQXJyYXkoaW5wdXQpKSB7XG4gICAgdGhpcy5faW5wdXQgPSBpbnB1dDtcbiAgICB0aGlzLmxlbmd0aCA9IGlucHV0Lmxlbmd0aDtcbiAgICB0aGlzLl9yZW1haW5pbmcgPSBpbnB1dC5sZW5ndGg7XG5cbiAgICB0aGlzLl9yZXN1bHQgPSBuZXcgQXJyYXkodGhpcy5sZW5ndGgpO1xuXG4gICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBmdWxmaWxsKHRoaXMucHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aCB8fCAwO1xuICAgICAgdGhpcy5fZW51bWVyYXRlKCk7XG4gICAgICBpZiAodGhpcy5fcmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBfcmVqZWN0KHRoaXMucHJvbWlzZSwgdmFsaWRhdGlvbkVycm9yKCkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRpb25FcnJvcigpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcignQXJyYXkgTWV0aG9kcyBtdXN0IGJlIHByb3ZpZGVkIGFuIEFycmF5Jyk7XG59O1xuXG5FbnVtZXJhdG9yLnByb3RvdHlwZS5fZW51bWVyYXRlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gIHZhciBfaW5wdXQgPSB0aGlzLl9pbnB1dDtcblxuICBmb3IgKHZhciBpID0gMDsgdGhpcy5fc3RhdGUgPT09IFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdGhpcy5fZWFjaEVudHJ5KF9pbnB1dFtpXSwgaSk7XG4gIH1cbn07XG5cbkVudW1lcmF0b3IucHJvdG90eXBlLl9lYWNoRW50cnkgPSBmdW5jdGlvbiAoZW50cnksIGkpIHtcbiAgdmFyIGMgPSB0aGlzLl9pbnN0YW5jZUNvbnN0cnVjdG9yO1xuICB2YXIgcmVzb2x2ZSQkID0gYy5yZXNvbHZlO1xuXG4gIGlmIChyZXNvbHZlJCQgPT09IHJlc29sdmUpIHtcbiAgICB2YXIgX3RoZW4gPSBnZXRUaGVuKGVudHJ5KTtcblxuICAgIGlmIChfdGhlbiA9PT0gdGhlbiAmJiBlbnRyeS5fc3RhdGUgIT09IFBFTkRJTkcpIHtcbiAgICAgIHRoaXMuX3NldHRsZWRBdChlbnRyeS5fc3RhdGUsIGksIGVudHJ5Ll9yZXN1bHQpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIF90aGVuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aGlzLl9yZW1haW5pbmctLTtcbiAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IGVudHJ5O1xuICAgIH0gZWxzZSBpZiAoYyA9PT0gUHJvbWlzZSkge1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgYyhub29wKTtcbiAgICAgIGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgZW50cnksIF90aGVuKTtcbiAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChwcm9taXNlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KG5ldyBjKGZ1bmN0aW9uIChyZXNvbHZlJCQpIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmUkJChlbnRyeSk7XG4gICAgICB9KSwgaSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlJCQoZW50cnkpLCBpKTtcbiAgfVxufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX3NldHRsZWRBdCA9IGZ1bmN0aW9uIChzdGF0ZSwgaSwgdmFsdWUpIHtcbiAgdmFyIHByb21pc2UgPSB0aGlzLnByb21pc2U7XG5cbiAgaWYgKHByb21pc2UuX3N0YXRlID09PSBQRU5ESU5HKSB7XG4gICAgdGhpcy5fcmVtYWluaW5nLS07XG5cbiAgICBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XG4gICAgICBfcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVzdWx0W2ldID0gdmFsdWU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRoaXMuX3JlbWFpbmluZyA9PT0gMCkge1xuICAgIGZ1bGZpbGwocHJvbWlzZSwgdGhpcy5fcmVzdWx0KTtcbiAgfVxufTtcblxuRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uIChwcm9taXNlLCBpKSB7XG4gIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICBzdWJzY3JpYmUocHJvbWlzZSwgdW5kZWZpbmVkLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICByZXR1cm4gZW51bWVyYXRvci5fc2V0dGxlZEF0KEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIGVudW1lcmF0b3IuX3NldHRsZWRBdChSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgfSk7XG59O1xuXG4vKipcbiAgYFByb21pc2UuYWxsYCBhY2NlcHRzIGFuIGFycmF5IG9mIHByb21pc2VzLCBhbmQgcmV0dXJucyBhIG5ldyBwcm9taXNlIHdoaWNoXG4gIGlzIGZ1bGZpbGxlZCB3aXRoIGFuIGFycmF5IG9mIGZ1bGZpbGxtZW50IHZhbHVlcyBmb3IgdGhlIHBhc3NlZCBwcm9taXNlcywgb3JcbiAgcmVqZWN0ZWQgd2l0aCB0aGUgcmVhc29uIG9mIHRoZSBmaXJzdCBwYXNzZWQgcHJvbWlzZSB0byBiZSByZWplY3RlZC4gSXQgY2FzdHMgYWxsXG4gIGVsZW1lbnRzIG9mIHRoZSBwYXNzZWQgaXRlcmFibGUgdG8gcHJvbWlzZXMgYXMgaXQgcnVucyB0aGlzIGFsZ29yaXRobS5cblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gcmVzb2x2ZSgxKTtcbiAgbGV0IHByb21pc2UyID0gcmVzb2x2ZSgyKTtcbiAgbGV0IHByb21pc2UzID0gcmVzb2x2ZSgzKTtcbiAgbGV0IHByb21pc2VzID0gWyBwcm9taXNlMSwgcHJvbWlzZTIsIHByb21pc2UzIF07XG5cbiAgUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oZnVuY3Rpb24oYXJyYXkpe1xuICAgIC8vIFRoZSBhcnJheSBoZXJlIHdvdWxkIGJlIFsgMSwgMiwgMyBdO1xuICB9KTtcbiAgYGBgXG5cbiAgSWYgYW55IG9mIHRoZSBgcHJvbWlzZXNgIGdpdmVuIHRvIGBhbGxgIGFyZSByZWplY3RlZCwgdGhlIGZpcnN0IHByb21pc2VcbiAgdGhhdCBpcyByZWplY3RlZCB3aWxsIGJlIGdpdmVuIGFzIGFuIGFyZ3VtZW50IHRvIHRoZSByZXR1cm5lZCBwcm9taXNlcydzXG4gIHJlamVjdGlvbiBoYW5kbGVyLiBGb3IgZXhhbXBsZTpcblxuICBFeGFtcGxlOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgbGV0IHByb21pc2UxID0gcmVzb2x2ZSgxKTtcbiAgbGV0IHByb21pc2UyID0gcmVqZWN0KG5ldyBFcnJvcihcIjJcIikpO1xuICBsZXQgcHJvbWlzZTMgPSByZWplY3QobmV3IEVycm9yKFwiM1wiKSk7XG4gIGxldCBwcm9taXNlcyA9IFsgcHJvbWlzZTEsIHByb21pc2UyLCBwcm9taXNlMyBdO1xuXG4gIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGFycmF5KXtcbiAgICAvLyBDb2RlIGhlcmUgbmV2ZXIgcnVucyBiZWNhdXNlIHRoZXJlIGFyZSByZWplY3RlZCBwcm9taXNlcyFcbiAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAvLyBlcnJvci5tZXNzYWdlID09PSBcIjJcIlxuICB9KTtcbiAgYGBgXG5cbiAgQG1ldGhvZCBhbGxcbiAgQHN0YXRpY1xuICBAcGFyYW0ge0FycmF5fSBlbnRyaWVzIGFycmF5IG9mIHByb21pc2VzXG4gIEBwYXJhbSB7U3RyaW5nfSBsYWJlbCBvcHRpb25hbCBzdHJpbmcgZm9yIGxhYmVsaW5nIHRoZSBwcm9taXNlLlxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBpcyBmdWxmaWxsZWQgd2hlbiBhbGwgYHByb21pc2VzYCBoYXZlIGJlZW5cbiAgZnVsZmlsbGVkLCBvciByZWplY3RlZCBpZiBhbnkgb2YgdGhlbSBiZWNvbWUgcmVqZWN0ZWQuXG4gIEBzdGF0aWNcbiovXG5mdW5jdGlvbiBhbGwoZW50cmllcykge1xuICByZXR1cm4gbmV3IEVudW1lcmF0b3IodGhpcywgZW50cmllcykucHJvbWlzZTtcbn1cblxuLyoqXG4gIGBQcm9taXNlLnJhY2VgIHJldHVybnMgYSBuZXcgcHJvbWlzZSB3aGljaCBpcyBzZXR0bGVkIGluIHRoZSBzYW1lIHdheSBhcyB0aGVcbiAgZmlyc3QgcGFzc2VkIHByb21pc2UgdG8gc2V0dGxlLlxuXG4gIEV4YW1wbGU6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZTEgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIHJlc29sdmUoJ3Byb21pc2UgMScpO1xuICAgIH0sIDIwMCk7XG4gIH0pO1xuXG4gIGxldCBwcm9taXNlMiA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZSgncHJvbWlzZSAyJyk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgUHJvbWlzZS5yYWNlKFtwcm9taXNlMSwgcHJvbWlzZTJdKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgLy8gcmVzdWx0ID09PSAncHJvbWlzZSAyJyBiZWNhdXNlIGl0IHdhcyByZXNvbHZlZCBiZWZvcmUgcHJvbWlzZTFcbiAgICAvLyB3YXMgcmVzb2x2ZWQuXG4gIH0pO1xuICBgYGBcblxuICBgUHJvbWlzZS5yYWNlYCBpcyBkZXRlcm1pbmlzdGljIGluIHRoYXQgb25seSB0aGUgc3RhdGUgb2YgdGhlIGZpcnN0XG4gIHNldHRsZWQgcHJvbWlzZSBtYXR0ZXJzLiBGb3IgZXhhbXBsZSwgZXZlbiBpZiBvdGhlciBwcm9taXNlcyBnaXZlbiB0byB0aGVcbiAgYHByb21pc2VzYCBhcnJheSBhcmd1bWVudCBhcmUgcmVzb2x2ZWQsIGJ1dCB0aGUgZmlyc3Qgc2V0dGxlZCBwcm9taXNlIGhhc1xuICBiZWNvbWUgcmVqZWN0ZWQgYmVmb3JlIHRoZSBvdGhlciBwcm9taXNlcyBiZWNhbWUgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAgcHJvbWlzZSB3aWxsIGJlY29tZSByZWplY3RlZDpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlMSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCl7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgcmVzb2x2ZSgncHJvbWlzZSAxJyk7XG4gICAgfSwgMjAwKTtcbiAgfSk7XG5cbiAgbGV0IHByb21pc2UyID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdwcm9taXNlIDInKSk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgUHJvbWlzZS5yYWNlKFtwcm9taXNlMSwgcHJvbWlzZTJdKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7XG4gICAgLy8gQ29kZSBoZXJlIG5ldmVyIHJ1bnNcbiAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAvLyByZWFzb24ubWVzc2FnZSA9PT0gJ3Byb21pc2UgMicgYmVjYXVzZSBwcm9taXNlIDIgYmVjYW1lIHJlamVjdGVkIGJlZm9yZVxuICAgIC8vIHByb21pc2UgMSBiZWNhbWUgZnVsZmlsbGVkXG4gIH0pO1xuICBgYGBcblxuICBBbiBleGFtcGxlIHJlYWwtd29ybGQgdXNlIGNhc2UgaXMgaW1wbGVtZW50aW5nIHRpbWVvdXRzOlxuXG4gIGBgYGphdmFzY3JpcHRcbiAgUHJvbWlzZS5yYWNlKFthamF4KCdmb28uanNvbicpLCB0aW1lb3V0KDUwMDApXSlcbiAgYGBgXG5cbiAgQG1ldGhvZCByYWNlXG4gIEBzdGF0aWNcbiAgQHBhcmFtIHtBcnJheX0gcHJvbWlzZXMgYXJyYXkgb2YgcHJvbWlzZXMgdG8gb2JzZXJ2ZVxuICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gIEByZXR1cm4ge1Byb21pc2V9IGEgcHJvbWlzZSB3aGljaCBzZXR0bGVzIGluIHRoZSBzYW1lIHdheSBhcyB0aGUgZmlyc3QgcGFzc2VkXG4gIHByb21pc2UgdG8gc2V0dGxlLlxuKi9cbmZ1bmN0aW9uIHJhY2UoZW50cmllcykge1xuICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICB2YXIgQ29uc3RydWN0b3IgPSB0aGlzO1xuXG4gIGlmICghaXNBcnJheShlbnRyaWVzKSkge1xuICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24gKF8sIHJlamVjdCkge1xuICAgICAgcmV0dXJuIHJlamVjdChuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIHJhY2UuJykpO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgQ29uc3RydWN0b3IoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIGxlbmd0aCA9IGVudHJpZXMubGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBDb25zdHJ1Y3Rvci5yZXNvbHZlKGVudHJpZXNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAgYFByb21pc2UucmVqZWN0YCByZXR1cm5zIGEgcHJvbWlzZSByZWplY3RlZCB3aXRoIHRoZSBwYXNzZWQgYHJlYXNvbmAuXG4gIEl0IGlzIHNob3J0aGFuZCBmb3IgdGhlIGZvbGxvd2luZzpcblxuICBgYGBqYXZhc2NyaXB0XG4gIGxldCBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICByZWplY3QobmV3IEVycm9yKCdXSE9PUFMnKSk7XG4gIH0pO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gQ29kZSBoZXJlIGRvZXNuJ3QgcnVuIGJlY2F1c2UgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQhXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gIH0pO1xuICBgYGBcblxuICBJbnN0ZWFkIG9mIHdyaXRpbmcgdGhlIGFib3ZlLCB5b3VyIGNvZGUgbm93IHNpbXBseSBiZWNvbWVzIHRoZSBmb2xsb3dpbmc6XG5cbiAgYGBgamF2YXNjcmlwdFxuICBsZXQgcHJvbWlzZSA9IFByb21pc2UucmVqZWN0KG5ldyBFcnJvcignV0hPT1BTJykpO1xuXG4gIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSl7XG4gICAgLy8gQ29kZSBoZXJlIGRvZXNuJ3QgcnVuIGJlY2F1c2UgdGhlIHByb21pc2UgaXMgcmVqZWN0ZWQhXG4gIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgLy8gcmVhc29uLm1lc3NhZ2UgPT09ICdXSE9PUFMnXG4gIH0pO1xuICBgYGBcblxuICBAbWV0aG9kIHJlamVjdFxuICBAc3RhdGljXG4gIEBwYXJhbSB7QW55fSByZWFzb24gdmFsdWUgdGhhdCB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aWxsIGJlIHJlamVjdGVkIHdpdGguXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQHJldHVybiB7UHJvbWlzZX0gYSBwcm9taXNlIHJlamVjdGVkIHdpdGggdGhlIGdpdmVuIGByZWFzb25gLlxuKi9cbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcbiAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3Iobm9vcCk7XG4gIF9yZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgcmV0dXJuIHByb21pc2U7XG59XG5cbmZ1bmN0aW9uIG5lZWRzUmVzb2x2ZXIoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbn1cblxuZnVuY3Rpb24gbmVlZHNOZXcoKSB7XG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXCJGYWlsZWQgdG8gY29uc3RydWN0ICdQcm9taXNlJzogUGxlYXNlIHVzZSB0aGUgJ25ldycgb3BlcmF0b3IsIHRoaXMgb2JqZWN0IGNvbnN0cnVjdG9yIGNhbm5vdCBiZSBjYWxsZWQgYXMgYSBmdW5jdGlvbi5cIik7XG59XG5cbi8qKlxuICBQcm9taXNlIG9iamVjdHMgcmVwcmVzZW50IHRoZSBldmVudHVhbCByZXN1bHQgb2YgYW4gYXN5bmNocm9ub3VzIG9wZXJhdGlvbi4gVGhlXG4gIHByaW1hcnkgd2F5IG9mIGludGVyYWN0aW5nIHdpdGggYSBwcm9taXNlIGlzIHRocm91Z2ggaXRzIGB0aGVuYCBtZXRob2QsIHdoaWNoXG4gIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlIHJlYXNvblxuICB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cblxuICBUZXJtaW5vbG9neVxuICAtLS0tLS0tLS0tLVxuXG4gIC0gYHByb21pc2VgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB3aXRoIGEgYHRoZW5gIG1ldGhvZCB3aG9zZSBiZWhhdmlvciBjb25mb3JtcyB0byB0aGlzIHNwZWNpZmljYXRpb24uXG4gIC0gYHRoZW5hYmxlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gdGhhdCBkZWZpbmVzIGEgYHRoZW5gIG1ldGhvZC5cbiAgLSBgdmFsdWVgIGlzIGFueSBsZWdhbCBKYXZhU2NyaXB0IHZhbHVlIChpbmNsdWRpbmcgdW5kZWZpbmVkLCBhIHRoZW5hYmxlLCBvciBhIHByb21pc2UpLlxuICAtIGBleGNlcHRpb25gIGlzIGEgdmFsdWUgdGhhdCBpcyB0aHJvd24gdXNpbmcgdGhlIHRocm93IHN0YXRlbWVudC5cbiAgLSBgcmVhc29uYCBpcyBhIHZhbHVlIHRoYXQgaW5kaWNhdGVzIHdoeSBhIHByb21pc2Ugd2FzIHJlamVjdGVkLlxuICAtIGBzZXR0bGVkYCB0aGUgZmluYWwgcmVzdGluZyBzdGF0ZSBvZiBhIHByb21pc2UsIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cblxuICBBIHByb21pc2UgY2FuIGJlIGluIG9uZSBvZiB0aHJlZSBzdGF0ZXM6IHBlbmRpbmcsIGZ1bGZpbGxlZCwgb3IgcmVqZWN0ZWQuXG5cbiAgUHJvbWlzZXMgdGhhdCBhcmUgZnVsZmlsbGVkIGhhdmUgYSBmdWxmaWxsbWVudCB2YWx1ZSBhbmQgYXJlIGluIHRoZSBmdWxmaWxsZWRcbiAgc3RhdGUuICBQcm9taXNlcyB0aGF0IGFyZSByZWplY3RlZCBoYXZlIGEgcmVqZWN0aW9uIHJlYXNvbiBhbmQgYXJlIGluIHRoZVxuICByZWplY3RlZCBzdGF0ZS4gIEEgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmV2ZXIgYSB0aGVuYWJsZS5cblxuICBQcm9taXNlcyBjYW4gYWxzbyBiZSBzYWlkIHRvICpyZXNvbHZlKiBhIHZhbHVlLiAgSWYgdGhpcyB2YWx1ZSBpcyBhbHNvIGFcbiAgcHJvbWlzZSwgdGhlbiB0aGUgb3JpZ2luYWwgcHJvbWlzZSdzIHNldHRsZWQgc3RhdGUgd2lsbCBtYXRjaCB0aGUgdmFsdWUnc1xuICBzZXR0bGVkIHN0YXRlLiAgU28gYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCByZWplY3RzIHdpbGxcbiAgaXRzZWxmIHJlamVjdCwgYW5kIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2lsbFxuICBpdHNlbGYgZnVsZmlsbC5cblxuXG4gIEJhc2ljIFVzYWdlOlxuICAtLS0tLS0tLS0tLS1cblxuICBgYGBqc1xuICBsZXQgcHJvbWlzZSA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIC8vIG9uIHN1Y2Nlc3NcbiAgICByZXNvbHZlKHZhbHVlKTtcblxuICAgIC8vIG9uIGZhaWx1cmVcbiAgICByZWplY3QocmVhc29uKTtcbiAgfSk7XG5cbiAgcHJvbWlzZS50aGVuKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgLy8gb24gZnVsZmlsbG1lbnRcbiAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgLy8gb24gcmVqZWN0aW9uXG4gIH0pO1xuICBgYGBcblxuICBBZHZhbmNlZCBVc2FnZTpcbiAgLS0tLS0tLS0tLS0tLS0tXG5cbiAgUHJvbWlzZXMgc2hpbmUgd2hlbiBhYnN0cmFjdGluZyBhd2F5IGFzeW5jaHJvbm91cyBpbnRlcmFjdGlvbnMgc3VjaCBhc1xuICBgWE1MSHR0cFJlcXVlc3Rgcy5cblxuICBgYGBqc1xuICBmdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3Qpe1xuICAgICAgbGV0IHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuXG4gICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICAgIHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBoYW5kbGVyO1xuICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdqc29uJztcbiAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgeGhyLnNlbmQoKTtcblxuICAgICAgZnVuY3Rpb24gaGFuZGxlcigpIHtcbiAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gdGhpcy5ET05FKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIHJlc29sdmUodGhpcy5yZXNwb25zZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ2dldEpTT046IGAnICsgdXJsICsgJ2AgZmFpbGVkIHdpdGggc3RhdHVzOiBbJyArIHRoaXMuc3RhdHVzICsgJ10nKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuICAgIH0pO1xuICB9XG5cbiAgZ2V0SlNPTignL3Bvc3RzLmpzb24nKS50aGVuKGZ1bmN0aW9uKGpzb24pIHtcbiAgICAvLyBvbiBmdWxmaWxsbWVudFxuICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAvLyBvbiByZWplY3Rpb25cbiAgfSk7XG4gIGBgYFxuXG4gIFVubGlrZSBjYWxsYmFja3MsIHByb21pc2VzIGFyZSBncmVhdCBjb21wb3NhYmxlIHByaW1pdGl2ZXMuXG5cbiAgYGBganNcbiAgUHJvbWlzZS5hbGwoW1xuICAgIGdldEpTT04oJy9wb3N0cycpLFxuICAgIGdldEpTT04oJy9jb21tZW50cycpXG4gIF0pLnRoZW4oZnVuY3Rpb24odmFsdWVzKXtcbiAgICB2YWx1ZXNbMF0gLy8gPT4gcG9zdHNKU09OXG4gICAgdmFsdWVzWzFdIC8vID0+IGNvbW1lbnRzSlNPTlxuXG4gICAgcmV0dXJuIHZhbHVlcztcbiAgfSk7XG4gIGBgYFxuXG4gIEBjbGFzcyBQcm9taXNlXG4gIEBwYXJhbSB7ZnVuY3Rpb259IHJlc29sdmVyXG4gIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgQGNvbnN0cnVjdG9yXG4qL1xuZnVuY3Rpb24gUHJvbWlzZShyZXNvbHZlcikge1xuICB0aGlzW1BST01JU0VfSURdID0gbmV4dElkKCk7XG4gIHRoaXMuX3Jlc3VsdCA9IHRoaXMuX3N0YXRlID0gdW5kZWZpbmVkO1xuICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gIGlmIChub29wICE9PSByZXNvbHZlcikge1xuICAgIHR5cGVvZiByZXNvbHZlciAhPT0gJ2Z1bmN0aW9uJyAmJiBuZWVkc1Jlc29sdmVyKCk7XG4gICAgdGhpcyBpbnN0YW5jZW9mIFByb21pc2UgPyBpbml0aWFsaXplUHJvbWlzZSh0aGlzLCByZXNvbHZlcikgOiBuZWVkc05ldygpO1xuICB9XG59XG5cblByb21pc2UuYWxsID0gYWxsO1xuUHJvbWlzZS5yYWNlID0gcmFjZTtcblByb21pc2UucmVzb2x2ZSA9IHJlc29sdmU7XG5Qcm9taXNlLnJlamVjdCA9IHJlamVjdDtcblByb21pc2UuX3NldFNjaGVkdWxlciA9IHNldFNjaGVkdWxlcjtcblByb21pc2UuX3NldEFzYXAgPSBzZXRBc2FwO1xuUHJvbWlzZS5fYXNhcCA9IGFzYXA7XG5cblByb21pc2UucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogUHJvbWlzZSxcblxuICAvKipcbiAgICBUaGUgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCxcbiAgICB3aGljaCByZWdpc3RlcnMgY2FsbGJhY2tzIHRvIHJlY2VpdmUgZWl0aGVyIGEgcHJvbWlzZSdzIGV2ZW50dWFsIHZhbHVlIG9yIHRoZVxuICAgIHJlYXNvbiB3aHkgdGhlIHByb21pc2UgY2Fubm90IGJlIGZ1bGZpbGxlZC5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgICAvLyB1c2VyIGlzIGF2YWlsYWJsZVxuICAgIH0sIGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyB1c2VyIGlzIHVuYXZhaWxhYmxlLCBhbmQgeW91IGFyZSBnaXZlbiB0aGUgcmVhc29uIHdoeVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBDaGFpbmluZ1xuICAgIC0tLS0tLS0tXG4gIFxuICAgIFRoZSByZXR1cm4gdmFsdWUgb2YgYHRoZW5gIGlzIGl0c2VsZiBhIHByb21pc2UuICBUaGlzIHNlY29uZCwgJ2Rvd25zdHJlYW0nXG4gICAgcHJvbWlzZSBpcyByZXNvbHZlZCB3aXRoIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGZpcnN0IHByb21pc2UncyBmdWxmaWxsbWVudFxuICAgIG9yIHJlamVjdGlvbiBoYW5kbGVyLCBvciByZWplY3RlZCBpZiB0aGUgaGFuZGxlciB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuICBcbiAgICBgYGBqc1xuICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgcmV0dXJuIHVzZXIubmFtZTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICByZXR1cm4gJ2RlZmF1bHQgbmFtZSc7XG4gICAgfSkudGhlbihmdW5jdGlvbiAodXNlck5hbWUpIHtcbiAgICAgIC8vIElmIGBmaW5kVXNlcmAgZnVsZmlsbGVkLCBgdXNlck5hbWVgIHdpbGwgYmUgdGhlIHVzZXIncyBuYW1lLCBvdGhlcndpc2UgaXRcbiAgICAgIC8vIHdpbGwgYmUgYCdkZWZhdWx0IG5hbWUnYFxuICAgIH0pO1xuICBcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknKTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2BmaW5kVXNlcmAgcmVqZWN0ZWQgYW5kIHdlJ3JlIHVuaGFwcHknKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgIC8vIGlmIGBmaW5kVXNlcmAgZnVsZmlsbGVkLCBgcmVhc29uYCB3aWxsIGJlICdGb3VuZCB1c2VyLCBidXQgc3RpbGwgdW5oYXBweScuXG4gICAgICAvLyBJZiBgZmluZFVzZXJgIHJlamVjdGVkLCBgcmVhc29uYCB3aWxsIGJlICdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jy5cbiAgICB9KTtcbiAgICBgYGBcbiAgICBJZiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIGRvZXMgbm90IHNwZWNpZnkgYSByZWplY3Rpb24gaGFuZGxlciwgcmVqZWN0aW9uIHJlYXNvbnMgd2lsbCBiZSBwcm9wYWdhdGVkIGZ1cnRoZXIgZG93bnN0cmVhbS5cbiAgXG4gICAgYGBganNcbiAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBQZWRhZ29naWNhbEV4Y2VwdGlvbignVXBzdHJlYW0gZXJyb3InKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgIH0pLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgLy8gVGhlIGBQZWRnYWdvY2lhbEV4Y2VwdGlvbmAgaXMgcHJvcGFnYXRlZCBhbGwgdGhlIHdheSBkb3duIHRvIGhlcmVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgQXNzaW1pbGF0aW9uXG4gICAgLS0tLS0tLS0tLS0tXG4gIFxuICAgIFNvbWV0aW1lcyB0aGUgdmFsdWUgeW91IHdhbnQgdG8gcHJvcGFnYXRlIHRvIGEgZG93bnN0cmVhbSBwcm9taXNlIGNhbiBvbmx5IGJlXG4gICAgcmV0cmlldmVkIGFzeW5jaHJvbm91c2x5LiBUaGlzIGNhbiBiZSBhY2hpZXZlZCBieSByZXR1cm5pbmcgYSBwcm9taXNlIGluIHRoZVxuICAgIGZ1bGZpbGxtZW50IG9yIHJlamVjdGlvbiBoYW5kbGVyLiBUaGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgdGhlbiBiZSBwZW5kaW5nXG4gICAgdW50aWwgdGhlIHJldHVybmVkIHByb21pc2UgaXMgc2V0dGxlZC4gVGhpcyBpcyBjYWxsZWQgKmFzc2ltaWxhdGlvbiouXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgfSkudGhlbihmdW5jdGlvbiAoY29tbWVudHMpIHtcbiAgICAgIC8vIFRoZSB1c2VyJ3MgY29tbWVudHMgYXJlIG5vdyBhdmFpbGFibGVcbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgSWYgdGhlIGFzc2ltbGlhdGVkIHByb21pc2UgcmVqZWN0cywgdGhlbiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIHdpbGwgYWxzbyByZWplY3QuXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICByZXR1cm4gZmluZENvbW1lbnRzQnlBdXRob3IodXNlcik7XG4gICAgfSkudGhlbihmdW5jdGlvbiAoY29tbWVudHMpIHtcbiAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgZnVsZmlsbHMsIHdlJ2xsIGhhdmUgdGhlIHZhbHVlIGhlcmVcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAvLyBJZiBgZmluZENvbW1lbnRzQnlBdXRob3JgIHJlamVjdHMsIHdlJ2xsIGhhdmUgdGhlIHJlYXNvbiBoZXJlXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIFNpbXBsZSBFeGFtcGxlXG4gICAgLS0tLS0tLS0tLS0tLS1cbiAgXG4gICAgU3luY2hyb25vdXMgRXhhbXBsZVxuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgbGV0IHJlc3VsdDtcbiAgXG4gICAgdHJ5IHtcbiAgICAgIHJlc3VsdCA9IGZpbmRSZXN1bHQoKTtcbiAgICAgIC8vIHN1Y2Nlc3NcbiAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH1cbiAgICBgYGBcbiAgXG4gICAgRXJyYmFjayBFeGFtcGxlXG4gIFxuICAgIGBgYGpzXG4gICAgZmluZFJlc3VsdChmdW5jdGlvbihyZXN1bHQsIGVycil7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBgYGBcbiAgXG4gICAgUHJvbWlzZSBFeGFtcGxlO1xuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgZmluZFJlc3VsdCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgIC8vIHN1Y2Nlc3NcbiAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgLy8gZmFpbHVyZVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBBZHZhbmNlZCBFeGFtcGxlXG4gICAgLS0tLS0tLS0tLS0tLS1cbiAgXG4gICAgU3luY2hyb25vdXMgRXhhbXBsZVxuICBcbiAgICBgYGBqYXZhc2NyaXB0XG4gICAgbGV0IGF1dGhvciwgYm9va3M7XG4gIFxuICAgIHRyeSB7XG4gICAgICBhdXRob3IgPSBmaW5kQXV0aG9yKCk7XG4gICAgICBib29rcyAgPSBmaW5kQm9va3NCeUF1dGhvcihhdXRob3IpO1xuICAgICAgLy8gc3VjY2Vzc1xuICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAvLyBmYWlsdXJlXG4gICAgfVxuICAgIGBgYFxuICBcbiAgICBFcnJiYWNrIEV4YW1wbGVcbiAgXG4gICAgYGBganNcbiAgXG4gICAgZnVuY3Rpb24gZm91bmRCb29rcyhib29rcykge1xuICBcbiAgICB9XG4gIFxuICAgIGZ1bmN0aW9uIGZhaWx1cmUocmVhc29uKSB7XG4gIFxuICAgIH1cbiAgXG4gICAgZmluZEF1dGhvcihmdW5jdGlvbihhdXRob3IsIGVycil7XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBmaW5kQm9vb2tzQnlBdXRob3IoYXV0aG9yLCBmdW5jdGlvbihib29rcywgZXJyKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgIGZhaWx1cmUoZXJyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgZm91bmRCb29rcyhib29rcyk7XG4gICAgICAgICAgICAgIH0gY2F0Y2gocmVhc29uKSB7XG4gICAgICAgICAgICAgICAgZmFpbHVyZShyZWFzb24pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgICBmYWlsdXJlKGVycik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfVxuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBQcm9taXNlIEV4YW1wbGU7XG4gIFxuICAgIGBgYGphdmFzY3JpcHRcbiAgICBmaW5kQXV0aG9yKCkuXG4gICAgICB0aGVuKGZpbmRCb29rc0J5QXV0aG9yKS5cbiAgICAgIHRoZW4oZnVuY3Rpb24oYm9va3Mpe1xuICAgICAgICAvLyBmb3VuZCBib29rc1xuICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgIH0pO1xuICAgIGBgYFxuICBcbiAgICBAbWV0aG9kIHRoZW5cbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvbkZ1bGZpbGxlZFxuICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0ZWRcbiAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgQHJldHVybiB7UHJvbWlzZX1cbiAgKi9cbiAgdGhlbjogdGhlbixcblxuICAvKipcbiAgICBgY2F0Y2hgIGlzIHNpbXBseSBzdWdhciBmb3IgYHRoZW4odW5kZWZpbmVkLCBvblJlamVjdGlvbilgIHdoaWNoIG1ha2VzIGl0IHRoZSBzYW1lXG4gICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cbiAgXG4gICAgYGBganNcbiAgICBmdW5jdGlvbiBmaW5kQXV0aG9yKCl7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkbid0IGZpbmQgdGhhdCBhdXRob3InKTtcbiAgICB9XG4gIFxuICAgIC8vIHN5bmNocm9ub3VzXG4gICAgdHJ5IHtcbiAgICAgIGZpbmRBdXRob3IoKTtcbiAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICB9XG4gIFxuICAgIC8vIGFzeW5jIHdpdGggcHJvbWlzZXNcbiAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgfSk7XG4gICAgYGBgXG4gIFxuICAgIEBtZXRob2QgY2F0Y2hcbiAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGlvblxuICAgIFVzZWZ1bCBmb3IgdG9vbGluZy5cbiAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAqL1xuICAnY2F0Y2gnOiBmdW5jdGlvbiBfY2F0Y2gob25SZWplY3Rpb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcG9seWZpbGwoKSB7XG4gICAgdmFyIGxvY2FsID0gdW5kZWZpbmVkO1xuXG4gICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGxvY2FsID0gZ2xvYmFsO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BvbHlmaWxsIGZhaWxlZCBiZWNhdXNlIGdsb2JhbCBvYmplY3QgaXMgdW5hdmFpbGFibGUgaW4gdGhpcyBlbnZpcm9ubWVudCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIFAgPSBsb2NhbC5Qcm9taXNlO1xuXG4gICAgaWYgKFApIHtcbiAgICAgICAgdmFyIHByb21pc2VUb1N0cmluZyA9IG51bGw7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUC5yZXNvbHZlKCkpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAvLyBzaWxlbnRseSBpZ25vcmVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJvbWlzZVRvU3RyaW5nID09PSAnW29iamVjdCBQcm9taXNlXScgJiYgIVAuY2FzdCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbG9jYWwuUHJvbWlzZSA9IFByb21pc2U7XG59XG5cbi8vIFN0cmFuZ2UgY29tcGF0Li5cblByb21pc2UucG9seWZpbGwgPSBwb2x5ZmlsbDtcblByb21pc2UuUHJvbWlzZSA9IFByb21pc2U7XG5cbnJldHVybiBQcm9taXNlO1xuXG59KSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZXM2LXByb21pc2UubWFwIiwiLyohXG5cdFBhcGEgUGFyc2Vcblx0djQuMS4yXG5cdGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2VcbiovXG4oZnVuY3Rpb24oZ2xvYmFsKVxue1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgSVNfV09SS0VSID0gIWdsb2JhbC5kb2N1bWVudCAmJiAhIWdsb2JhbC5wb3N0TWVzc2FnZSxcblx0XHRJU19QQVBBX1dPUktFUiA9IElTX1dPUktFUiAmJiAvKFxcP3wmKXBhcGF3b3JrZXIoPXwmfCQpLy50ZXN0KGdsb2JhbC5sb2NhdGlvbi5zZWFyY2gpLFxuXHRcdExPQURFRF9TWU5DID0gZmFsc2UsIEFVVE9fU0NSSVBUX1BBVEg7XG5cdHZhciB3b3JrZXJzID0ge30sIHdvcmtlcklkQ291bnRlciA9IDA7XG5cblx0dmFyIFBhcGEgPSB7fTtcblxuXHRQYXBhLnBhcnNlID0gQ3N2VG9Kc29uO1xuXHRQYXBhLnVucGFyc2UgPSBKc29uVG9Dc3Y7XG5cblx0UGFwYS5SRUNPUkRfU0VQID0gU3RyaW5nLmZyb21DaGFyQ29kZSgzMCk7XG5cdFBhcGEuVU5JVF9TRVAgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDMxKTtcblx0UGFwYS5CWVRFX09SREVSX01BUksgPSBcIlxcdWZlZmZcIjtcblx0UGFwYS5CQURfREVMSU1JVEVSUyA9IFtcIlxcclwiLCBcIlxcblwiLCBcIlxcXCJcIiwgUGFwYS5CWVRFX09SREVSX01BUktdO1xuXHRQYXBhLldPUktFUlNfU1VQUE9SVEVEID0gIUlTX1dPUktFUiAmJiAhIWdsb2JhbC5Xb3JrZXI7XG5cdFBhcGEuU0NSSVBUX1BBVEggPSBudWxsO1x0Ly8gTXVzdCBiZSBzZXQgYnkgeW91ciBjb2RlIGlmIHlvdSB1c2Ugd29ya2VycyBhbmQgdGhpcyBsaWIgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5XG5cblx0Ly8gQ29uZmlndXJhYmxlIGNodW5rIHNpemVzIGZvciBsb2NhbCBhbmQgcmVtb3RlIGZpbGVzLCByZXNwZWN0aXZlbHlcblx0UGFwYS5Mb2NhbENodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogMTA7XHQvLyAxMCBNQlxuXHRQYXBhLlJlbW90ZUNodW5rU2l6ZSA9IDEwMjQgKiAxMDI0ICogNTtcdC8vIDUgTUJcblx0UGFwYS5EZWZhdWx0RGVsaW1pdGVyID0gXCIsXCI7XHRcdFx0Ly8gVXNlZCBpZiBub3Qgc3BlY2lmaWVkIGFuZCBkZXRlY3Rpb24gZmFpbHNcblxuXHQvLyBFeHBvc2VkIGZvciB0ZXN0aW5nIGFuZCBkZXZlbG9wbWVudCBvbmx5XG5cdFBhcGEuUGFyc2VyID0gUGFyc2VyO1xuXHRQYXBhLlBhcnNlckhhbmRsZSA9IFBhcnNlckhhbmRsZTtcblx0UGFwYS5OZXR3b3JrU3RyZWFtZXIgPSBOZXR3b3JrU3RyZWFtZXI7XG5cdFBhcGEuRmlsZVN0cmVhbWVyID0gRmlsZVN0cmVhbWVyO1xuXHRQYXBhLlN0cmluZ1N0cmVhbWVyID0gU3RyaW5nU3RyZWFtZXI7XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKVxuXHR7XG5cdFx0Ly8gRXhwb3J0IHRvIE5vZGUuLi5cblx0XHRtb2R1bGUuZXhwb3J0cyA9IFBhcGE7XG5cdH1cblx0ZWxzZSBpZiAoaXNGdW5jdGlvbihnbG9iYWwuZGVmaW5lKSAmJiBnbG9iYWwuZGVmaW5lLmFtZClcblx0e1xuXHRcdC8vIFdpcmV1cCB3aXRoIFJlcXVpcmVKU1xuXHRcdGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIFBhcGE7IH0pO1xuXHR9XG5cdGVsc2Vcblx0e1xuXHRcdC8vIC4uLm9yIGFzIGJyb3dzZXIgZ2xvYmFsXG5cdFx0Z2xvYmFsLlBhcGEgPSBQYXBhO1xuXHR9XG5cblx0aWYgKGdsb2JhbC5qUXVlcnkpXG5cdHtcblx0XHR2YXIgJCA9IGdsb2JhbC5qUXVlcnk7XG5cdFx0JC5mbi5wYXJzZSA9IGZ1bmN0aW9uKG9wdGlvbnMpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbmZpZyA9IG9wdGlvbnMuY29uZmlnIHx8IHt9O1xuXHRcdFx0dmFyIHF1ZXVlID0gW107XG5cblx0XHRcdHRoaXMuZWFjaChmdW5jdGlvbihpZHgpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBzdXBwb3J0ZWQgPSAkKHRoaXMpLnByb3AoJ3RhZ05hbWUnKS50b1VwcGVyQ2FzZSgpID09IFwiSU5QVVRcIlxuXHRcdFx0XHRcdFx0XHRcdCYmICQodGhpcykuYXR0cigndHlwZScpLnRvTG93ZXJDYXNlKCkgPT0gXCJmaWxlXCJcblx0XHRcdFx0XHRcdFx0XHQmJiBnbG9iYWwuRmlsZVJlYWRlcjtcblxuXHRcdFx0XHRpZiAoIXN1cHBvcnRlZCB8fCAhdGhpcy5maWxlcyB8fCB0aGlzLmZpbGVzLmxlbmd0aCA9PSAwKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1x0Ly8gY29udGludWUgdG8gbmV4dCBpbnB1dCBlbGVtZW50XG5cblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmZpbGVzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cXVldWUucHVzaCh7XG5cdFx0XHRcdFx0XHRmaWxlOiB0aGlzLmZpbGVzW2ldLFxuXHRcdFx0XHRcdFx0aW5wdXRFbGVtOiB0aGlzLFxuXHRcdFx0XHRcdFx0aW5zdGFuY2VDb25maWc6ICQuZXh0ZW5kKHt9LCBjb25maWcpXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRwYXJzZU5leHRGaWxlKCk7XHQvLyBiZWdpbiBwYXJzaW5nXG5cdFx0XHRyZXR1cm4gdGhpcztcdFx0Ly8gbWFpbnRhaW5zIGNoYWluYWJpbGl0eVxuXG5cblx0XHRcdGZ1bmN0aW9uIHBhcnNlTmV4dEZpbGUoKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAocXVldWUubGVuZ3RoID09IDApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmNvbXBsZXRlKSlcblx0XHRcdFx0XHRcdG9wdGlvbnMuY29tcGxldGUoKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR2YXIgZiA9IHF1ZXVlWzBdO1xuXG5cdFx0XHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuYmVmb3JlKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciByZXR1cm5lZCA9IG9wdGlvbnMuYmVmb3JlKGYuZmlsZSwgZi5pbnB1dEVsZW0pO1xuXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiByZXR1cm5lZCA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKHJldHVybmVkLmFjdGlvbiA9PSBcImFib3J0XCIpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGVycm9yKFwiQWJvcnRFcnJvclwiLCBmLmZpbGUsIGYuaW5wdXRFbGVtLCByZXR1cm5lZC5yZWFzb24pO1xuXHRcdFx0XHRcdFx0XHRyZXR1cm47XHQvLyBBYm9ydHMgYWxsIHF1ZXVlZCBmaWxlcyBpbW1lZGlhdGVseVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAocmV0dXJuZWQuYWN0aW9uID09IFwic2tpcFwiKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcdC8vIHBhcnNlIHRoZSBuZXh0IGZpbGUgaW4gdGhlIHF1ZXVlLCBpZiBhbnlcblx0XHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIHJldHVybmVkLmNvbmZpZyA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0XHRcdGYuaW5zdGFuY2VDb25maWcgPSAkLmV4dGVuZChmLmluc3RhbmNlQ29uZmlnLCByZXR1cm5lZC5jb25maWcpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChyZXR1cm5lZCA9PSBcInNraXBcIilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWxlQ29tcGxldGUoKTtcdC8vIHBhcnNlIHRoZSBuZXh0IGZpbGUgaW4gdGhlIHF1ZXVlLCBpZiBhbnlcblx0XHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBXcmFwIHVwIHRoZSB1c2VyJ3MgY29tcGxldGUgY2FsbGJhY2ssIGlmIGFueSwgc28gdGhhdCBvdXJzIGFsc28gZ2V0cyBleGVjdXRlZFxuXHRcdFx0XHR2YXIgdXNlckNvbXBsZXRlRnVuYyA9IGYuaW5zdGFuY2VDb25maWcuY29tcGxldGU7XG5cdFx0XHRcdGYuaW5zdGFuY2VDb25maWcuY29tcGxldGUgPSBmdW5jdGlvbihyZXN1bHRzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGlzRnVuY3Rpb24odXNlckNvbXBsZXRlRnVuYykpXG5cdFx0XHRcdFx0XHR1c2VyQ29tcGxldGVGdW5jKHJlc3VsdHMsIGYuZmlsZSwgZi5pbnB1dEVsZW0pO1xuXHRcdFx0XHRcdGZpbGVDb21wbGV0ZSgpO1xuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdFBhcGEucGFyc2UoZi5maWxlLCBmLmluc3RhbmNlQ29uZmlnKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZXJyb3IobmFtZSwgZmlsZSwgZWxlbSwgcmVhc29uKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihvcHRpb25zLmVycm9yKSlcblx0XHRcdFx0XHRvcHRpb25zLmVycm9yKHtuYW1lOiBuYW1lfSwgZmlsZSwgZWxlbSwgcmVhc29uKTtcblx0XHRcdH1cblxuXHRcdFx0ZnVuY3Rpb24gZmlsZUNvbXBsZXRlKClcblx0XHRcdHtcblx0XHRcdFx0cXVldWUuc3BsaWNlKDAsIDEpO1xuXHRcdFx0XHRwYXJzZU5leHRGaWxlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblxuXHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdHtcblx0XHRnbG9iYWwub25tZXNzYWdlID0gd29ya2VyVGhyZWFkUmVjZWl2ZWRNZXNzYWdlO1xuXHR9XG5cdGVsc2UgaWYgKFBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdHtcblx0XHRBVVRPX1NDUklQVF9QQVRIID0gZ2V0U2NyaXB0UGF0aCgpO1xuXG5cdFx0Ly8gQ2hlY2sgaWYgdGhlIHNjcmlwdCB3YXMgbG9hZGVkIHN5bmNocm9ub3VzbHlcblx0XHRpZiAoIWRvY3VtZW50LmJvZHkpXG5cdFx0e1xuXHRcdFx0Ly8gQm9keSBkb2Vzbid0IGV4aXN0IHlldCwgbXVzdCBiZSBzeW5jaHJvbm91c1xuXHRcdFx0TE9BREVEX1NZTkMgPSB0cnVlO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0TE9BREVEX1NZTkMgPSB0cnVlO1xuXHRcdFx0fSwgdHJ1ZSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblx0ZnVuY3Rpb24gQ3N2VG9Kc29uKF9pbnB1dCwgX2NvbmZpZylcblx0e1xuXHRcdF9jb25maWcgPSBfY29uZmlnIHx8IHt9O1xuXG5cdFx0aWYgKF9jb25maWcud29ya2VyICYmIFBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdFx0e1xuXHRcdFx0dmFyIHcgPSBuZXdXb3JrZXIoKTtcblxuXHRcdFx0dy51c2VyU3RlcCA9IF9jb25maWcuc3RlcDtcblx0XHRcdHcudXNlckNodW5rID0gX2NvbmZpZy5jaHVuaztcblx0XHRcdHcudXNlckNvbXBsZXRlID0gX2NvbmZpZy5jb21wbGV0ZTtcblx0XHRcdHcudXNlckVycm9yID0gX2NvbmZpZy5lcnJvcjtcblxuXHRcdFx0X2NvbmZpZy5zdGVwID0gaXNGdW5jdGlvbihfY29uZmlnLnN0ZXApO1xuXHRcdFx0X2NvbmZpZy5jaHVuayA9IGlzRnVuY3Rpb24oX2NvbmZpZy5jaHVuayk7XG5cdFx0XHRfY29uZmlnLmNvbXBsZXRlID0gaXNGdW5jdGlvbihfY29uZmlnLmNvbXBsZXRlKTtcblx0XHRcdF9jb25maWcuZXJyb3IgPSBpc0Z1bmN0aW9uKF9jb25maWcuZXJyb3IpO1xuXHRcdFx0ZGVsZXRlIF9jb25maWcud29ya2VyO1x0Ly8gcHJldmVudCBpbmZpbml0ZSBsb29wXG5cblx0XHRcdHcucG9zdE1lc3NhZ2Uoe1xuXHRcdFx0XHRpbnB1dDogX2lucHV0LFxuXHRcdFx0XHRjb25maWc6IF9jb25maWcsXG5cdFx0XHRcdHdvcmtlcklkOiB3LmlkXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdHZhciBzdHJlYW1lciA9IG51bGw7XG5cdFx0aWYgKHR5cGVvZiBfaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdGlmIChfY29uZmlnLmRvd25sb2FkKVxuXHRcdFx0XHRzdHJlYW1lciA9IG5ldyBOZXR3b3JrU3RyZWFtZXIoX2NvbmZpZyk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHN0cmVhbWVyID0gbmV3IFN0cmluZ1N0cmVhbWVyKF9jb25maWcpO1xuXHRcdH1cblx0XHRlbHNlIGlmICgoZ2xvYmFsLkZpbGUgJiYgX2lucHV0IGluc3RhbmNlb2YgRmlsZSkgfHwgX2lucHV0IGluc3RhbmNlb2YgT2JqZWN0KVx0Ly8gLi4uU2FmYXJpLiAoc2VlIGlzc3VlICMxMDYpXG5cdFx0XHRzdHJlYW1lciA9IG5ldyBGaWxlU3RyZWFtZXIoX2NvbmZpZyk7XG5cblx0XHRyZXR1cm4gc3RyZWFtZXIuc3RyZWFtKF9pbnB1dCk7XG5cdH1cblxuXG5cblxuXG5cblx0ZnVuY3Rpb24gSnNvblRvQ3N2KF9pbnB1dCwgX2NvbmZpZylcblx0e1xuXHRcdHZhciBfb3V0cHV0ID0gXCJcIjtcblx0XHR2YXIgX2ZpZWxkcyA9IFtdO1xuXG5cdFx0Ly8gRGVmYXVsdCBjb25maWd1cmF0aW9uXG5cblx0XHQvKiogd2hldGhlciB0byBzdXJyb3VuZCBldmVyeSBkYXR1bSB3aXRoIHF1b3RlcyAqL1xuXHRcdHZhciBfcXVvdGVzID0gZmFsc2U7XG5cblx0XHQvKiogZGVsaW1pdGluZyBjaGFyYWN0ZXIgKi9cblx0XHR2YXIgX2RlbGltaXRlciA9IFwiLFwiO1xuXG5cdFx0LyoqIG5ld2xpbmUgY2hhcmFjdGVyKHMpICovXG5cdFx0dmFyIF9uZXdsaW5lID0gXCJcXHJcXG5cIjtcblxuXHRcdHVucGFja0NvbmZpZygpO1xuXG5cdFx0aWYgKHR5cGVvZiBfaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdFx0X2lucHV0ID0gSlNPTi5wYXJzZShfaW5wdXQpO1xuXG5cdFx0aWYgKF9pbnB1dCBpbnN0YW5jZW9mIEFycmF5KVxuXHRcdHtcblx0XHRcdGlmICghX2lucHV0Lmxlbmd0aCB8fCBfaW5wdXRbMF0gaW5zdGFuY2VvZiBBcnJheSlcblx0XHRcdFx0cmV0dXJuIHNlcmlhbGl6ZShudWxsLCBfaW5wdXQpO1xuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIF9pbnB1dFswXSA9PT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybiBzZXJpYWxpemUob2JqZWN0S2V5cyhfaW5wdXRbMF0pLCBfaW5wdXQpO1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlb2YgX2lucHV0ID09PSAnb2JqZWN0Jylcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIF9pbnB1dC5kYXRhID09PSAnc3RyaW5nJylcblx0XHRcdFx0X2lucHV0LmRhdGEgPSBKU09OLnBhcnNlKF9pbnB1dC5kYXRhKTtcblxuXHRcdFx0aWYgKF9pbnB1dC5kYXRhIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICghX2lucHV0LmZpZWxkcylcblx0XHRcdFx0XHRfaW5wdXQuZmllbGRzID0gX2lucHV0LmRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHRcdFx0XHRcdFx0PyBfaW5wdXQuZmllbGRzXG5cdFx0XHRcdFx0XHRcdFx0XHQ6IG9iamVjdEtleXMoX2lucHV0LmRhdGFbMF0pO1xuXG5cdFx0XHRcdGlmICghKF9pbnB1dC5kYXRhWzBdIGluc3RhbmNlb2YgQXJyYXkpICYmIHR5cGVvZiBfaW5wdXQuZGF0YVswXSAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdFx0X2lucHV0LmRhdGEgPSBbX2lucHV0LmRhdGFdO1x0Ly8gaGFuZGxlcyBpbnB1dCBsaWtlIFsxLDIsM10gb3IgW1wiYXNkZlwiXVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc2VyaWFsaXplKF9pbnB1dC5maWVsZHMgfHwgW10sIF9pbnB1dC5kYXRhIHx8IFtdKTtcblx0XHR9XG5cblx0XHQvLyBEZWZhdWx0IChhbnkgdmFsaWQgcGF0aHMgc2hvdWxkIHJldHVybiBiZWZvcmUgdGhpcylcblx0XHR0aHJvdyBcImV4Y2VwdGlvbjogVW5hYmxlIHRvIHNlcmlhbGl6ZSB1bnJlY29nbml6ZWQgaW5wdXRcIjtcblxuXG5cdFx0ZnVuY3Rpb24gdW5wYWNrQ29uZmlnKClcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIF9jb25maWcgIT09ICdvYmplY3QnKVxuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdGlmICh0eXBlb2YgX2NvbmZpZy5kZWxpbWl0ZXIgPT09ICdzdHJpbmcnXG5cdFx0XHRcdCYmIF9jb25maWcuZGVsaW1pdGVyLmxlbmd0aCA9PSAxXG5cdFx0XHRcdCYmIFBhcGEuQkFEX0RFTElNSVRFUlMuaW5kZXhPZihfY29uZmlnLmRlbGltaXRlcikgPT0gLTEpXG5cdFx0XHR7XG5cdFx0XHRcdF9kZWxpbWl0ZXIgPSBfY29uZmlnLmRlbGltaXRlcjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLnF1b3RlcyA9PT0gJ2Jvb2xlYW4nXG5cdFx0XHRcdHx8IF9jb25maWcucXVvdGVzIGluc3RhbmNlb2YgQXJyYXkpXG5cdFx0XHRcdF9xdW90ZXMgPSBfY29uZmlnLnF1b3RlcztcblxuXHRcdFx0aWYgKHR5cGVvZiBfY29uZmlnLm5ld2xpbmUgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRfbmV3bGluZSA9IF9jb25maWcubmV3bGluZTtcblx0XHR9XG5cblxuXHRcdC8qKiBUdXJucyBhbiBvYmplY3QncyBrZXlzIGludG8gYW4gYXJyYXkgKi9cblx0XHRmdW5jdGlvbiBvYmplY3RLZXlzKG9iailcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcpXG5cdFx0XHRcdHJldHVybiBbXTtcblx0XHRcdHZhciBrZXlzID0gW107XG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKVxuXHRcdFx0XHRrZXlzLnB1c2goa2V5KTtcblx0XHRcdHJldHVybiBrZXlzO1xuXHRcdH1cblxuXHRcdC8qKiBUaGUgZG91YmxlIGZvciBsb29wIHRoYXQgaXRlcmF0ZXMgdGhlIGRhdGEgYW5kIHdyaXRlcyBvdXQgYSBDU1Ygc3RyaW5nIGluY2x1ZGluZyBoZWFkZXIgcm93ICovXG5cdFx0ZnVuY3Rpb24gc2VyaWFsaXplKGZpZWxkcywgZGF0YSlcblx0XHR7XG5cdFx0XHR2YXIgY3N2ID0gXCJcIjtcblxuXHRcdFx0aWYgKHR5cGVvZiBmaWVsZHMgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRmaWVsZHMgPSBKU09OLnBhcnNlKGZpZWxkcyk7XG5cdFx0XHRpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcblxuXHRcdFx0dmFyIGhhc0hlYWRlciA9IGZpZWxkcyBpbnN0YW5jZW9mIEFycmF5ICYmIGZpZWxkcy5sZW5ndGggPiAwO1xuXHRcdFx0dmFyIGRhdGFLZXllZEJ5RmllbGQgPSAhKGRhdGFbMF0gaW5zdGFuY2VvZiBBcnJheSk7XG5cblx0XHRcdC8vIElmIHRoZXJlIGEgaGVhZGVyIHJvdywgd3JpdGUgaXQgZmlyc3Rcblx0XHRcdGlmIChoYXNIZWFkZXIpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgZmllbGRzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGkgPiAwKVxuXHRcdFx0XHRcdFx0Y3N2ICs9IF9kZWxpbWl0ZXI7XG5cdFx0XHRcdFx0Y3N2ICs9IHNhZmUoZmllbGRzW2ldLCBpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoZGF0YS5sZW5ndGggPiAwKVxuXHRcdFx0XHRcdGNzdiArPSBfbmV3bGluZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gVGhlbiB3cml0ZSBvdXQgdGhlIGRhdGFcblx0XHRcdGZvciAodmFyIHJvdyA9IDA7IHJvdyA8IGRhdGEubGVuZ3RoOyByb3crKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIG1heENvbCA9IGhhc0hlYWRlciA/IGZpZWxkcy5sZW5ndGggOiBkYXRhW3Jvd10ubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAodmFyIGNvbCA9IDA7IGNvbCA8IG1heENvbDsgY29sKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoY29sID4gMClcblx0XHRcdFx0XHRcdGNzdiArPSBfZGVsaW1pdGVyO1xuXHRcdFx0XHRcdHZhciBjb2xJZHggPSBoYXNIZWFkZXIgJiYgZGF0YUtleWVkQnlGaWVsZCA/IGZpZWxkc1tjb2xdIDogY29sO1xuXHRcdFx0XHRcdGNzdiArPSBzYWZlKGRhdGFbcm93XVtjb2xJZHhdLCBjb2wpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKHJvdyA8IGRhdGEubGVuZ3RoIC0gMSlcblx0XHRcdFx0XHRjc3YgKz0gX25ld2xpbmU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBjc3Y7XG5cdFx0fVxuXG5cdFx0LyoqIEVuY2xvc2VzIGEgdmFsdWUgYXJvdW5kIHF1b3RlcyBpZiBuZWVkZWQgKG1ha2VzIGEgdmFsdWUgc2FmZSBmb3IgQ1NWIGluc2VydGlvbikgKi9cblx0XHRmdW5jdGlvbiBzYWZlKHN0ciwgY29sKVxuXHRcdHtcblx0XHRcdGlmICh0eXBlb2Ygc3RyID09PSBcInVuZGVmaW5lZFwiIHx8IHN0ciA9PT0gbnVsbClcblx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cblx0XHRcdHN0ciA9IHN0ci50b1N0cmluZygpLnJlcGxhY2UoL1wiL2csICdcIlwiJyk7XG5cblx0XHRcdHZhciBuZWVkc1F1b3RlcyA9ICh0eXBlb2YgX3F1b3RlcyA9PT0gJ2Jvb2xlYW4nICYmIF9xdW90ZXMpXG5cdFx0XHRcdFx0XHRcdHx8IChfcXVvdGVzIGluc3RhbmNlb2YgQXJyYXkgJiYgX3F1b3Rlc1tjb2xdKVxuXHRcdFx0XHRcdFx0XHR8fCBoYXNBbnkoc3RyLCBQYXBhLkJBRF9ERUxJTUlURVJTKVxuXHRcdFx0XHRcdFx0XHR8fCBzdHIuaW5kZXhPZihfZGVsaW1pdGVyKSA+IC0xXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoMCkgPT0gJyAnXG5cdFx0XHRcdFx0XHRcdHx8IHN0ci5jaGFyQXQoc3RyLmxlbmd0aCAtIDEpID09ICcgJztcblxuXHRcdFx0cmV0dXJuIG5lZWRzUXVvdGVzID8gJ1wiJyArIHN0ciArICdcIicgOiBzdHI7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gaGFzQW55KHN0ciwgc3Vic3RyaW5ncylcblx0XHR7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN1YnN0cmluZ3MubGVuZ3RoOyBpKyspXG5cdFx0XHRcdGlmIChzdHIuaW5kZXhPZihzdWJzdHJpbmdzW2ldKSA+IC0xKVxuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fVxuXG5cdC8qKiBDaHVua1N0cmVhbWVyIGlzIHRoZSBiYXNlIHByb3RvdHlwZSBmb3IgdmFyaW91cyBzdHJlYW1lciBpbXBsZW1lbnRhdGlvbnMuICovXG5cdGZ1bmN0aW9uIENodW5rU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0dGhpcy5faGFuZGxlID0gbnVsbDtcblx0XHR0aGlzLl9wYXVzZWQgPSBmYWxzZTtcblx0XHR0aGlzLl9maW5pc2hlZCA9IGZhbHNlO1xuXHRcdHRoaXMuX2lucHV0ID0gbnVsbDtcblx0XHR0aGlzLl9iYXNlSW5kZXggPSAwO1xuXHRcdHRoaXMuX3BhcnRpYWxMaW5lID0gXCJcIjtcblx0XHR0aGlzLl9yb3dDb3VudCA9IDA7XG5cdFx0dGhpcy5fc3RhcnQgPSAwO1xuXHRcdHRoaXMuX25leHRDaHVuayA9IG51bGw7XG5cdFx0dGhpcy5pc0ZpcnN0Q2h1bmsgPSB0cnVlO1xuXHRcdHRoaXMuX2NvbXBsZXRlUmVzdWx0cyA9IHtcblx0XHRcdGRhdGE6IFtdLFxuXHRcdFx0ZXJyb3JzOiBbXSxcblx0XHRcdG1ldGE6IHt9XG5cdFx0fTtcblx0XHRyZXBsYWNlQ29uZmlnLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHRoaXMucGFyc2VDaHVuayA9IGZ1bmN0aW9uKGNodW5rKVxuXHRcdHtcblx0XHRcdC8vIEZpcnN0IGNodW5rIHByZS1wcm9jZXNzaW5nXG5cdFx0XHRpZiAodGhpcy5pc0ZpcnN0Q2h1bmsgJiYgaXNGdW5jdGlvbih0aGlzLl9jb25maWcuYmVmb3JlRmlyc3RDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBtb2RpZmllZENodW5rID0gdGhpcy5fY29uZmlnLmJlZm9yZUZpcnN0Q2h1bmsoY2h1bmspO1xuXHRcdFx0XHRpZiAobW9kaWZpZWRDaHVuayAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHRcdGNodW5rID0gbW9kaWZpZWRDaHVuaztcblx0XHRcdH1cblx0XHRcdHRoaXMuaXNGaXJzdENodW5rID0gZmFsc2U7XG5cblx0XHRcdC8vIFJlam9pbiB0aGUgbGluZSB3ZSBsaWtlbHkganVzdCBzcGxpdCBpbiB0d28gYnkgY2h1bmtpbmcgdGhlIGZpbGVcblx0XHRcdHZhciBhZ2dyZWdhdGUgPSB0aGlzLl9wYXJ0aWFsTGluZSArIGNodW5rO1xuXHRcdFx0dGhpcy5fcGFydGlhbExpbmUgPSBcIlwiO1xuXG5cdFx0XHR2YXIgcmVzdWx0cyA9IHRoaXMuX2hhbmRsZS5wYXJzZShhZ2dyZWdhdGUsIHRoaXMuX2Jhc2VJbmRleCwgIXRoaXMuX2ZpbmlzaGVkKTtcblx0XHRcdFxuXHRcdFx0aWYgKHRoaXMuX2hhbmRsZS5wYXVzZWQoKSB8fCB0aGlzLl9oYW5kbGUuYWJvcnRlZCgpKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcblx0XHRcdHZhciBsYXN0SW5kZXggPSByZXN1bHRzLm1ldGEuY3Vyc29yO1xuXHRcdFx0XG5cdFx0XHRpZiAoIXRoaXMuX2ZpbmlzaGVkKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9wYXJ0aWFsTGluZSA9IGFnZ3JlZ2F0ZS5zdWJzdHJpbmcobGFzdEluZGV4IC0gdGhpcy5fYmFzZUluZGV4KTtcblx0XHRcdFx0dGhpcy5fYmFzZUluZGV4ID0gbGFzdEluZGV4O1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAocmVzdWx0cyAmJiByZXN1bHRzLmRhdGEpXG5cdFx0XHRcdHRoaXMuX3Jvd0NvdW50ICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cblx0XHRcdHZhciBmaW5pc2hlZEluY2x1ZGluZ1ByZXZpZXcgPSB0aGlzLl9maW5pc2hlZCB8fCAodGhpcy5fY29uZmlnLnByZXZpZXcgJiYgdGhpcy5fcm93Q291bnQgPj0gdGhpcy5fY29uZmlnLnByZXZpZXcpO1xuXG5cdFx0XHRpZiAoSVNfUEFQQV9XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0ZmluaXNoZWQ6IGZpbmlzaGVkSW5jbHVkaW5nUHJldmlld1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fY29uZmlnLmNodW5rKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY29uZmlnLmNodW5rKHJlc3VsdHMsIHRoaXMuX2hhbmRsZSk7XG5cdFx0XHRcdGlmICh0aGlzLl9wYXVzZWQpXG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRyZXN1bHRzID0gdW5kZWZpbmVkO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMgPSB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5fY29uZmlnLnN0ZXAgJiYgIXRoaXMuX2NvbmZpZy5jaHVuaykge1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZGF0YSA9IHRoaXMuX2NvbXBsZXRlUmVzdWx0cy5kYXRhLmNvbmNhdChyZXN1bHRzLmRhdGEpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMuZXJyb3JzID0gdGhpcy5fY29tcGxldGVSZXN1bHRzLmVycm9ycy5jb25jYXQocmVzdWx0cy5lcnJvcnMpO1xuXHRcdFx0XHR0aGlzLl9jb21wbGV0ZVJlc3VsdHMubWV0YSA9IHJlc3VsdHMubWV0YTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiBpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5jb21wbGV0ZSkgJiYgKCFyZXN1bHRzIHx8ICFyZXN1bHRzLm1ldGEuYWJvcnRlZCkpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5jb21wbGV0ZSh0aGlzLl9jb21wbGV0ZVJlc3VsdHMpO1xuXG5cdFx0XHRpZiAoIWZpbmlzaGVkSW5jbHVkaW5nUHJldmlldyAmJiAoIXJlc3VsdHMgfHwgIXJlc3VsdHMubWV0YS5wYXVzZWQpKVxuXHRcdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcblxuXHRcdFx0cmV0dXJuIHJlc3VsdHM7XG5cdFx0fTtcblxuXHRcdHRoaXMuX3NlbmRFcnJvciA9IGZ1bmN0aW9uKGVycm9yKVxuXHRcdHtcblx0XHRcdGlmIChpc0Z1bmN0aW9uKHRoaXMuX2NvbmZpZy5lcnJvcikpXG5cdFx0XHRcdHRoaXMuX2NvbmZpZy5lcnJvcihlcnJvcik7XG5cdFx0XHRlbHNlIGlmIChJU19QQVBBX1dPUktFUiAmJiB0aGlzLl9jb25maWcuZXJyb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdFx0d29ya2VySWQ6IFBhcGEuV09SS0VSX0lELFxuXHRcdFx0XHRcdGVycm9yOiBlcnJvcixcblx0XHRcdFx0XHRmaW5pc2hlZDogZmFsc2Vcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdGZ1bmN0aW9uIHJlcGxhY2VDb25maWcoY29uZmlnKVxuXHRcdHtcblx0XHRcdC8vIERlZXAtY29weSB0aGUgY29uZmlnIHNvIHdlIGNhbiBlZGl0IGl0XG5cdFx0XHR2YXIgY29uZmlnQ29weSA9IGNvcHkoY29uZmlnKTtcblx0XHRcdGNvbmZpZ0NvcHkuY2h1bmtTaXplID0gcGFyc2VJbnQoY29uZmlnQ29weS5jaHVua1NpemUpO1x0Ly8gcGFyc2VJbnQgVkVSWSBpbXBvcnRhbnQgc28gd2UgZG9uJ3QgY29uY2F0ZW5hdGUgc3RyaW5ncyFcblx0XHRcdGlmICghY29uZmlnLnN0ZXAgJiYgIWNvbmZpZy5jaHVuaylcblx0XHRcdFx0Y29uZmlnQ29weS5jaHVua1NpemUgPSBudWxsOyAgLy8gZGlzYWJsZSBSYW5nZSBoZWFkZXIgaWYgbm90IHN0cmVhbWluZzsgYmFkIHZhbHVlcyBicmVhayBJSVMgLSBzZWUgaXNzdWUgIzE5NlxuXHRcdFx0dGhpcy5faGFuZGxlID0gbmV3IFBhcnNlckhhbmRsZShjb25maWdDb3B5KTtcblx0XHRcdHRoaXMuX2hhbmRsZS5zdHJlYW1lciA9IHRoaXM7XG5cdFx0XHR0aGlzLl9jb25maWcgPSBjb25maWdDb3B5O1x0Ly8gcGVyc2lzdCB0aGUgY29weSB0byB0aGUgY2FsbGVyXG5cdFx0fVxuXHR9XG5cblxuXHRmdW5jdGlvbiBOZXR3b3JrU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdGlmICghY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdGNvbmZpZy5jaHVua1NpemUgPSBQYXBhLlJlbW90ZUNodW5rU2l6ZTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciB4aHI7XG5cblx0XHRpZiAoSVNfV09SS0VSKVxuXHRcdHtcblx0XHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0XHRcdHRoaXMuX2NodW5rTG9hZGVkKCk7XG5cdFx0XHR9O1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLl9yZWFkQ2h1bmsoKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbih1cmwpXG5cdFx0e1xuXHRcdFx0dGhpcy5faW5wdXQgPSB1cmw7XG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcdC8vIFN0YXJ0cyBzdHJlYW1pbmdcblx0XHR9O1xuXG5cdFx0dGhpcy5fcmVhZENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLl9maW5pc2hlZClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5fY2h1bmtMb2FkZWQoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblx0XHRcdFxuXHRcdFx0aWYgKCFJU19XT1JLRVIpXG5cdFx0XHR7XG5cdFx0XHRcdHhoci5vbmxvYWQgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtMb2FkZWQsIHRoaXMpO1xuXHRcdFx0XHR4aHIub25lcnJvciA9IGJpbmRGdW5jdGlvbih0aGlzLl9jaHVua0Vycm9yLCB0aGlzKTtcblx0XHRcdH1cblxuXHRcdFx0eGhyLm9wZW4oXCJHRVRcIiwgdGhpcy5faW5wdXQsICFJU19XT1JLRVIpO1xuXHRcdFx0XG5cdFx0XHRpZiAodGhpcy5fY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGVuZCA9IHRoaXMuX3N0YXJ0ICsgdGhpcy5fY29uZmlnLmNodW5rU2l6ZSAtIDE7XHQvLyBtaW51cyBvbmUgYmVjYXVzZSBieXRlIHJhbmdlIGlzIGluY2x1c2l2ZVxuXHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIlJhbmdlXCIsIFwiYnl0ZXM9XCIrdGhpcy5fc3RhcnQrXCItXCIrZW5kKTtcblx0XHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJJZi1Ob25lLU1hdGNoXCIsIFwid2Via2l0LW5vLWNhY2hlXCIpOyAvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9ODI2NzJcblx0XHRcdH1cblxuXHRcdFx0dHJ5IHtcblx0XHRcdFx0eGhyLnNlbmQoKTtcblx0XHRcdH1cblx0XHRcdGNhdGNoIChlcnIpIHtcblx0XHRcdFx0dGhpcy5fY2h1bmtFcnJvcihlcnIubWVzc2FnZSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChJU19XT1JLRVIgJiYgeGhyLnN0YXR1cyA9PSAwKVxuXHRcdFx0XHR0aGlzLl9jaHVua0Vycm9yKCk7XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHRoaXMuX3N0YXJ0ICs9IHRoaXMuX2NvbmZpZy5jaHVua1NpemU7XG5cdFx0fVxuXG5cdFx0dGhpcy5fY2h1bmtMb2FkZWQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0aWYgKHhoci5yZWFkeVN0YXRlICE9IDQpXG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0aWYgKHhoci5zdGF0dXMgPCAyMDAgfHwgeGhyLnN0YXR1cyA+PSA0MDApXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuX2NodW5rRXJyb3IoKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLl9maW5pc2hlZCA9ICF0aGlzLl9jb25maWcuY2h1bmtTaXplIHx8IHRoaXMuX3N0YXJ0ID4gZ2V0RmlsZVNpemUoeGhyKTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayh4aHIucmVzcG9uc2VUZXh0KTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0Vycm9yID0gZnVuY3Rpb24oZXJyb3JNZXNzYWdlKVxuXHRcdHtcblx0XHRcdHZhciBlcnJvclRleHQgPSB4aHIuc3RhdHVzVGV4dCB8fCBlcnJvck1lc3NhZ2U7XG5cdFx0XHR0aGlzLl9zZW5kRXJyb3IoZXJyb3JUZXh0KTtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBnZXRGaWxlU2l6ZSh4aHIpXG5cdFx0e1xuXHRcdFx0dmFyIGNvbnRlbnRSYW5nZSA9IHhoci5nZXRSZXNwb25zZUhlYWRlcihcIkNvbnRlbnQtUmFuZ2VcIik7XG5cdFx0XHRyZXR1cm4gcGFyc2VJbnQoY29udGVudFJhbmdlLnN1YnN0cihjb250ZW50UmFuZ2UubGFzdEluZGV4T2YoXCIvXCIpICsgMSkpO1xuXHRcdH1cblx0fVxuXHROZXR3b3JrU3RyZWFtZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShDaHVua1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdE5ldHdvcmtTdHJlYW1lci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBOZXR3b3JrU3RyZWFtZXI7XG5cblxuXHRmdW5jdGlvbiBGaWxlU3RyZWFtZXIoY29uZmlnKVxuXHR7XG5cdFx0Y29uZmlnID0gY29uZmlnIHx8IHt9O1xuXHRcdGlmICghY29uZmlnLmNodW5rU2l6ZSlcblx0XHRcdGNvbmZpZy5jaHVua1NpemUgPSBQYXBhLkxvY2FsQ2h1bmtTaXplO1xuXHRcdENodW5rU3RyZWFtZXIuY2FsbCh0aGlzLCBjb25maWcpO1xuXG5cdFx0dmFyIHJlYWRlciwgc2xpY2U7XG5cblx0XHQvLyBGaWxlUmVhZGVyIGlzIGJldHRlciB0aGFuIEZpbGVSZWFkZXJTeW5jIChldmVuIGluIHdvcmtlcikgLSBzZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3EvMjQ3MDg2NDkvMTA0ODg2MlxuXHRcdC8vIEJ1dCBGaXJlZm94IGlzIGEgcGlsbCwgdG9vIC0gc2VlIGlzc3VlICM3NjogaHR0cHM6Ly9naXRodWIuY29tL21ob2x0L1BhcGFQYXJzZS9pc3N1ZXMvNzZcblx0XHR2YXIgdXNpbmdBc3luY1JlYWRlciA9IHR5cGVvZiBGaWxlUmVhZGVyICE9PSAndW5kZWZpbmVkJztcdC8vIFNhZmFyaSBkb2Vzbid0IGNvbnNpZGVyIGl0IGEgZnVuY3Rpb24gLSBzZWUgaXNzdWUgIzEwNVxuXG5cdFx0dGhpcy5zdHJlYW0gPSBmdW5jdGlvbihmaWxlKVxuXHRcdHtcblx0XHRcdHRoaXMuX2lucHV0ID0gZmlsZTtcblx0XHRcdHNsaWNlID0gZmlsZS5zbGljZSB8fCBmaWxlLndlYmtpdFNsaWNlIHx8IGZpbGUubW96U2xpY2U7XG5cblx0XHRcdGlmICh1c2luZ0FzeW5jUmVhZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRyZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1x0XHQvLyBQcmVmZXJyZWQgbWV0aG9kIG9mIHJlYWRpbmcgZmlsZXMsIGV2ZW4gaW4gd29ya2Vyc1xuXHRcdFx0XHRyZWFkZXIub25sb2FkID0gYmluZEZ1bmN0aW9uKHRoaXMuX2NodW5rTG9hZGVkLCB0aGlzKTtcblx0XHRcdFx0cmVhZGVyLm9uZXJyb3IgPSBiaW5kRnVuY3Rpb24odGhpcy5fY2h1bmtFcnJvciwgdGhpcyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHRcdHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyU3luYygpO1x0Ly8gSGFjayBmb3IgcnVubmluZyBpbiBhIHdlYiB3b3JrZXIgaW4gRmlyZWZveFxuXG5cdFx0XHR0aGlzLl9uZXh0Q2h1bmsoKTtcdC8vIFN0YXJ0cyBzdHJlYW1pbmdcblx0XHR9O1xuXG5cdFx0dGhpcy5fbmV4dENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdGlmICghdGhpcy5fZmluaXNoZWQgJiYgKCF0aGlzLl9jb25maWcucHJldmlldyB8fCB0aGlzLl9yb3dDb3VudCA8IHRoaXMuX2NvbmZpZy5wcmV2aWV3KSlcblx0XHRcdFx0dGhpcy5fcmVhZENodW5rKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5fcmVhZENodW5rID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHZhciBpbnB1dCA9IHRoaXMuX2lucHV0O1xuXHRcdFx0aWYgKHRoaXMuX2NvbmZpZy5jaHVua1NpemUpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBlbmQgPSBNYXRoLm1pbih0aGlzLl9zdGFydCArIHRoaXMuX2NvbmZpZy5jaHVua1NpemUsIHRoaXMuX2lucHV0LnNpemUpO1xuXHRcdFx0XHRpbnB1dCA9IHNsaWNlLmNhbGwoaW5wdXQsIHRoaXMuX3N0YXJ0LCBlbmQpO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHR4dCA9IHJlYWRlci5yZWFkQXNUZXh0KGlucHV0LCB0aGlzLl9jb25maWcuZW5jb2RpbmcpO1xuXHRcdFx0aWYgKCF1c2luZ0FzeW5jUmVhZGVyKVxuXHRcdFx0XHR0aGlzLl9jaHVua0xvYWRlZCh7IHRhcmdldDogeyByZXN1bHQ6IHR4dCB9IH0pO1x0Ly8gbWltaWMgdGhlIGFzeW5jIHNpZ25hdHVyZVxuXHRcdH1cblxuXHRcdHRoaXMuX2NodW5rTG9hZGVkID0gZnVuY3Rpb24oZXZlbnQpXG5cdFx0e1xuXHRcdFx0Ly8gVmVyeSBpbXBvcnRhbnQgdG8gaW5jcmVtZW50IHN0YXJ0IGVhY2ggdGltZSBiZWZvcmUgaGFuZGxpbmcgcmVzdWx0c1xuXHRcdFx0dGhpcy5fc3RhcnQgKz0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXRoaXMuX2NvbmZpZy5jaHVua1NpemUgfHwgdGhpcy5fc3RhcnQgPj0gdGhpcy5faW5wdXQuc2l6ZTtcblx0XHRcdHRoaXMucGFyc2VDaHVuayhldmVudC50YXJnZXQucmVzdWx0KTtcblx0XHR9XG5cblx0XHR0aGlzLl9jaHVua0Vycm9yID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHRoaXMuX3NlbmRFcnJvcihyZWFkZXIuZXJyb3IpO1xuXHRcdH1cblxuXHR9XG5cdEZpbGVTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKENodW5rU3RyZWFtZXIucHJvdG90eXBlKTtcblx0RmlsZVN0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEZpbGVTdHJlYW1lcjtcblxuXG5cdGZ1bmN0aW9uIFN0cmluZ1N0cmVhbWVyKGNvbmZpZylcblx0e1xuXHRcdGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcblx0XHRDaHVua1N0cmVhbWVyLmNhbGwodGhpcywgY29uZmlnKTtcblxuXHRcdHZhciBzdHJpbmc7XG5cdFx0dmFyIHJlbWFpbmluZztcblx0XHR0aGlzLnN0cmVhbSA9IGZ1bmN0aW9uKHMpXG5cdFx0e1xuXHRcdFx0c3RyaW5nID0gcztcblx0XHRcdHJlbWFpbmluZyA9IHM7XG5cdFx0XHRyZXR1cm4gdGhpcy5fbmV4dENodW5rKCk7XG5cdFx0fVxuXHRcdHRoaXMuX25leHRDaHVuayA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRpZiAodGhpcy5fZmluaXNoZWQpIHJldHVybjtcblx0XHRcdHZhciBzaXplID0gdGhpcy5fY29uZmlnLmNodW5rU2l6ZTtcblx0XHRcdHZhciBjaHVuayA9IHNpemUgPyByZW1haW5pbmcuc3Vic3RyKDAsIHNpemUpIDogcmVtYWluaW5nO1xuXHRcdFx0cmVtYWluaW5nID0gc2l6ZSA/IHJlbWFpbmluZy5zdWJzdHIoc2l6ZSkgOiAnJztcblx0XHRcdHRoaXMuX2ZpbmlzaGVkID0gIXJlbWFpbmluZztcblx0XHRcdHJldHVybiB0aGlzLnBhcnNlQ2h1bmsoY2h1bmspO1xuXHRcdH1cblx0fVxuXHRTdHJpbmdTdHJlYW1lci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZSk7XG5cdFN0cmluZ1N0cmVhbWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFN0cmluZ1N0cmVhbWVyO1xuXG5cblxuXHQvLyBVc2Ugb25lIFBhcnNlckhhbmRsZSBwZXIgZW50aXJlIENTViBmaWxlIG9yIHN0cmluZ1xuXHRmdW5jdGlvbiBQYXJzZXJIYW5kbGUoX2NvbmZpZylcblx0e1xuXHRcdC8vIE9uZSBnb2FsIGlzIHRvIG1pbmltaXplIHRoZSB1c2Ugb2YgcmVndWxhciBleHByZXNzaW9ucy4uLlxuXHRcdHZhciBGTE9BVCA9IC9eXFxzKi0/KFxcZCpcXC4/XFxkK3xcXGQrXFwuP1xcZCopKGVbLStdP1xcZCspP1xccyokL2k7XG5cblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIF9zdGVwQ291bnRlciA9IDA7XHQvLyBOdW1iZXIgb2YgdGltZXMgc3RlcCB3YXMgY2FsbGVkIChudW1iZXIgb2Ygcm93cyBwYXJzZWQpXG5cdFx0dmFyIF9pbnB1dDtcdFx0XHRcdC8vIFRoZSBpbnB1dCBiZWluZyBwYXJzZWRcblx0XHR2YXIgX3BhcnNlcjtcdFx0XHQvLyBUaGUgY29yZSBwYXJzZXIgYmVpbmcgdXNlZFxuXHRcdHZhciBfcGF1c2VkID0gZmFsc2U7XHQvLyBXaGV0aGVyIHdlIGFyZSBwYXVzZWQgb3Igbm90XG5cdFx0dmFyIF9hYm9ydGVkID0gZmFsc2U7ICAgLy8gV2hldGhlciB0aGUgcGFyc2VyIGhhcyBhYm9ydGVkIG9yIG5vdFxuXHRcdHZhciBfZGVsaW1pdGVyRXJyb3I7XHQvLyBUZW1wb3Jhcnkgc3RhdGUgYmV0d2VlbiBkZWxpbWl0ZXIgZGV0ZWN0aW9uIGFuZCBwcm9jZXNzaW5nIHJlc3VsdHNcblx0XHR2YXIgX2ZpZWxkcyA9IFtdO1x0XHQvLyBGaWVsZHMgYXJlIGZyb20gdGhlIGhlYWRlciByb3cgb2YgdGhlIGlucHV0LCBpZiB0aGVyZSBpcyBvbmVcblx0XHR2YXIgX3Jlc3VsdHMgPSB7XHRcdC8vIFRoZSBsYXN0IHJlc3VsdHMgcmV0dXJuZWQgZnJvbSB0aGUgcGFyc2VyXG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdGVycm9yczogW10sXG5cdFx0XHRtZXRhOiB7fVxuXHRcdH07XG5cblx0XHRpZiAoaXNGdW5jdGlvbihfY29uZmlnLnN0ZXApKVxuXHRcdHtcblx0XHRcdHZhciB1c2VyU3RlcCA9IF9jb25maWcuc3RlcDtcblx0XHRcdF9jb25maWcuc3RlcCA9IGZ1bmN0aW9uKHJlc3VsdHMpXG5cdFx0XHR7XG5cdFx0XHRcdF9yZXN1bHRzID0gcmVzdWx0cztcblxuXHRcdFx0XHRpZiAobmVlZHNIZWFkZXJSb3coKSlcblx0XHRcdFx0XHRwcm9jZXNzUmVzdWx0cygpO1xuXHRcdFx0XHRlbHNlXHQvLyBvbmx5IGNhbGwgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYWZ0ZXIgaGVhZGVyIHJvd1xuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cHJvY2Vzc1Jlc3VsdHMoKTtcblxuXHRcdFx0XHRcdC8vIEl0J3MgcG9zc2JpbGUgdGhhdCB0aGlzIGxpbmUgd2FzIGVtcHR5IGFuZCB0aGVyZSdzIG5vIHJvdyBoZXJlIGFmdGVyIGFsbFxuXHRcdFx0XHRcdGlmIChfcmVzdWx0cy5kYXRhLmxlbmd0aCA9PSAwKVxuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHRcdFx0X3N0ZXBDb3VudGVyICs9IHJlc3VsdHMuZGF0YS5sZW5ndGg7XG5cdFx0XHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfc3RlcENvdW50ZXIgPiBfY29uZmlnLnByZXZpZXcpXG5cdFx0XHRcdFx0XHRfcGFyc2VyLmFib3J0KCk7XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdFx0dXNlclN0ZXAoX3Jlc3VsdHMsIHNlbGYpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8qKlxuXHRcdCAqIFBhcnNlcyBpbnB1dC4gTW9zdCB1c2VycyB3b24ndCBuZWVkLCBhbmQgc2hvdWxkbid0IG1lc3Mgd2l0aCwgdGhlIGJhc2VJbmRleFxuXHRcdCAqIGFuZCBpZ25vcmVMYXN0Um93IHBhcmFtZXRlcnMuIFRoZXkgYXJlIHVzZWQgYnkgc3RyZWFtZXJzICh3cmFwcGVyIGZ1bmN0aW9ucylcblx0XHQgKiB3aGVuIGFuIGlucHV0IGNvbWVzIGluIG11bHRpcGxlIGNodW5rcywgbGlrZSBmcm9tIGEgZmlsZS5cblx0XHQgKi9cblx0XHR0aGlzLnBhcnNlID0gZnVuY3Rpb24oaW5wdXQsIGJhc2VJbmRleCwgaWdub3JlTGFzdFJvdylcblx0XHR7XG5cdFx0XHRpZiAoIV9jb25maWcubmV3bGluZSlcblx0XHRcdFx0X2NvbmZpZy5uZXdsaW5lID0gZ3Vlc3NMaW5lRW5kaW5ncyhpbnB1dCk7XG5cblx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IGZhbHNlO1xuXHRcdFx0aWYgKCFfY29uZmlnLmRlbGltaXRlcilcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltR3Vlc3MgPSBndWVzc0RlbGltaXRlcihpbnB1dCk7XG5cdFx0XHRcdGlmIChkZWxpbUd1ZXNzLnN1Y2Nlc3NmdWwpXG5cdFx0XHRcdFx0X2NvbmZpZy5kZWxpbWl0ZXIgPSBkZWxpbUd1ZXNzLmJlc3REZWxpbWl0ZXI7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdF9kZWxpbWl0ZXJFcnJvciA9IHRydWU7XHQvLyBhZGQgZXJyb3IgYWZ0ZXIgcGFyc2luZyAob3RoZXJ3aXNlIGl0IHdvdWxkIGJlIG92ZXJ3cml0dGVuKVxuXHRcdFx0XHRcdF9jb25maWcuZGVsaW1pdGVyID0gUGFwYS5EZWZhdWx0RGVsaW1pdGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdF9yZXN1bHRzLm1ldGEuZGVsaW1pdGVyID0gX2NvbmZpZy5kZWxpbWl0ZXI7XG5cdFx0XHR9XG5cblx0XHRcdHZhciBwYXJzZXJDb25maWcgPSBjb3B5KF9jb25maWcpO1xuXHRcdFx0aWYgKF9jb25maWcucHJldmlldyAmJiBfY29uZmlnLmhlYWRlcilcblx0XHRcdFx0cGFyc2VyQ29uZmlnLnByZXZpZXcrKztcdC8vIHRvIGNvbXBlbnNhdGUgZm9yIGhlYWRlciByb3dcblxuXHRcdFx0X2lucHV0ID0gaW5wdXQ7XG5cdFx0XHRfcGFyc2VyID0gbmV3IFBhcnNlcihwYXJzZXJDb25maWcpO1xuXHRcdFx0X3Jlc3VsdHMgPSBfcGFyc2VyLnBhcnNlKF9pbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KTtcblx0XHRcdHByb2Nlc3NSZXN1bHRzKCk7XG5cdFx0XHRyZXR1cm4gX3BhdXNlZCA/IHsgbWV0YTogeyBwYXVzZWQ6IHRydWUgfSB9IDogKF9yZXN1bHRzIHx8IHsgbWV0YTogeyBwYXVzZWQ6IGZhbHNlIH0gfSk7XG5cdFx0fTtcblxuXHRcdHRoaXMucGF1c2VkID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdHJldHVybiBfcGF1c2VkO1xuXHRcdH07XG5cblx0XHR0aGlzLnBhdXNlID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9wYXVzZWQgPSB0cnVlO1xuXHRcdFx0X3BhcnNlci5hYm9ydCgpO1xuXHRcdFx0X2lucHV0ID0gX2lucHV0LnN1YnN0cihfcGFyc2VyLmdldENoYXJJbmRleCgpKTtcblx0XHR9O1xuXG5cdFx0dGhpcy5yZXN1bWUgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0X3BhdXNlZCA9IGZhbHNlO1xuXHRcdFx0c2VsZi5zdHJlYW1lci5wYXJzZUNodW5rKF9pbnB1dCk7XG5cdFx0fTtcblxuXHRcdHRoaXMuYWJvcnRlZCA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBfYWJvcnRlZDtcblx0XHR9XG5cblx0XHR0aGlzLmFib3J0ID0gZnVuY3Rpb24oKVxuXHRcdHtcblx0XHRcdF9hYm9ydGVkID0gdHJ1ZTtcblx0XHRcdF9wYXJzZXIuYWJvcnQoKTtcblx0XHRcdF9yZXN1bHRzLm1ldGEuYWJvcnRlZCA9IHRydWU7XG5cdFx0XHRpZiAoaXNGdW5jdGlvbihfY29uZmlnLmNvbXBsZXRlKSlcblx0XHRcdFx0X2NvbmZpZy5jb21wbGV0ZShfcmVzdWx0cyk7XG5cdFx0XHRfaW5wdXQgPSBcIlwiO1xuXHRcdH07XG5cblx0XHRmdW5jdGlvbiBwcm9jZXNzUmVzdWx0cygpXG5cdFx0e1xuXHRcdFx0aWYgKF9yZXN1bHRzICYmIF9kZWxpbWl0ZXJFcnJvcilcblx0XHRcdHtcblx0XHRcdFx0YWRkRXJyb3IoXCJEZWxpbWl0ZXJcIiwgXCJVbmRldGVjdGFibGVEZWxpbWl0ZXJcIiwgXCJVbmFibGUgdG8gYXV0by1kZXRlY3QgZGVsaW1pdGluZyBjaGFyYWN0ZXI7IGRlZmF1bHRlZCB0byAnXCIrUGFwYS5EZWZhdWx0RGVsaW1pdGVyK1wiJ1wiKTtcblx0XHRcdFx0X2RlbGltaXRlckVycm9yID0gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChfY29uZmlnLnNraXBFbXB0eUxpbmVzKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IF9yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdFx0aWYgKF9yZXN1bHRzLmRhdGFbaV0ubGVuZ3RoID09IDEgJiYgX3Jlc3VsdHMuZGF0YVtpXVswXSA9PSBcIlwiKVxuXHRcdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YS5zcGxpY2UoaS0tLCAxKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG5lZWRzSGVhZGVyUm93KCkpXG5cdFx0XHRcdGZpbGxIZWFkZXJGaWVsZHMoKTtcblxuXHRcdFx0cmV0dXJuIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIG5lZWRzSGVhZGVyUm93KClcblx0XHR7XG5cdFx0XHRyZXR1cm4gX2NvbmZpZy5oZWFkZXIgJiYgX2ZpZWxkcy5sZW5ndGggPT0gMDtcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBmaWxsSGVhZGVyRmllbGRzKClcblx0XHR7XG5cdFx0XHRpZiAoIV9yZXN1bHRzKVxuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgbmVlZHNIZWFkZXJSb3coKSAmJiBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBfcmVzdWx0cy5kYXRhW2ldLmxlbmd0aDsgaisrKVxuXHRcdFx0XHRcdF9maWVsZHMucHVzaChfcmVzdWx0cy5kYXRhW2ldW2pdKTtcblx0XHRcdF9yZXN1bHRzLmRhdGEuc3BsaWNlKDAsIDEpO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFwcGx5SGVhZGVyQW5kRHluYW1pY1R5cGluZygpXG5cdFx0e1xuXHRcdFx0aWYgKCFfcmVzdWx0cyB8fCAoIV9jb25maWcuaGVhZGVyICYmICFfY29uZmlnLmR5bmFtaWNUeXBpbmcpKVxuXHRcdFx0XHRyZXR1cm4gX3Jlc3VsdHM7XG5cblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgX3Jlc3VsdHMuZGF0YS5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIHJvdyA9IHt9O1xuXG5cdFx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgX3Jlc3VsdHMuZGF0YVtpXS5sZW5ndGg7IGorKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChfY29uZmlnLmR5bmFtaWNUeXBpbmcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dmFyIHZhbHVlID0gX3Jlc3VsdHMuZGF0YVtpXVtqXTtcblx0XHRcdFx0XHRcdGlmICh2YWx1ZSA9PSBcInRydWVcIiB8fCB2YWx1ZSA9PSBcIlRSVUVcIilcblx0XHRcdFx0XHRcdFx0X3Jlc3VsdHMuZGF0YVtpXVtqXSA9IHRydWU7XG5cdFx0XHRcdFx0XHRlbHNlIGlmICh2YWx1ZSA9PSBcImZhbHNlXCIgfHwgdmFsdWUgPT0gXCJGQUxTRVwiKVxuXHRcdFx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldW2pdID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdF9yZXN1bHRzLmRhdGFbaV1bal0gPSB0cnlQYXJzZUZsb2F0KHZhbHVlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKGogPj0gX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmICghcm93W1wiX19wYXJzZWRfZXh0cmFcIl0pXG5cdFx0XHRcdFx0XHRcdFx0cm93W1wiX19wYXJzZWRfZXh0cmFcIl0gPSBbXTtcblx0XHRcdFx0XHRcdFx0cm93W1wiX19wYXJzZWRfZXh0cmFcIl0ucHVzaChfcmVzdWx0cy5kYXRhW2ldW2pdKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdFx0cm93W19maWVsZHNbal1dID0gX3Jlc3VsdHMuZGF0YVtpXVtqXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoX2NvbmZpZy5oZWFkZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfcmVzdWx0cy5kYXRhW2ldID0gcm93O1xuXHRcdFx0XHRcdGlmIChqID4gX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcihcIkZpZWxkTWlzbWF0Y2hcIiwgXCJUb29NYW55RmllbGRzXCIsIFwiVG9vIG1hbnkgZmllbGRzOiBleHBlY3RlZCBcIiArIF9maWVsZHMubGVuZ3RoICsgXCIgZmllbGRzIGJ1dCBwYXJzZWQgXCIgKyBqLCBpKTtcblx0XHRcdFx0XHRlbHNlIGlmIChqIDwgX2ZpZWxkcy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRhZGRFcnJvcihcIkZpZWxkTWlzbWF0Y2hcIiwgXCJUb29GZXdGaWVsZHNcIiwgXCJUb28gZmV3IGZpZWxkczogZXhwZWN0ZWQgXCIgKyBfZmllbGRzLmxlbmd0aCArIFwiIGZpZWxkcyBidXQgcGFyc2VkIFwiICsgaiwgaSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgKF9jb25maWcuaGVhZGVyICYmIF9yZXN1bHRzLm1ldGEpXG5cdFx0XHRcdF9yZXN1bHRzLm1ldGEuZmllbGRzID0gX2ZpZWxkcztcblx0XHRcdHJldHVybiBfcmVzdWx0cztcblx0XHR9XG5cblx0XHRmdW5jdGlvbiBndWVzc0RlbGltaXRlcihpbnB1dClcblx0XHR7XG5cdFx0XHR2YXIgZGVsaW1DaG9pY2VzID0gW1wiLFwiLCBcIlxcdFwiLCBcInxcIiwgXCI7XCIsIFBhcGEuUkVDT1JEX1NFUCwgUGFwYS5VTklUX1NFUF07XG5cdFx0XHR2YXIgYmVzdERlbGltLCBiZXN0RGVsdGEsIGZpZWxkQ291bnRQcmV2Um93O1xuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGRlbGltQ2hvaWNlcy5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0dmFyIGRlbGltID0gZGVsaW1DaG9pY2VzW2ldO1xuXHRcdFx0XHR2YXIgZGVsdGEgPSAwLCBhdmdGaWVsZENvdW50ID0gMDtcblx0XHRcdFx0ZmllbGRDb3VudFByZXZSb3cgPSB1bmRlZmluZWQ7XG5cblx0XHRcdFx0dmFyIHByZXZpZXcgPSBuZXcgUGFyc2VyKHtcblx0XHRcdFx0XHRkZWxpbWl0ZXI6IGRlbGltLFxuXHRcdFx0XHRcdHByZXZpZXc6IDEwXG5cdFx0XHRcdH0pLnBhcnNlKGlucHV0KTtcblxuXHRcdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHByZXZpZXcuZGF0YS5sZW5ndGg7IGorKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciBmaWVsZENvdW50ID0gcHJldmlldy5kYXRhW2pdLmxlbmd0aDtcblx0XHRcdFx0XHRhdmdGaWVsZENvdW50ICs9IGZpZWxkQ291bnQ7XG5cblx0XHRcdFx0XHRpZiAodHlwZW9mIGZpZWxkQ291bnRQcmV2Um93ID09PSAndW5kZWZpbmVkJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWVsZENvdW50UHJldlJvdyA9IGZpZWxkQ291bnQ7XG5cdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoZmllbGRDb3VudCA+IDEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZGVsdGEgKz0gTWF0aC5hYnMoZmllbGRDb3VudCAtIGZpZWxkQ291bnRQcmV2Um93KTtcblx0XHRcdFx0XHRcdGZpZWxkQ291bnRQcmV2Um93ID0gZmllbGRDb3VudDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAocHJldmlldy5kYXRhLmxlbmd0aCA+IDApXG5cdFx0XHRcdFx0YXZnRmllbGRDb3VudCAvPSBwcmV2aWV3LmRhdGEubGVuZ3RoO1xuXG5cdFx0XHRcdGlmICgodHlwZW9mIGJlc3REZWx0YSA9PT0gJ3VuZGVmaW5lZCcgfHwgZGVsdGEgPCBiZXN0RGVsdGEpXG5cdFx0XHRcdFx0JiYgYXZnRmllbGRDb3VudCA+IDEuOTkpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRiZXN0RGVsdGEgPSBkZWx0YTtcblx0XHRcdFx0XHRiZXN0RGVsaW0gPSBkZWxpbTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRfY29uZmlnLmRlbGltaXRlciA9IGJlc3REZWxpbTtcblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0c3VjY2Vzc2Z1bDogISFiZXN0RGVsaW0sXG5cdFx0XHRcdGJlc3REZWxpbWl0ZXI6IGJlc3REZWxpbVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGd1ZXNzTGluZUVuZGluZ3MoaW5wdXQpXG5cdFx0e1xuXHRcdFx0aW5wdXQgPSBpbnB1dC5zdWJzdHIoMCwgMTAyNCoxMDI0KTtcdC8vIG1heCBsZW5ndGggMSBNQlxuXG5cdFx0XHR2YXIgciA9IGlucHV0LnNwbGl0KCdcXHInKTtcblxuXHRcdFx0aWYgKHIubGVuZ3RoID09IDEpXG5cdFx0XHRcdHJldHVybiAnXFxuJztcblxuXHRcdFx0dmFyIG51bVdpdGhOID0gMDtcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgci5sZW5ndGg7IGkrKylcblx0XHRcdHtcblx0XHRcdFx0aWYgKHJbaV1bMF0gPT0gJ1xcbicpXG5cdFx0XHRcdFx0bnVtV2l0aE4rKztcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bVdpdGhOID49IHIubGVuZ3RoIC8gMiA/ICdcXHJcXG4nIDogJ1xccic7XG5cdFx0fVxuXG5cdFx0ZnVuY3Rpb24gdHJ5UGFyc2VGbG9hdCh2YWwpXG5cdFx0e1xuXHRcdFx0dmFyIGlzTnVtYmVyID0gRkxPQVQudGVzdCh2YWwpO1xuXHRcdFx0cmV0dXJuIGlzTnVtYmVyID8gcGFyc2VGbG9hdCh2YWwpIDogdmFsO1xuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIGFkZEVycm9yKHR5cGUsIGNvZGUsIG1zZywgcm93KVxuXHRcdHtcblx0XHRcdF9yZXN1bHRzLmVycm9ycy5wdXNoKHtcblx0XHRcdFx0dHlwZTogdHlwZSxcblx0XHRcdFx0Y29kZTogY29kZSxcblx0XHRcdFx0bWVzc2FnZTogbXNnLFxuXHRcdFx0XHRyb3c6IHJvd1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblxuXG5cblxuXHQvKiogVGhlIGNvcmUgcGFyc2VyIGltcGxlbWVudHMgc3BlZWR5IGFuZCBjb3JyZWN0IENTViBwYXJzaW5nICovXG5cdGZ1bmN0aW9uIFBhcnNlcihjb25maWcpXG5cdHtcblx0XHQvLyBVbnBhY2sgdGhlIGNvbmZpZyBvYmplY3Rcblx0XHRjb25maWcgPSBjb25maWcgfHwge307XG5cdFx0dmFyIGRlbGltID0gY29uZmlnLmRlbGltaXRlcjtcblx0XHR2YXIgbmV3bGluZSA9IGNvbmZpZy5uZXdsaW5lO1xuXHRcdHZhciBjb21tZW50cyA9IGNvbmZpZy5jb21tZW50cztcblx0XHR2YXIgc3RlcCA9IGNvbmZpZy5zdGVwO1xuXHRcdHZhciBwcmV2aWV3ID0gY29uZmlnLnByZXZpZXc7XG5cdFx0dmFyIGZhc3RNb2RlID0gY29uZmlnLmZhc3RNb2RlO1xuXG5cdFx0Ly8gRGVsaW1pdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAodHlwZW9mIGRlbGltICE9PSAnc3RyaW5nJ1xuXHRcdFx0fHwgUGFwYS5CQURfREVMSU1JVEVSUy5pbmRleE9mKGRlbGltKSA+IC0xKVxuXHRcdFx0ZGVsaW0gPSBcIixcIjtcblxuXHRcdC8vIENvbW1lbnQgY2hhcmFjdGVyIG11c3QgYmUgdmFsaWRcblx0XHRpZiAoY29tbWVudHMgPT09IGRlbGltKVxuXHRcdFx0dGhyb3cgXCJDb21tZW50IGNoYXJhY3RlciBzYW1lIGFzIGRlbGltaXRlclwiO1xuXHRcdGVsc2UgaWYgKGNvbW1lbnRzID09PSB0cnVlKVxuXHRcdFx0Y29tbWVudHMgPSBcIiNcIjtcblx0XHRlbHNlIGlmICh0eXBlb2YgY29tbWVudHMgIT09ICdzdHJpbmcnXG5cdFx0XHR8fCBQYXBhLkJBRF9ERUxJTUlURVJTLmluZGV4T2YoY29tbWVudHMpID4gLTEpXG5cdFx0XHRjb21tZW50cyA9IGZhbHNlO1xuXG5cdFx0Ly8gTmV3bGluZSBtdXN0IGJlIHZhbGlkOiBcXHIsIFxcbiwgb3IgXFxyXFxuXG5cdFx0aWYgKG5ld2xpbmUgIT0gJ1xcbicgJiYgbmV3bGluZSAhPSAnXFxyJyAmJiBuZXdsaW5lICE9ICdcXHJcXG4nKVxuXHRcdFx0bmV3bGluZSA9ICdcXG4nO1xuXG5cdFx0Ly8gV2UncmUgZ29ubmEgbmVlZCB0aGVzZSBhdCB0aGUgUGFyc2VyIHNjb3BlXG5cdFx0dmFyIGN1cnNvciA9IDA7XG5cdFx0dmFyIGFib3J0ZWQgPSBmYWxzZTtcblxuXHRcdHRoaXMucGFyc2UgPSBmdW5jdGlvbihpbnB1dCwgYmFzZUluZGV4LCBpZ25vcmVMYXN0Um93KVxuXHRcdHtcblx0XHRcdC8vIEZvciBzb21lIHJlYXNvbiwgaW4gQ2hyb21lLCB0aGlzIHNwZWVkcyB0aGluZ3MgdXAgKCE/KVxuXHRcdFx0aWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpXG5cdFx0XHRcdHRocm93IFwiSW5wdXQgbXVzdCBiZSBhIHN0cmluZ1wiO1xuXG5cdFx0XHQvLyBXZSBkb24ndCBuZWVkIHRvIGNvbXB1dGUgc29tZSBvZiB0aGVzZSBldmVyeSB0aW1lIHBhcnNlKCkgaXMgY2FsbGVkLFxuXHRcdFx0Ly8gYnV0IGhhdmluZyB0aGVtIGluIGEgbW9yZSBsb2NhbCBzY29wZSBzZWVtcyB0byBwZXJmb3JtIGJldHRlclxuXHRcdFx0dmFyIGlucHV0TGVuID0gaW5wdXQubGVuZ3RoLFxuXHRcdFx0XHRkZWxpbUxlbiA9IGRlbGltLmxlbmd0aCxcblx0XHRcdFx0bmV3bGluZUxlbiA9IG5ld2xpbmUubGVuZ3RoLFxuXHRcdFx0XHRjb21tZW50c0xlbiA9IGNvbW1lbnRzLmxlbmd0aDtcblx0XHRcdHZhciBzdGVwSXNGdW5jdGlvbiA9IHR5cGVvZiBzdGVwID09PSAnZnVuY3Rpb24nO1xuXG5cdFx0XHQvLyBFc3RhYmxpc2ggc3RhcnRpbmcgc3RhdGVcblx0XHRcdGN1cnNvciA9IDA7XG5cdFx0XHR2YXIgZGF0YSA9IFtdLCBlcnJvcnMgPSBbXSwgcm93ID0gW10sIGxhc3RDdXJzb3IgPSAwO1xuXG5cdFx0XHRpZiAoIWlucHV0KVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXG5cdFx0XHRpZiAoZmFzdE1vZGUgfHwgKGZhc3RNb2RlICE9PSBmYWxzZSAmJiBpbnB1dC5pbmRleE9mKCdcIicpID09PSAtMSkpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciByb3dzID0gaW5wdXQuc3BsaXQobmV3bGluZSk7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHZhciByb3cgPSByb3dzW2ldO1xuXHRcdFx0XHRcdGN1cnNvciArPSByb3cubGVuZ3RoO1xuXHRcdFx0XHRcdGlmIChpICE9PSByb3dzLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0XHRjdXJzb3IgKz0gbmV3bGluZS5sZW5ndGg7XG5cdFx0XHRcdFx0ZWxzZSBpZiAoaWdub3JlTGFzdFJvdylcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0aWYgKGNvbW1lbnRzICYmIHJvdy5zdWJzdHIoMCwgY29tbWVudHNMZW4pID09IGNvbW1lbnRzKVxuXHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0aWYgKHN0ZXBJc0Z1bmN0aW9uKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRhdGEgPSBbXTtcblx0XHRcdFx0XHRcdHB1c2hSb3cocm93LnNwbGl0KGRlbGltKSk7XG5cdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRwdXNoUm93KHJvdy5zcGxpdChkZWxpbSkpO1xuXHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGkgPj0gcHJldmlldylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkYXRhID0gZGF0YS5zbGljZSgwLCBwcmV2aWV3KTtcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHR2YXIgbmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdHZhciBuZXh0TmV3bGluZSA9IGlucHV0LmluZGV4T2YobmV3bGluZSwgY3Vyc29yKTtcblxuXHRcdFx0Ly8gUGFyc2VyIGxvb3Bcblx0XHRcdGZvciAoOzspXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEZpZWxkIGhhcyBvcGVuaW5nIHF1b3RlXG5cdFx0XHRcdGlmIChpbnB1dFtjdXJzb3JdID09ICdcIicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBTdGFydCBvdXIgc2VhcmNoIGZvciB0aGUgY2xvc2luZyBxdW90ZSB3aGVyZSB0aGUgY3Vyc29yIGlzXG5cdFx0XHRcdFx0dmFyIHF1b3RlU2VhcmNoID0gY3Vyc29yO1xuXG5cdFx0XHRcdFx0Ly8gU2tpcCB0aGUgb3BlbmluZyBxdW90ZVxuXHRcdFx0XHRcdGN1cnNvcisrO1xuXG5cdFx0XHRcdFx0Zm9yICg7Oylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyBGaW5kIGNsb3NpbmcgcXVvdGVcblx0XHRcdFx0XHRcdHZhciBxdW90ZVNlYXJjaCA9IGlucHV0LmluZGV4T2YoJ1wiJywgcXVvdGVTZWFyY2grMSk7XG5cblx0XHRcdFx0XHRcdGlmIChxdW90ZVNlYXJjaCA9PT0gLTEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmICghaWdub3JlTGFzdFJvdykge1xuXHRcdFx0XHRcdFx0XHRcdC8vIE5vIGNsb3NpbmcgcXVvdGUuLi4gd2hhdCBhIHBpdHlcblx0XHRcdFx0XHRcdFx0XHRlcnJvcnMucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0XHR0eXBlOiBcIlF1b3Rlc1wiLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y29kZTogXCJNaXNzaW5nUXVvdGVzXCIsXG5cdFx0XHRcdFx0XHRcdFx0XHRtZXNzYWdlOiBcIlF1b3RlZCBmaWVsZCB1bnRlcm1pbmF0ZWRcIixcblx0XHRcdFx0XHRcdFx0XHRcdHJvdzogZGF0YS5sZW5ndGgsXHQvLyByb3cgaGFzIHlldCB0byBiZSBpbnNlcnRlZFxuXHRcdFx0XHRcdFx0XHRcdFx0aW5kZXg6IGN1cnNvclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdHJldHVybiBmaW5pc2goKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKHF1b3RlU2VhcmNoID09PSBpbnB1dExlbi0xKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGF0IEVPRlxuXHRcdFx0XHRcdFx0XHR2YXIgdmFsdWUgPSBpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBxdW90ZVNlYXJjaCkucmVwbGFjZSgvXCJcIi9nLCAnXCInKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCh2YWx1ZSk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIElmIHRoaXMgcXVvdGUgaXMgZXNjYXBlZCwgaXQncyBwYXJ0IG9mIHRoZSBkYXRhOyBza2lwIGl0XG5cdFx0XHRcdFx0XHRpZiAoaW5wdXRbcXVvdGVTZWFyY2grMV0gPT0gJ1wiJylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cXVvdGVTZWFyY2grKztcblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChpbnB1dFtxdW90ZVNlYXJjaCsxXSA9PSBkZWxpbSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly8gQ2xvc2luZyBxdW90ZSBmb2xsb3dlZCBieSBkZWxpbWl0ZXJcblx0XHRcdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UoL1wiXCIvZywgJ1wiJykpO1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgPSBxdW90ZVNlYXJjaCArIDEgKyBkZWxpbUxlbjtcblx0XHRcdFx0XHRcdFx0bmV4dERlbGltID0gaW5wdXQuaW5kZXhPZihkZWxpbSwgY3Vyc29yKTtcblx0XHRcdFx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoaW5wdXQuc3Vic3RyKHF1b3RlU2VhcmNoKzEsIG5ld2xpbmVMZW4pID09PSBuZXdsaW5lKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvLyBDbG9zaW5nIHF1b3RlIGZvbGxvd2VkIGJ5IG5ld2xpbmVcblx0XHRcdFx0XHRcdFx0cm93LnB1c2goaW5wdXQuc3Vic3RyaW5nKGN1cnNvciwgcXVvdGVTZWFyY2gpLnJlcGxhY2UoL1wiXCIvZywgJ1wiJykpO1xuXHRcdFx0XHRcdFx0XHRzYXZlUm93KHF1b3RlU2VhcmNoICsgMSArIG5ld2xpbmVMZW4pO1xuXHRcdFx0XHRcdFx0XHRuZXh0RGVsaW0gPSBpbnB1dC5pbmRleE9mKGRlbGltLCBjdXJzb3IpO1x0Ly8gYmVjYXVzZSB3ZSBtYXkgaGF2ZSBza2lwcGVkIHRoZSBuZXh0RGVsaW0gaW4gdGhlIHF1b3RlZCBmaWVsZFxuXG5cdFx0XHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRvU3RlcCgpO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdFx0aWYgKHByZXZpZXcgJiYgZGF0YS5sZW5ndGggPj0gcHJldmlldylcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vIENvbW1lbnQgZm91bmQgYXQgc3RhcnQgb2YgbmV3IGxpbmVcblx0XHRcdFx0aWYgKGNvbW1lbnRzICYmIHJvdy5sZW5ndGggPT09IDAgJiYgaW5wdXQuc3Vic3RyKGN1cnNvciwgY29tbWVudHNMZW4pID09PSBjb21tZW50cylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChuZXh0TmV3bGluZSA9PSAtMSlcdC8vIENvbW1lbnQgZW5kcyBhdCBFT0Zcblx0XHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdFx0Y3Vyc29yID0gbmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuO1xuXHRcdFx0XHRcdG5leHROZXdsaW5lID0gaW5wdXQuaW5kZXhPZihuZXdsaW5lLCBjdXJzb3IpO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBOZXh0IGRlbGltaXRlciBjb21lcyBiZWZvcmUgbmV4dCBuZXdsaW5lLCBzbyB3ZSd2ZSByZWFjaGVkIGVuZCBvZiBmaWVsZFxuXHRcdFx0XHRpZiAobmV4dERlbGltICE9PSAtMSAmJiAobmV4dERlbGltIDwgbmV4dE5ld2xpbmUgfHwgbmV4dE5ld2xpbmUgPT09IC0xKSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJvdy5wdXNoKGlucHV0LnN1YnN0cmluZyhjdXJzb3IsIG5leHREZWxpbSkpO1xuXHRcdFx0XHRcdGN1cnNvciA9IG5leHREZWxpbSArIGRlbGltTGVuO1xuXHRcdFx0XHRcdG5leHREZWxpbSA9IGlucHV0LmluZGV4T2YoZGVsaW0sIGN1cnNvcik7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBFbmQgb2Ygcm93XG5cdFx0XHRcdGlmIChuZXh0TmV3bGluZSAhPT0gLTEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyb3cucHVzaChpbnB1dC5zdWJzdHJpbmcoY3Vyc29yLCBuZXh0TmV3bGluZSkpO1xuXHRcdFx0XHRcdHNhdmVSb3cobmV4dE5ld2xpbmUgKyBuZXdsaW5lTGVuKTtcblxuXHRcdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0XHRcdGlmIChhYm9ydGVkKVxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChwcmV2aWV3ICYmIGRhdGEubGVuZ3RoID49IHByZXZpZXcpXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmV0dXJuYWJsZSh0cnVlKTtcblxuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblxuXHRcdFx0cmV0dXJuIGZpbmlzaCgpO1xuXG5cblx0XHRcdGZ1bmN0aW9uIHB1c2hSb3cocm93KVxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhLnB1c2gocm93KTtcblx0XHRcdFx0bGFzdEN1cnNvciA9IGN1cnNvcjtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBcHBlbmRzIHRoZSByZW1haW5pbmcgaW5wdXQgZnJvbSBjdXJzb3IgdG8gdGhlIGVuZCBpbnRvXG5cdFx0XHQgKiByb3csIHNhdmVzIHRoZSByb3csIGNhbGxzIHN0ZXAsIGFuZCByZXR1cm5zIHRoZSByZXN1bHRzLlxuXHRcdFx0ICovXG5cdFx0XHRmdW5jdGlvbiBmaW5pc2godmFsdWUpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChpZ25vcmVMYXN0Um93KVxuXHRcdFx0XHRcdHJldHVybiByZXR1cm5hYmxlKCk7XG5cdFx0XHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnKVxuXHRcdFx0XHRcdHZhbHVlID0gaW5wdXQuc3Vic3RyKGN1cnNvcik7XG5cdFx0XHRcdHJvdy5wdXNoKHZhbHVlKTtcblx0XHRcdFx0Y3Vyc29yID0gaW5wdXRMZW47XHQvLyBpbXBvcnRhbnQgaW4gY2FzZSBwYXJzaW5nIGlzIHBhdXNlZFxuXHRcdFx0XHRwdXNoUm93KHJvdyk7XG5cdFx0XHRcdGlmIChzdGVwSXNGdW5jdGlvbilcblx0XHRcdFx0XHRkb1N0ZXAoKTtcblx0XHRcdFx0cmV0dXJuIHJldHVybmFibGUoKTtcblx0XHRcdH1cblxuXHRcdFx0LyoqXG5cdFx0XHQgKiBBcHBlbmRzIHRoZSBjdXJyZW50IHJvdyB0byB0aGUgcmVzdWx0cy4gSXQgc2V0cyB0aGUgY3Vyc29yXG5cdFx0XHQgKiB0byBuZXdDdXJzb3IgYW5kIGZpbmRzIHRoZSBuZXh0TmV3bGluZS4gVGhlIGNhbGxlciBzaG91bGRcblx0XHRcdCAqIHRha2UgY2FyZSB0byBleGVjdXRlIHVzZXIncyBzdGVwIGZ1bmN0aW9uIGFuZCBjaGVjayBmb3Jcblx0XHRcdCAqIHByZXZpZXcgYW5kIGVuZCBwYXJzaW5nIGlmIG5lY2Vzc2FyeS5cblx0XHRcdCAqL1xuXHRcdFx0ZnVuY3Rpb24gc2F2ZVJvdyhuZXdDdXJzb3IpXG5cdFx0XHR7XG5cdFx0XHRcdGN1cnNvciA9IG5ld0N1cnNvcjtcblx0XHRcdFx0cHVzaFJvdyhyb3cpO1xuXHRcdFx0XHRyb3cgPSBbXTtcblx0XHRcdFx0bmV4dE5ld2xpbmUgPSBpbnB1dC5pbmRleE9mKG5ld2xpbmUsIGN1cnNvcik7XG5cdFx0XHR9XG5cblx0XHRcdC8qKiBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRoZSByZXN1bHRzLCBlcnJvcnMsIGFuZCBtZXRhLiAqL1xuXHRcdFx0ZnVuY3Rpb24gcmV0dXJuYWJsZShzdG9wcGVkKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGRhdGE6IGRhdGEsXG5cdFx0XHRcdFx0ZXJyb3JzOiBlcnJvcnMsXG5cdFx0XHRcdFx0bWV0YToge1xuXHRcdFx0XHRcdFx0ZGVsaW1pdGVyOiBkZWxpbSxcblx0XHRcdFx0XHRcdGxpbmVicmVhazogbmV3bGluZSxcblx0XHRcdFx0XHRcdGFib3J0ZWQ6IGFib3J0ZWQsXG5cdFx0XHRcdFx0XHR0cnVuY2F0ZWQ6ICEhc3RvcHBlZCxcblx0XHRcdFx0XHRcdGN1cnNvcjogbGFzdEN1cnNvciArIChiYXNlSW5kZXggfHwgMClcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH07XG5cdFx0XHR9XG5cblx0XHRcdC8qKiBFeGVjdXRlcyB0aGUgdXNlcidzIHN0ZXAgZnVuY3Rpb24gYW5kIHJlc2V0cyBkYXRhICYgZXJyb3JzLiAqL1xuXHRcdFx0ZnVuY3Rpb24gZG9TdGVwKClcblx0XHRcdHtcblx0XHRcdFx0c3RlcChyZXR1cm5hYmxlKCkpO1xuXHRcdFx0XHRkYXRhID0gW10sIGVycm9ycyA9IFtdO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvKiogU2V0cyB0aGUgYWJvcnQgZmxhZyAqL1xuXHRcdHRoaXMuYWJvcnQgPSBmdW5jdGlvbigpXG5cdFx0e1xuXHRcdFx0YWJvcnRlZCA9IHRydWU7XG5cdFx0fTtcblxuXHRcdC8qKiBHZXRzIHRoZSBjdXJzb3IgcG9zaXRpb24gKi9cblx0XHR0aGlzLmdldENoYXJJbmRleCA9IGZ1bmN0aW9uKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gY3Vyc29yO1xuXHRcdH07XG5cdH1cblxuXG5cdC8vIElmIHlvdSBuZWVkIHRvIGxvYWQgUGFwYSBQYXJzZSBhc3luY2hyb25vdXNseSBhbmQgeW91IGFsc28gbmVlZCB3b3JrZXIgdGhyZWFkcywgaGFyZC1jb2RlXG5cdC8vIHRoZSBzY3JpcHQgcGF0aCBoZXJlLiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9taG9sdC9QYXBhUGFyc2UvaXNzdWVzLzg3I2lzc3VlY29tbWVudC01Nzg4NTM1OFxuXHRmdW5jdGlvbiBnZXRTY3JpcHRQYXRoKClcblx0e1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpO1xuXHRcdHJldHVybiBzY3JpcHRzLmxlbmd0aCA/IHNjcmlwdHNbc2NyaXB0cy5sZW5ndGggLSAxXS5zcmMgOiAnJztcblx0fVxuXG5cdGZ1bmN0aW9uIG5ld1dvcmtlcigpXG5cdHtcblx0XHRpZiAoIVBhcGEuV09SS0VSU19TVVBQT1JURUQpXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0aWYgKCFMT0FERURfU1lOQyAmJiBQYXBhLlNDUklQVF9QQVRIID09PSBudWxsKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0XHQnU2NyaXB0IHBhdGggY2Fubm90IGJlIGRldGVybWluZWQgYXV0b21hdGljYWxseSB3aGVuIFBhcGEgUGFyc2UgaXMgbG9hZGVkIGFzeW5jaHJvbm91c2x5LiAnICtcblx0XHRcdFx0J1lvdSBuZWVkIHRvIHNldCBQYXBhLlNDUklQVF9QQVRIIG1hbnVhbGx5Lidcblx0XHRcdCk7XG5cdFx0dmFyIHdvcmtlclVybCA9IFBhcGEuU0NSSVBUX1BBVEggfHwgQVVUT19TQ1JJUFRfUEFUSDtcblx0XHQvLyBBcHBlbmQgXCJwYXBhd29ya2VyXCIgdG8gdGhlIHNlYXJjaCBzdHJpbmcgdG8gdGVsbCBwYXBhcGFyc2UgdGhhdCB0aGlzIGlzIG91ciB3b3JrZXIuXG5cdFx0d29ya2VyVXJsICs9ICh3b3JrZXJVcmwuaW5kZXhPZignPycpICE9PSAtMSA/ICcmJyA6ICc/JykgKyAncGFwYXdvcmtlcic7XG5cdFx0dmFyIHcgPSBuZXcgZ2xvYmFsLldvcmtlcih3b3JrZXJVcmwpO1xuXHRcdHcub25tZXNzYWdlID0gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZTtcblx0XHR3LmlkID0gd29ya2VySWRDb3VudGVyKys7XG5cdFx0d29ya2Vyc1t3LmlkXSA9IHc7XG5cdFx0cmV0dXJuIHc7XG5cdH1cblxuXHQvKiogQ2FsbGJhY2sgd2hlbiBtYWluIHRocmVhZCByZWNlaXZlcyBhIG1lc3NhZ2UgKi9cblx0ZnVuY3Rpb24gbWFpblRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1ttc2cud29ya2VySWRdO1xuXHRcdHZhciBhYm9ydGVkID0gZmFsc2U7XG5cblx0XHRpZiAobXNnLmVycm9yKVxuXHRcdFx0d29ya2VyLnVzZXJFcnJvcihtc2cuZXJyb3IsIG1zZy5maWxlKTtcblx0XHRlbHNlIGlmIChtc2cucmVzdWx0cyAmJiBtc2cucmVzdWx0cy5kYXRhKVxuXHRcdHtcblx0XHRcdHZhciBhYm9ydCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRhYm9ydGVkID0gdHJ1ZTtcblx0XHRcdFx0Y29tcGxldGVXb3JrZXIobXNnLndvcmtlcklkLCB7IGRhdGE6IFtdLCBlcnJvcnM6IFtdLCBtZXRhOiB7IGFib3J0ZWQ6IHRydWUgfSB9KTtcblx0XHRcdH07XG5cblx0XHRcdHZhciBoYW5kbGUgPSB7XG5cdFx0XHRcdGFib3J0OiBhYm9ydCxcblx0XHRcdFx0cGF1c2U6IG5vdEltcGxlbWVudGVkLFxuXHRcdFx0XHRyZXN1bWU6IG5vdEltcGxlbWVudGVkXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoaXNGdW5jdGlvbih3b3JrZXIudXNlclN0ZXApKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IG1zZy5yZXN1bHRzLmRhdGEubGVuZ3RoOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR3b3JrZXIudXNlclN0ZXAoe1xuXHRcdFx0XHRcdFx0ZGF0YTogW21zZy5yZXN1bHRzLmRhdGFbaV1dLFxuXHRcdFx0XHRcdFx0ZXJyb3JzOiBtc2cucmVzdWx0cy5lcnJvcnMsXG5cdFx0XHRcdFx0XHRtZXRhOiBtc2cucmVzdWx0cy5tZXRhXG5cdFx0XHRcdFx0fSwgaGFuZGxlKTtcblx0XHRcdFx0XHRpZiAoYWJvcnRlZClcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGRlbGV0ZSBtc2cucmVzdWx0cztcdC8vIGZyZWUgbWVtb3J5IEFTQVBcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDaHVuaykpXG5cdFx0XHR7XG5cdFx0XHRcdHdvcmtlci51c2VyQ2h1bmsobXNnLnJlc3VsdHMsIGhhbmRsZSwgbXNnLmZpbGUpO1xuXHRcdFx0XHRkZWxldGUgbXNnLnJlc3VsdHM7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKG1zZy5maW5pc2hlZCAmJiAhYWJvcnRlZClcblx0XHRcdGNvbXBsZXRlV29ya2VyKG1zZy53b3JrZXJJZCwgbXNnLnJlc3VsdHMpO1xuXHR9XG5cblx0ZnVuY3Rpb24gY29tcGxldGVXb3JrZXIod29ya2VySWQsIHJlc3VsdHMpIHtcblx0XHR2YXIgd29ya2VyID0gd29ya2Vyc1t3b3JrZXJJZF07XG5cdFx0aWYgKGlzRnVuY3Rpb24od29ya2VyLnVzZXJDb21wbGV0ZSkpXG5cdFx0XHR3b3JrZXIudXNlckNvbXBsZXRlKHJlc3VsdHMpO1xuXHRcdHdvcmtlci50ZXJtaW5hdGUoKTtcblx0XHRkZWxldGUgd29ya2Vyc1t3b3JrZXJJZF07XG5cdH1cblxuXHRmdW5jdGlvbiBub3RJbXBsZW1lbnRlZCgpIHtcblx0XHR0aHJvdyBcIk5vdCBpbXBsZW1lbnRlZC5cIjtcblx0fVxuXG5cdC8qKiBDYWxsYmFjayB3aGVuIHdvcmtlciB0aHJlYWQgcmVjZWl2ZXMgYSBtZXNzYWdlICovXG5cdGZ1bmN0aW9uIHdvcmtlclRocmVhZFJlY2VpdmVkTWVzc2FnZShlKVxuXHR7XG5cdFx0dmFyIG1zZyA9IGUuZGF0YTtcblxuXHRcdGlmICh0eXBlb2YgUGFwYS5XT1JLRVJfSUQgPT09ICd1bmRlZmluZWQnICYmIG1zZylcblx0XHRcdFBhcGEuV09SS0VSX0lEID0gbXNnLndvcmtlcklkO1xuXG5cdFx0aWYgKHR5cGVvZiBtc2cuaW5wdXQgPT09ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdGdsb2JhbC5wb3N0TWVzc2FnZSh7XG5cdFx0XHRcdHdvcmtlcklkOiBQYXBhLldPUktFUl9JRCxcblx0XHRcdFx0cmVzdWx0czogUGFwYS5wYXJzZShtc2cuaW5wdXQsIG1zZy5jb25maWcpLFxuXHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKChnbG9iYWwuRmlsZSAmJiBtc2cuaW5wdXQgaW5zdGFuY2VvZiBGaWxlKSB8fCBtc2cuaW5wdXQgaW5zdGFuY2VvZiBPYmplY3QpXHQvLyB0aGFuayB5b3UsIFNhZmFyaSAoc2VlIGlzc3VlICMxMDYpXG5cdFx0e1xuXHRcdFx0dmFyIHJlc3VsdHMgPSBQYXBhLnBhcnNlKG1zZy5pbnB1dCwgbXNnLmNvbmZpZyk7XG5cdFx0XHRpZiAocmVzdWx0cylcblx0XHRcdFx0Z2xvYmFsLnBvc3RNZXNzYWdlKHtcblx0XHRcdFx0XHR3b3JrZXJJZDogUGFwYS5XT1JLRVJfSUQsXG5cdFx0XHRcdFx0cmVzdWx0czogcmVzdWx0cyxcblx0XHRcdFx0XHRmaW5pc2hlZDogdHJ1ZVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH1cblxuXHQvKiogTWFrZXMgYSBkZWVwIGNvcHkgb2YgYW4gYXJyYXkgb3Igb2JqZWN0IChtb3N0bHkpICovXG5cdGZ1bmN0aW9uIGNvcHkob2JqKVxuXHR7XG5cdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnKVxuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR2YXIgY3B5ID0gb2JqIGluc3RhbmNlb2YgQXJyYXkgPyBbXSA6IHt9O1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopXG5cdFx0XHRjcHlba2V5XSA9IGNvcHkob2JqW2tleV0pO1xuXHRcdHJldHVybiBjcHk7XG5cdH1cblxuXHRmdW5jdGlvbiBiaW5kRnVuY3Rpb24oZiwgc2VsZilcblx0e1xuXHRcdHJldHVybiBmdW5jdGlvbigpIHsgZi5hcHBseShzZWxmLCBhcmd1bWVudHMpOyB9O1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNGdW5jdGlvbihmdW5jKVxuXHR7XG5cdFx0cmV0dXJuIHR5cGVvZiBmdW5jID09PSAnZnVuY3Rpb24nO1xuXHR9XG59KSh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHRoaXMpO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIi8qISAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5Db3B5cmlnaHQgKEMpIE1pY3Jvc29mdC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTsgeW91IG1heSBub3QgdXNlXHJcbnRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlXHJcbkxpY2Vuc2UgYXQgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXHJcblxyXG5USElTIENPREUgSVMgUFJPVklERUQgT04gQU4gKkFTIElTKiBCQVNJUywgV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZXHJcbktJTkQsIEVJVEhFUiBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBXSVRIT1VUIExJTUlUQVRJT04gQU5ZIElNUExJRURcclxuV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIFRJVExFLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSxcclxuTUVSQ0hBTlRBQkxJVFkgT1IgTk9OLUlORlJJTkdFTUVOVC5cclxuXHJcblNlZSB0aGUgQXBhY2hlIFZlcnNpb24gMi4wIExpY2Vuc2UgZm9yIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9uc1xyXG5hbmQgbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXHJcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqICovXHJcbnZhciBSZWZsZWN0O1xyXG4oZnVuY3Rpb24gKFJlZmxlY3QpIHtcclxuICAgIFwidXNlIHN0cmljdFwiO1xyXG4gICAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XHJcbiAgICAvLyBmZWF0dXJlIHRlc3QgZm9yIE9iamVjdC5jcmVhdGUgc3VwcG9ydFxyXG4gICAgdmFyIHN1cHBvcnRzQ3JlYXRlID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIC8vIGZlYXR1cmUgdGVzdCBmb3IgX19wcm90b19fIHN1cHBvcnRcclxuICAgIHZhciBzdXBwb3J0c1Byb3RvID0geyBfX3Byb3RvX186IFtdIH0gaW5zdGFuY2VvZiBBcnJheTtcclxuICAgIC8vIGZlYXR1cmUgdGVzdCBmb3IgU3ltYm9sIHN1cHBvcnRcclxuICAgIHZhciBzdXBwb3J0c1N5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIHZhciB0b1ByaW1pdGl2ZVN5bWJvbCA9IHN1cHBvcnRzU3ltYm9sICYmIHR5cGVvZiBTeW1ib2wudG9QcmltaXRpdmUgIT09IFwidW5kZWZpbmVkXCIgPyBTeW1ib2wudG9QcmltaXRpdmUgOiBcIkBAdG9QcmltaXRpdmVcIjtcclxuICAgIHZhciBpdGVyYXRvclN5bWJvbCA9IHN1cHBvcnRzU3ltYm9sICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgIT09IFwidW5kZWZpbmVkXCIgPyBTeW1ib2wuaXRlcmF0b3IgOiBcIkBAaXRlcmF0b3JcIjtcclxuICAgIC8vIGNyZWF0ZSBhbiBvYmplY3QgaW4gZGljdGlvbmFyeSBtb2RlIChhLmsuYS4gXCJzbG93XCIgbW9kZSBpbiB2OClcclxuICAgIHZhciBjcmVhdGVEaWN0aW9uYXJ5ID0gc3VwcG9ydHNDcmVhdGUgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBNYWtlRGljdGlvbmFyeShPYmplY3QuY3JlYXRlKG51bGwpKTsgfSA6XHJcbiAgICAgICAgc3VwcG9ydHNQcm90byA/IGZ1bmN0aW9uICgpIHsgcmV0dXJuIE1ha2VEaWN0aW9uYXJ5KHsgX19wcm90b19fOiBudWxsIH0pOyB9IDpcclxuICAgICAgICAgICAgZnVuY3Rpb24gKCkgeyByZXR1cm4gTWFrZURpY3Rpb25hcnkoe30pOyB9O1xyXG4gICAgdmFyIEhhc2hNYXA7XHJcbiAgICAoZnVuY3Rpb24gKEhhc2hNYXApIHtcclxuICAgICAgICB2YXIgZG93bkxldmVsID0gIXN1cHBvcnRzQ3JlYXRlICYmICFzdXBwb3J0c1Byb3RvO1xyXG4gICAgICAgIEhhc2hNYXAuaGFzID0gZG93bkxldmVsXHJcbiAgICAgICAgICAgID8gZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBoYXNPd24uY2FsbChtYXAsIGtleSk7IH1cclxuICAgICAgICAgICAgOiBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGtleSBpbiBtYXA7IH07XHJcbiAgICAgICAgSGFzaE1hcC5nZXQgPSBkb3duTGV2ZWxcclxuICAgICAgICAgICAgPyBmdW5jdGlvbiAobWFwLCBrZXkpIHsgcmV0dXJuIGhhc093bi5jYWxsKG1hcCwga2V5KSA/IG1hcFtrZXldIDogdW5kZWZpbmVkOyB9XHJcbiAgICAgICAgICAgIDogZnVuY3Rpb24gKG1hcCwga2V5KSB7IHJldHVybiBtYXBba2V5XTsgfTtcclxuICAgIH0pKEhhc2hNYXAgfHwgKEhhc2hNYXAgPSB7fSkpO1xyXG4gICAgLy8gTG9hZCBnbG9iYWwgb3Igc2hpbSB2ZXJzaW9ucyBvZiBNYXAsIFNldCwgYW5kIFdlYWtNYXBcclxuICAgIHZhciBmdW5jdGlvblByb3RvdHlwZSA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihGdW5jdGlvbik7XHJcbiAgICB2YXIgX01hcCA9IHR5cGVvZiBNYXAgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgTWFwLnByb3RvdHlwZS5lbnRyaWVzID09PSBcImZ1bmN0aW9uXCIgPyBNYXAgOiBDcmVhdGVNYXBQb2x5ZmlsbCgpO1xyXG4gICAgdmFyIF9TZXQgPSB0eXBlb2YgU2V0ID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFNldC5wcm90b3R5cGUuZW50cmllcyA9PT0gXCJmdW5jdGlvblwiID8gU2V0IDogQ3JlYXRlU2V0UG9seWZpbGwoKTtcclxuICAgIHZhciBfV2Vha01hcCA9IHR5cGVvZiBXZWFrTWFwID09PSBcImZ1bmN0aW9uXCIgPyBXZWFrTWFwIDogQ3JlYXRlV2Vha01hcFBvbHlmaWxsKCk7XHJcbiAgICAvLyBbW01ldGFkYXRhXV0gaW50ZXJuYWwgc2xvdFxyXG4gICAgdmFyIE1ldGFkYXRhID0gbmV3IF9XZWFrTWFwKCk7XHJcbiAgICAvKipcclxuICAgICAgKiBBcHBsaWVzIGEgc2V0IG9mIGRlY29yYXRvcnMgdG8gYSBwcm9wZXJ0eSBvZiBhIHRhcmdldCBvYmplY3QuXHJcbiAgICAgICogQHBhcmFtIGRlY29yYXRvcnMgQW4gYXJyYXkgb2YgZGVjb3JhdG9ycy5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0LlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IHRvIGRlY29yYXRlLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXREZXNjcmlwdG9yIChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGRlc2NyaXB0b3IgZm9yIHRoZSB0YXJnZXQga2V5XHJcbiAgICAgICogQHJlbWFya3MgRGVjb3JhdG9ycyBhcmUgYXBwbGllZCBpbiByZXZlcnNlIG9yZGVyLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgRXhhbXBsZSA9IFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIixcclxuICAgICAgKiAgICAgICAgIFJlZmxlY3QuZGVjb3JhdGUoZGVjb3JhdG9yc0FycmF5LCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiLFxyXG4gICAgICAqICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIikpKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiLFxyXG4gICAgICAqICAgICAgICAgUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzQXJyYXksIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiLFxyXG4gICAgICAqICAgICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpKSk7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwgdGFyZ2V0S2V5LCB0YXJnZXREZXNjcmlwdG9yKSB7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKSB7XHJcbiAgICAgICAgICAgIGlmICghSXNBcnJheShkZWNvcmF0b3JzKSlcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldERlc2NyaXB0b3IpICYmICFJc1VuZGVmaW5lZCh0YXJnZXREZXNjcmlwdG9yKSAmJiAhSXNOdWxsKHRhcmdldERlc2NyaXB0b3IpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICBpZiAoSXNOdWxsKHRhcmdldERlc2NyaXB0b3IpKVxyXG4gICAgICAgICAgICAgICAgdGFyZ2V0RGVzY3JpcHRvciA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgICAgICByZXR1cm4gRGVjb3JhdGVQcm9wZXJ0eShkZWNvcmF0b3JzLCB0YXJnZXQsIHRhcmdldEtleSwgdGFyZ2V0RGVzY3JpcHRvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBpZiAoIUlzQXJyYXkoZGVjb3JhdG9ycykpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIGlmICghSXNDb25zdHJ1Y3Rvcih0YXJnZXQpKVxyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICByZXR1cm4gRGVjb3JhdGVDb25zdHJ1Y3RvcihkZWNvcmF0b3JzLCB0YXJnZXQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFJlZmxlY3QuZGVjb3JhdGUgPSBkZWNvcmF0ZTtcclxuICAgIC8qKlxyXG4gICAgICAqIEEgZGVmYXVsdCBtZXRhZGF0YSBkZWNvcmF0b3IgZmFjdG9yeSB0aGF0IGNhbiBiZSB1c2VkIG9uIGEgY2xhc3MsIGNsYXNzIG1lbWJlciwgb3IgcGFyYW1ldGVyLlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBUaGUga2V5IGZvciB0aGUgbWV0YWRhdGEgZW50cnkuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhVmFsdWUgVGhlIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEgZW50cnkuXHJcbiAgICAgICogQHJldHVybnMgQSBkZWNvcmF0b3IgZnVuY3Rpb24uXHJcbiAgICAgICogQHJlbWFya3NcclxuICAgICAgKiBJZiBgbWV0YWRhdGFLZXlgIGlzIGFscmVhZHkgZGVmaW5lZCBmb3IgdGhlIHRhcmdldCBhbmQgdGFyZ2V0IGtleSwgdGhlXHJcbiAgICAgICogbWV0YWRhdGFWYWx1ZSBmb3IgdGhhdCBrZXkgd2lsbCBiZSBvdmVyd3JpdHRlbi5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yLCBUeXBlU2NyaXB0IG9ubHkpXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgQFJlZmxlY3QubWV0YWRhdGEoa2V5LCB2YWx1ZSlcclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUsIFR5cGVTY3JpcHQgb25seSlcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxyXG4gICAgICAqICAgICAgICAgcHJvcGVydHk7XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIEBSZWZsZWN0Lm1ldGFkYXRhKGtleSwgdmFsdWUpXHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICBAUmVmbGVjdC5tZXRhZGF0YShrZXksIHZhbHVlKVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gbWV0YWRhdGEobWV0YWRhdGFLZXksIG1ldGFkYXRhVmFsdWUpIHtcclxuICAgICAgICBmdW5jdGlvbiBkZWNvcmF0b3IodGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgICAgICAgICAgT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc0NvbnN0cnVjdG9yKHRhcmdldCkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICAgICAgT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCAvKnRhcmdldEtleSovIHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRlY29yYXRvcjtcclxuICAgIH1cclxuICAgIFJlZmxlY3QubWV0YWRhdGEgPSBtZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIERlZmluZSBhIHVuaXF1ZSBtZXRhZGF0YSBlbnRyeSBvbiB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFWYWx1ZSBBIHZhbHVlIHRoYXQgY29udGFpbnMgYXR0YWNoZWQgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0byBkZWZpbmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQGV4YW1wbGVcclxuICAgICAgKlxyXG4gICAgICAqICAgICBjbGFzcyBFeGFtcGxlIHtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5IGRlY2xhcmF0aW9ucyBhcmUgbm90IHBhcnQgb2YgRVM2LCB0aG91Z2ggdGhleSBhcmUgdmFsaWQgaW4gVHlwZVNjcmlwdDpcclxuICAgICAgKiAgICAgICAgIC8vIHN0YXRpYyBzdGF0aWNQcm9wZXJ0eTtcclxuICAgICAgKiAgICAgICAgIC8vIHByb3BlcnR5O1xyXG4gICAgICAqXHJcbiAgICAgICogICAgICAgICBjb25zdHJ1Y3RvcihwKSB7IH1cclxuICAgICAgKiAgICAgICAgIHN0YXRpYyBzdGF0aWNNZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgICAgICBtZXRob2QocCkgeyB9XHJcbiAgICAgICogICAgIH1cclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBjb25zdHJ1Y3RvclxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZS5wcm90b3R5cGUsIFwicHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgb3B0aW9ucywgRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGRlY29yYXRvciBmYWN0b3J5IGFzIG1ldGFkYXRhLXByb2R1Y2luZyBhbm5vdGF0aW9uLlxyXG4gICAgICAqICAgICBmdW5jdGlvbiBNeUFubm90YXRpb24ob3B0aW9ucyk6IERlY29yYXRvciB7XHJcbiAgICAgICogICAgICAgICByZXR1cm4gKHRhcmdldCwga2V5PykgPT4gUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIG9wdGlvbnMsIHRhcmdldCwga2V5KTtcclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBkZWZpbmVNZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlEZWZpbmVPd25NZXRhZGF0YShtZXRhZGF0YUtleSwgbWV0YWRhdGFWYWx1ZSwgdGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YSA9IGRlZmluZU1ldGFkYXRhO1xyXG4gICAgLyoqXHJcbiAgICAgICogR2V0cyBhIHZhbHVlIGluZGljYXRpbmcgd2hldGhlciB0aGUgdGFyZ2V0IG9iamVjdCBvciBpdHMgcHJvdG90eXBlIGNoYWluIGhhcyB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgYHRydWVgIGlmIHRoZSBtZXRhZGF0YSBrZXkgd2FzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbjsgb3RoZXJ3aXNlLCBgZmFsc2VgLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaGFzTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuaGFzTWV0YWRhdGEgPSBoYXNNZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgYSB2YWx1ZSBpbmRpY2F0aW5nIHdoZXRoZXIgdGhlIHRhcmdldCBvYmplY3QgaGFzIHRoZSBwcm92aWRlZCBtZXRhZGF0YSBrZXkgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGtleSB3YXMgZGVmaW5lZCBvbiB0aGUgdGFyZ2V0IG9iamVjdDsgb3RoZXJ3aXNlLCBgZmFsc2VgLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuaGFzT3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5oYXNPd25NZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gaGFzT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuaGFzT3duTWV0YWRhdGEgPSBoYXNPd25NZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IG9uIHRoZSB0YXJnZXQgb2JqZWN0IG9yIGl0cyBwcm90b3R5cGUgY2hhaW4uXHJcbiAgICAgICogQHBhcmFtIG1ldGFkYXRhS2V5IEEga2V5IHVzZWQgdG8gc3RvcmUgYW5kIHJldHJpZXZlIG1ldGFkYXRhLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBvYmplY3Qgb24gd2hpY2ggdGhlIG1ldGFkYXRhIGlzIGRlZmluZWQuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldEtleSAoT3B0aW9uYWwpIFRoZSBwcm9wZXJ0eSBrZXkgZm9yIHRoZSB0YXJnZXQuXHJcbiAgICAgICogQHJldHVybnMgVGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbWV0YWRhdGEga2V5IGlmIGZvdW5kOyBvdGhlcndpc2UsIGB1bmRlZmluZWRgLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUsIFwic3RhdGljUHJvcGVydHlcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShcImN1c3RvbTphbm5vdGF0aW9uXCIsIEV4YW1wbGUucHJvdG90eXBlLCBcIm1ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqL1xyXG4gICAgZnVuY3Rpb24gZ2V0TWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KSB7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgcmV0dXJuIE9yZGluYXJ5R2V0TWV0YWRhdGEobWV0YWRhdGFLZXksIHRhcmdldCwgdGFyZ2V0S2V5KTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZ2V0TWV0YWRhdGEgPSBnZXRNZXRhZGF0YTtcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcHJvdmlkZWQgbWV0YWRhdGEga2V5IG9uIHRoZSB0YXJnZXQgb2JqZWN0LlxyXG4gICAgICAqIEBwYXJhbSBtZXRhZGF0YUtleSBBIGtleSB1c2VkIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBtZXRhZGF0YS5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIFRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIG1ldGFkYXRhIGtleSBpZiBmb3VuZDsgb3RoZXJ3aXNlLCBgdW5kZWZpbmVkYC5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldE93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmdldE93bk1ldGFkYXRhID0gZ2V0T3duTWV0YWRhdGE7XHJcbiAgICAvKipcclxuICAgICAgKiBHZXRzIHRoZSBtZXRhZGF0YSBrZXlzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3Qgb3IgaXRzIHByb3RvdHlwZSBjaGFpbi5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgb2JqZWN0IG9uIHdoaWNoIHRoZSBtZXRhZGF0YSBpcyBkZWZpbmVkLlxyXG4gICAgICAqIEBwYXJhbSB0YXJnZXRLZXkgKE9wdGlvbmFsKSBUaGUgcHJvcGVydHkga2V5IGZvciB0aGUgdGFyZ2V0LlxyXG4gICAgICAqIEByZXR1cm5zIEFuIGFycmF5IG9mIHVuaXF1ZSBtZXRhZGF0YSBrZXlzLlxyXG4gICAgICAqIEBleGFtcGxlXHJcbiAgICAgICpcclxuICAgICAgKiAgICAgY2xhc3MgRXhhbXBsZSB7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eSBkZWNsYXJhdGlvbnMgYXJlIG5vdCBwYXJ0IG9mIEVTNiwgdGhvdWdoIHRoZXkgYXJlIHZhbGlkIGluIFR5cGVTY3JpcHQ6XHJcbiAgICAgICogICAgICAgICAvLyBzdGF0aWMgc3RhdGljUHJvcGVydHk7XHJcbiAgICAgICogICAgICAgICAvLyBwcm9wZXJ0eTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAgICAgY29uc3RydWN0b3IocCkgeyB9XHJcbiAgICAgICogICAgICAgICBzdGF0aWMgc3RhdGljTWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgbWV0aG9kKHApIHsgfVxyXG4gICAgICAqICAgICB9XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gY29uc3RydWN0b3JcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRNZXRhZGF0YUtleXMoRXhhbXBsZSk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gcHJvcGVydHkgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUucHJvdG90eXBlLCBcInByb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGFLZXlzKEV4YW1wbGUsIFwic3RhdGljTWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIG1ldGhvZCAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGdldE1ldGFkYXRhS2V5cyh0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIGlmICghSXNPYmplY3QodGFyZ2V0KSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIGlmICghSXNVbmRlZmluZWQodGFyZ2V0S2V5KSlcclxuICAgICAgICAgICAgdGFyZ2V0S2V5ID0gVG9Qcm9wZXJ0eUtleSh0YXJnZXRLZXkpO1xyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeU1ldGFkYXRhS2V5cyh0YXJnZXQsIHRhcmdldEtleSk7XHJcbiAgICB9XHJcbiAgICBSZWZsZWN0LmdldE1ldGFkYXRhS2V5cyA9IGdldE1ldGFkYXRhS2V5cztcclxuICAgIC8qKlxyXG4gICAgICAqIEdldHMgdGhlIHVuaXF1ZSBtZXRhZGF0YSBrZXlzIGRlZmluZWQgb24gdGhlIHRhcmdldCBvYmplY3QuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBBbiBhcnJheSBvZiB1bmlxdWUgbWV0YWRhdGEga2V5cy5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGFLZXlzKEV4YW1wbGUpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBjb25zdHJ1Y3RvcilcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZSwgXCJzdGF0aWNQcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gcHJvdG90eXBlKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhS2V5cyhFeGFtcGxlLCBcInN0YXRpY01ldGhvZFwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIHByb3RvdHlwZSlcclxuICAgICAgKiAgICAgcmVzdWx0ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMoRXhhbXBsZS5wcm90b3R5cGUsIFwibWV0aG9kXCIpO1xyXG4gICAgICAqXHJcbiAgICAgICovXHJcbiAgICBmdW5jdGlvbiBnZXRPd25NZXRhZGF0YUtleXModGFyZ2V0LCB0YXJnZXRLZXkpIHtcclxuICAgICAgICBpZiAoIUlzT2JqZWN0KHRhcmdldCkpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICBpZiAoIUlzVW5kZWZpbmVkKHRhcmdldEtleSkpXHJcbiAgICAgICAgICAgIHRhcmdldEtleSA9IFRvUHJvcGVydHlLZXkodGFyZ2V0S2V5KTtcclxuICAgICAgICByZXR1cm4gT3JkaW5hcnlPd25NZXRhZGF0YUtleXModGFyZ2V0LCB0YXJnZXRLZXkpO1xyXG4gICAgfVxyXG4gICAgUmVmbGVjdC5nZXRPd25NZXRhZGF0YUtleXMgPSBnZXRPd25NZXRhZGF0YUtleXM7XHJcbiAgICAvKipcclxuICAgICAgKiBEZWxldGVzIHRoZSBtZXRhZGF0YSBlbnRyeSBmcm9tIHRoZSB0YXJnZXQgb2JqZWN0IHdpdGggdGhlIHByb3ZpZGVkIGtleS5cclxuICAgICAgKiBAcGFyYW0gbWV0YWRhdGFLZXkgQSBrZXkgdXNlZCB0byBzdG9yZSBhbmQgcmV0cmlldmUgbWV0YWRhdGEuXHJcbiAgICAgICogQHBhcmFtIHRhcmdldCBUaGUgdGFyZ2V0IG9iamVjdCBvbiB3aGljaCB0aGUgbWV0YWRhdGEgaXMgZGVmaW5lZC5cclxuICAgICAgKiBAcGFyYW0gdGFyZ2V0S2V5IChPcHRpb25hbCkgVGhlIHByb3BlcnR5IGtleSBmb3IgdGhlIHRhcmdldC5cclxuICAgICAgKiBAcmV0dXJucyBgdHJ1ZWAgaWYgdGhlIG1ldGFkYXRhIGVudHJ5IHdhcyBmb3VuZCBhbmQgZGVsZXRlZDsgb3RoZXJ3aXNlLCBmYWxzZS5cclxuICAgICAgKiBAZXhhbXBsZVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIGNsYXNzIEV4YW1wbGUge1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHkgZGVjbGFyYXRpb25zIGFyZSBub3QgcGFydCBvZiBFUzYsIHRob3VnaCB0aGV5IGFyZSB2YWxpZCBpbiBUeXBlU2NyaXB0OlxyXG4gICAgICAqICAgICAgICAgLy8gc3RhdGljIHN0YXRpY1Byb3BlcnR5O1xyXG4gICAgICAqICAgICAgICAgLy8gcHJvcGVydHk7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgICAgIGNvbnN0cnVjdG9yKHApIHsgfVxyXG4gICAgICAqICAgICAgICAgc3RhdGljIHN0YXRpY01ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgICAgIG1ldGhvZChwKSB7IH1cclxuICAgICAgKiAgICAgfVxyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIGNvbnN0cnVjdG9yXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBwcm9wZXJ0eSAob24gY29uc3RydWN0b3IpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLCBcInN0YXRpY1Byb3BlcnR5XCIpO1xyXG4gICAgICAqXHJcbiAgICAgICogICAgIC8vIHByb3BlcnR5IChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJwcm9wZXJ0eVwiKTtcclxuICAgICAgKlxyXG4gICAgICAqICAgICAvLyBtZXRob2QgKG9uIGNvbnN0cnVjdG9yKVxyXG4gICAgICAqICAgICByZXN1bHQgPSBSZWZsZWN0LmRlbGV0ZU1ldGFkYXRhKFwiY3VzdG9tOmFubm90YXRpb25cIiwgRXhhbXBsZSwgXCJzdGF0aWNNZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKiAgICAgLy8gbWV0aG9kIChvbiBwcm90b3R5cGUpXHJcbiAgICAgICogICAgIHJlc3VsdCA9IFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEoXCJjdXN0b206YW5ub3RhdGlvblwiLCBFeGFtcGxlLnByb3RvdHlwZSwgXCJtZXRob2RcIik7XHJcbiAgICAgICpcclxuICAgICAgKi9cclxuICAgIGZ1bmN0aW9uIGRlbGV0ZU1ldGFkYXRhKG1ldGFkYXRhS2V5LCB0YXJnZXQsIHRhcmdldEtleSkge1xyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI2RlbGV0ZW1ldGFkYXRhLW1ldGFkYXRha2V5LXAtXHJcbiAgICAgICAgaWYgKCFJc09iamVjdCh0YXJnZXQpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgaWYgKCFJc1VuZGVmaW5lZCh0YXJnZXRLZXkpKVxyXG4gICAgICAgICAgICB0YXJnZXRLZXkgPSBUb1Byb3BlcnR5S2V5KHRhcmdldEtleSk7XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcCh0YXJnZXQsIHRhcmdldEtleSwgLypjcmVhdGUqLyBmYWxzZSk7XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICghbWV0YWRhdGFNYXAuZGVsZXRlKG1ldGFkYXRhS2V5KSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmIChtZXRhZGF0YU1hcC5zaXplID4gMClcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgdmFyIHRhcmdldE1ldGFkYXRhID0gTWV0YWRhdGEuZ2V0KHRhcmdldCk7XHJcbiAgICAgICAgdGFyZ2V0TWV0YWRhdGEuZGVsZXRlKHRhcmdldEtleSk7XHJcbiAgICAgICAgaWYgKHRhcmdldE1ldGFkYXRhLnNpemUgPiAwKVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICBNZXRhZGF0YS5kZWxldGUodGFyZ2V0KTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIFJlZmxlY3QuZGVsZXRlTWV0YWRhdGEgPSBkZWxldGVNZXRhZGF0YTtcclxuICAgIGZ1bmN0aW9uIERlY29yYXRlQ29uc3RydWN0b3IoZGVjb3JhdG9ycywgdGFyZ2V0KSB7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcclxuICAgICAgICAgICAgdmFyIGRlY29yYXRvciA9IGRlY29yYXRvcnNbaV07XHJcbiAgICAgICAgICAgIHZhciBkZWNvcmF0ZWQgPSBkZWNvcmF0b3IodGFyZ2V0KTtcclxuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChkZWNvcmF0ZWQpICYmICFJc051bGwoZGVjb3JhdGVkKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc0NvbnN0cnVjdG9yKGRlY29yYXRlZCkpXHJcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gZGVjb3JhdGVkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0YXJnZXQ7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBEZWNvcmF0ZVByb3BlcnR5KGRlY29yYXRvcnMsIHRhcmdldCwgcHJvcGVydHlLZXksIGRlc2NyaXB0b3IpIHtcclxuICAgICAgICBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xyXG4gICAgICAgICAgICB2YXIgZGVjb3JhdG9yID0gZGVjb3JhdG9yc1tpXTtcclxuICAgICAgICAgICAgdmFyIGRlY29yYXRlZCA9IGRlY29yYXRvcih0YXJnZXQsIHByb3BlcnR5S2V5LCBkZXNjcmlwdG9yKTtcclxuICAgICAgICAgICAgaWYgKCFJc1VuZGVmaW5lZChkZWNvcmF0ZWQpICYmICFJc051bGwoZGVjb3JhdGVkKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChkZWNvcmF0ZWQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgICAgIGRlc2NyaXB0b3IgPSBkZWNvcmF0ZWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIENyZWF0ZSkge1xyXG4gICAgICAgIHZhciB0YXJnZXRNZXRhZGF0YSA9IE1ldGFkYXRhLmdldChPKTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQodGFyZ2V0TWV0YWRhdGEpKSB7XHJcbiAgICAgICAgICAgIGlmICghQ3JlYXRlKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgdGFyZ2V0TWV0YWRhdGEgPSBuZXcgX01hcCgpO1xyXG4gICAgICAgICAgICBNZXRhZGF0YS5zZXQoTywgdGFyZ2V0TWV0YWRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSB0YXJnZXRNZXRhZGF0YS5nZXQoUCk7XHJcbiAgICAgICAgaWYgKElzVW5kZWZpbmVkKG1ldGFkYXRhTWFwKSkge1xyXG4gICAgICAgICAgICBpZiAoIUNyZWF0ZSlcclxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgIG1ldGFkYXRhTWFwID0gbmV3IF9NYXAoKTtcclxuICAgICAgICAgICAgdGFyZ2V0TWV0YWRhdGEuc2V0KFAsIG1ldGFkYXRhTWFwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1ldGFkYXRhTWFwO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnkgT2JqZWN0IEludGVybmFsIE1ldGhvZHMgYW5kIEludGVybmFsIFNsb3RzXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeS1vYmplY3QtaW50ZXJuYWwtbWV0aG9kcy1hbmQtaW50ZXJuYWwtc2xvdHNcclxuICAgIC8vIE9yZGluYXJ5SGFzTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeWhhc21ldGFkYXRhLS1tZXRhZGF0YWtleS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XHJcbiAgICAgICAgdmFyIGhhc093biA9IE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xyXG4gICAgICAgIGlmIChoYXNPd24pXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xyXG4gICAgICAgIGlmICghSXNOdWxsKHBhcmVudCkpXHJcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUhhc01ldGFkYXRhKE1ldGFkYXRhS2V5LCBwYXJlbnQsIFApO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeWhhc293bm1ldGFkYXRhLS1tZXRhZGF0YWtleS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeUhhc093bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICBpZiAoSXNVbmRlZmluZWQobWV0YWRhdGFNYXApKVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIFRvQm9vbGVhbihtZXRhZGF0YU1hcC5oYXMoTWV0YWRhdGFLZXkpKTtcclxuICAgIH1cclxuICAgIC8vIE9yZGluYXJ5R2V0TWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vcmJ1Y2t0b24vUmVmbGVjdERlY29yYXRvcnMvYmxvYi9tYXN0ZXIvc3BlYy9tZXRhZGF0YS5tZCNvcmRpbmFyeWdldG1ldGFkYXRhLS1tZXRhZGF0YWtleS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeUdldE1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKSB7XHJcbiAgICAgICAgdmFyIGhhc093biA9IE9yZGluYXJ5SGFzT3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApO1xyXG4gICAgICAgIGlmIChoYXNPd24pXHJcbiAgICAgICAgICAgIHJldHVybiBPcmRpbmFyeUdldE93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBPLCBQKTtcclxuICAgICAgICB2YXIgcGFyZW50ID0gT3JkaW5hcnlHZXRQcm90b3R5cGVPZihPKTtcclxuICAgICAgICBpZiAoIUlzTnVsbChwYXJlbnQpKVxyXG4gICAgICAgICAgICByZXR1cm4gT3JkaW5hcnlHZXRNZXRhZGF0YShNZXRhZGF0YUtleSwgcGFyZW50LCBQKTtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlHZXRPd25NZXRhZGF0YShNZXRhZGF0YUtleSwgTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5Z2V0b3dubWV0YWRhdGEtLW1ldGFkYXRha2V5LW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0T3duTWV0YWRhdGEoTWV0YWRhdGFLZXksIE8sIFApIHtcclxuICAgICAgICB2YXIgbWV0YWRhdGFNYXAgPSBHZXRPckNyZWF0ZU1ldGFkYXRhTWFwKE8sIFAsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXHJcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgcmV0dXJuIG1ldGFkYXRhTWFwLmdldChNZXRhZGF0YUtleSk7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlLCBPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnlkZWZpbmVvd25tZXRhZGF0YS0tbWV0YWRhdGFrZXktbWV0YWRhdGF2YWx1ZS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeURlZmluZU93bk1ldGFkYXRhKE1ldGFkYXRhS2V5LCBNZXRhZGF0YVZhbHVlLCBPLCBQKSB7XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKmNyZWF0ZSovIHRydWUpO1xyXG4gICAgICAgIG1ldGFkYXRhTWFwLnNldChNZXRhZGF0YUtleSwgTWV0YWRhdGFWYWx1ZSk7XHJcbiAgICB9XHJcbiAgICAvLyBPcmRpbmFyeU1ldGFkYXRhS2V5cyhPLCBQKVxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3JidWNrdG9uL1JlZmxlY3REZWNvcmF0b3JzL2Jsb2IvbWFzdGVyL3NwZWMvbWV0YWRhdGEubWQjb3JkaW5hcnltZXRhZGF0YWtleXMtLW8tcC1cclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5TWV0YWRhdGFLZXlzKE8sIFApIHtcclxuICAgICAgICB2YXIgb3duS2V5cyA9IE9yZGluYXJ5T3duTWV0YWRhdGFLZXlzKE8sIFApO1xyXG4gICAgICAgIHZhciBwYXJlbnQgPSBPcmRpbmFyeUdldFByb3RvdHlwZU9mKE8pO1xyXG4gICAgICAgIGlmIChwYXJlbnQgPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiBvd25LZXlzO1xyXG4gICAgICAgIHZhciBwYXJlbnRLZXlzID0gT3JkaW5hcnlNZXRhZGF0YUtleXMocGFyZW50LCBQKTtcclxuICAgICAgICBpZiAocGFyZW50S2V5cy5sZW5ndGggPD0gMClcclxuICAgICAgICAgICAgcmV0dXJuIG93bktleXM7XHJcbiAgICAgICAgaWYgKG93bktleXMubGVuZ3RoIDw9IDApXHJcbiAgICAgICAgICAgIHJldHVybiBwYXJlbnRLZXlzO1xyXG4gICAgICAgIHZhciBzZXQgPSBuZXcgX1NldCgpO1xyXG4gICAgICAgIHZhciBrZXlzID0gW107XHJcbiAgICAgICAgZm9yICh2YXIgX2kgPSAwLCBvd25LZXlzXzEgPSBvd25LZXlzOyBfaSA8IG93bktleXNfMS5sZW5ndGg7IF9pKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IG93bktleXNfMVtfaV07XHJcbiAgICAgICAgICAgIHZhciBoYXNLZXkgPSBzZXQuaGFzKGtleSk7XHJcbiAgICAgICAgICAgIGlmICghaGFzS2V5KSB7XHJcbiAgICAgICAgICAgICAgICBzZXQuYWRkKGtleSk7XHJcbiAgICAgICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKHZhciBfYSA9IDAsIHBhcmVudEtleXNfMSA9IHBhcmVudEtleXM7IF9hIDwgcGFyZW50S2V5c18xLmxlbmd0aDsgX2ErKykge1xyXG4gICAgICAgICAgICB2YXIga2V5ID0gcGFyZW50S2V5c18xW19hXTtcclxuICAgICAgICAgICAgdmFyIGhhc0tleSA9IHNldC5oYXMoa2V5KTtcclxuICAgICAgICAgICAgaWYgKCFoYXNLZXkpIHtcclxuICAgICAgICAgICAgICAgIHNldC5hZGQoa2V5KTtcclxuICAgICAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgfVxyXG4gICAgLy8gT3JkaW5hcnlPd25NZXRhZGF0YUtleXMoTywgUClcclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9yYnVja3Rvbi9SZWZsZWN0RGVjb3JhdG9ycy9ibG9iL21hc3Rlci9zcGVjL21ldGFkYXRhLm1kI29yZGluYXJ5b3dubWV0YWRhdGFrZXlzLS1vLXAtXHJcbiAgICBmdW5jdGlvbiBPcmRpbmFyeU93bk1ldGFkYXRhS2V5cyhPLCBQKSB7XHJcbiAgICAgICAgdmFyIG1ldGFkYXRhTWFwID0gR2V0T3JDcmVhdGVNZXRhZGF0YU1hcChPLCBQLCAvKmNyZWF0ZSovIGZhbHNlKTtcclxuICAgICAgICB2YXIga2V5cyA9IFtdO1xyXG4gICAgICAgIGlmIChJc1VuZGVmaW5lZChtZXRhZGF0YU1hcCkpXHJcbiAgICAgICAgICAgIHJldHVybiBrZXlzO1xyXG4gICAgICAgIHZhciBrZXlzT2JqID0gbWV0YWRhdGFNYXAua2V5cygpO1xyXG4gICAgICAgIHZhciBpdGVyYXRvciA9IEdldEl0ZXJhdG9yKGtleXNPYmopO1xyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXh0ID0gSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGlmICghbmV4dClcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4ga2V5cztcclxuICAgICAgICAgICAgICAgIHZhciBuZXh0VmFsdWUgPSBJdGVyYXRvclZhbHVlKG5leHQpO1xyXG4gICAgICAgICAgICAgICAga2V5cy5wdXNoKG5leHRWYWx1ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5leHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBJdGVyYXRvckNsb3NlKGl0ZXJhdG9yKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBmaW5hbGx5IHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGZpbmFsbHkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5leHQpXHJcbiAgICAgICAgICAgICAgICAgICAgSXRlcmF0b3JDbG9zZShpdGVyYXRvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBFQ01BU2NyaXB0IFNwZWNpZmljYXRpb25cclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi9cclxuICAgIC8vIDYgRUNNQVNjcmlwdCBEYXRhIFR5cDBlcyBhbmQgVmFsdWVzXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWRhdGEtdHlwZXMtYW5kLXZhbHVlc1xyXG4gICAgZnVuY3Rpb24gVHlwZSh4KSB7XHJcbiAgICAgICAgaWYgKHggPT09IG51bGwpXHJcbiAgICAgICAgICAgIHJldHVybiAxIC8qIE51bGwgKi87XHJcbiAgICAgICAgc3dpdGNoICh0eXBlb2YgeCkge1xyXG4gICAgICAgICAgICBjYXNlIFwidW5kZWZpbmVkXCI6IHJldHVybiAwIC8qIFVuZGVmaW5lZCAqLztcclxuICAgICAgICAgICAgY2FzZSBcImJvb2xlYW5cIjogcmV0dXJuIDIgLyogQm9vbGVhbiAqLztcclxuICAgICAgICAgICAgY2FzZSBcInN0cmluZ1wiOiByZXR1cm4gMyAvKiBTdHJpbmcgKi87XHJcbiAgICAgICAgICAgIGNhc2UgXCJzeW1ib2xcIjogcmV0dXJuIDQgLyogU3ltYm9sICovO1xyXG4gICAgICAgICAgICBjYXNlIFwibnVtYmVyXCI6IHJldHVybiA1IC8qIE51bWJlciAqLztcclxuICAgICAgICAgICAgY2FzZSBcIm9iamVjdFwiOiByZXR1cm4geCA9PT0gbnVsbCA/IDEgLyogTnVsbCAqLyA6IDYgLyogT2JqZWN0ICovO1xyXG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gNiAvKiBPYmplY3QgKi87XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy8gNi4xLjEgVGhlIFVuZGVmaW5lZCBUeXBlXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLXVuZGVmaW5lZC10eXBlXHJcbiAgICBmdW5jdGlvbiBJc1VuZGVmaW5lZCh4KSB7XHJcbiAgICAgICAgcmV0dXJuIHggPT09IHVuZGVmaW5lZDtcclxuICAgIH1cclxuICAgIC8vIDYuMS4yIFRoZSBOdWxsIFR5cGVcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWVjbWFzY3JpcHQtbGFuZ3VhZ2UtdHlwZXMtbnVsbC10eXBlXHJcbiAgICBmdW5jdGlvbiBJc051bGwoeCkge1xyXG4gICAgICAgIHJldHVybiB4ID09PSBudWxsO1xyXG4gICAgfVxyXG4gICAgLy8gNi4xLjUgVGhlIFN5bWJvbCBUeXBlXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1lY21hc2NyaXB0LWxhbmd1YWdlLXR5cGVzLXN5bWJvbC10eXBlXHJcbiAgICBmdW5jdGlvbiBJc1N5bWJvbCh4KSB7XHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSBcInN5bWJvbFwiO1xyXG4gICAgfVxyXG4gICAgLy8gNi4xLjcgVGhlIE9iamVjdCBUeXBlXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1vYmplY3QtdHlwZVxyXG4gICAgZnVuY3Rpb24gSXNPYmplY3QoeCkge1xyXG4gICAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gXCJvYmplY3RcIiA/IHggIT09IG51bGwgOiB0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiO1xyXG4gICAgfVxyXG4gICAgLy8gNy4xIFR5cGUgQ29udmVyc2lvblxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdHlwZS1jb252ZXJzaW9uXHJcbiAgICAvLyA3LjEuMSBUb1ByaW1pdGl2ZShpbnB1dCBbLCBQcmVmZXJyZWRUeXBlXSlcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLXRvcHJpbWl0aXZlXHJcbiAgICBmdW5jdGlvbiBUb1ByaW1pdGl2ZShpbnB1dCwgUHJlZmVycmVkVHlwZSkge1xyXG4gICAgICAgIHN3aXRjaCAoVHlwZShpbnB1dCkpIHtcclxuICAgICAgICAgICAgY2FzZSAwIC8qIFVuZGVmaW5lZCAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgICAgICBjYXNlIDEgLyogTnVsbCAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgICAgICBjYXNlIDIgLyogQm9vbGVhbiAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgICAgICBjYXNlIDMgLyogU3RyaW5nICovOiByZXR1cm4gaW5wdXQ7XHJcbiAgICAgICAgICAgIGNhc2UgNCAvKiBTeW1ib2wgKi86IHJldHVybiBpbnB1dDtcclxuICAgICAgICAgICAgY2FzZSA1IC8qIE51bWJlciAqLzogcmV0dXJuIGlucHV0O1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgaGludCA9IFByZWZlcnJlZFR5cGUgPT09IDMgLyogU3RyaW5nICovID8gXCJzdHJpbmdcIiA6IFByZWZlcnJlZFR5cGUgPT09IDUgLyogTnVtYmVyICovID8gXCJudW1iZXJcIiA6IFwiZGVmYXVsdFwiO1xyXG4gICAgICAgIHZhciBleG90aWNUb1ByaW0gPSBHZXRNZXRob2QoaW5wdXQsIHRvUHJpbWl0aXZlU3ltYm9sKTtcclxuICAgICAgICBpZiAoZXhvdGljVG9QcmltICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGV4b3RpY1RvUHJpbS5jYWxsKGlucHV0LCBoaW50KTtcclxuICAgICAgICAgICAgaWYgKElzT2JqZWN0KHJlc3VsdCkpXHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBPcmRpbmFyeVRvUHJpbWl0aXZlKGlucHV0LCBoaW50ID09PSBcImRlZmF1bHRcIiA/IFwibnVtYmVyXCIgOiBoaW50KTtcclxuICAgIH1cclxuICAgIC8vIDcuMS4xLjEgT3JkaW5hcnlUb1ByaW1pdGl2ZShPLCBoaW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnl0b3ByaW1pdGl2ZVxyXG4gICAgZnVuY3Rpb24gT3JkaW5hcnlUb1ByaW1pdGl2ZShPLCBoaW50KSB7XHJcbiAgICAgICAgaWYgKGhpbnQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdmFyIHRvU3RyaW5nXzEgPSBPLnRvU3RyaW5nO1xyXG4gICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh0b1N0cmluZ18xKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHRvU3RyaW5nXzEuY2FsbChPKTtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZU9mID0gTy52YWx1ZU9mO1xyXG4gICAgICAgICAgICBpZiAoSXNDYWxsYWJsZSh2YWx1ZU9mKSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHZhbHVlT2YuY2FsbChPKTtcclxuICAgICAgICAgICAgICAgIGlmICghSXNPYmplY3QocmVzdWx0KSlcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWVPZiA9IE8udmFsdWVPZjtcclxuICAgICAgICAgICAgaWYgKElzQ2FsbGFibGUodmFsdWVPZikpIHtcclxuICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB2YWx1ZU9mLmNhbGwoTyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoIUlzT2JqZWN0KHJlc3VsdCkpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgdG9TdHJpbmdfMiA9IE8udG9TdHJpbmc7XHJcbiAgICAgICAgICAgIGlmIChJc0NhbGxhYmxlKHRvU3RyaW5nXzIpKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gdG9TdHJpbmdfMi5jYWxsKE8pO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFJc09iamVjdChyZXN1bHQpKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgfVxyXG4gICAgLy8gNy4xLjIgVG9Cb29sZWFuKGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLzIwMTYvI3NlYy10b2Jvb2xlYW5cclxuICAgIGZ1bmN0aW9uIFRvQm9vbGVhbihhcmd1bWVudCkge1xyXG4gICAgICAgIHJldHVybiAhIWFyZ3VtZW50O1xyXG4gICAgfVxyXG4gICAgLy8gNy4xLjEyIFRvU3RyaW5nKGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9zdHJpbmdcclxuICAgIGZ1bmN0aW9uIFRvU3RyaW5nKGFyZ3VtZW50KSB7XHJcbiAgICAgICAgcmV0dXJuIFwiXCIgKyBhcmd1bWVudDtcclxuICAgIH1cclxuICAgIC8vIDcuMS4xNCBUb1Byb3BlcnR5S2V5KGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdG9wcm9wZXJ0eWtleVxyXG4gICAgZnVuY3Rpb24gVG9Qcm9wZXJ0eUtleShhcmd1bWVudCkge1xyXG4gICAgICAgIHZhciBrZXkgPSBUb1ByaW1pdGl2ZShhcmd1bWVudCwgMyAvKiBTdHJpbmcgKi8pO1xyXG4gICAgICAgIGlmIChJc1N5bWJvbChrZXkpKVxyXG4gICAgICAgICAgICByZXR1cm4ga2V5O1xyXG4gICAgICAgIHJldHVybiBUb1N0cmluZyhrZXkpO1xyXG4gICAgfVxyXG4gICAgLy8gNy4yIFRlc3RpbmcgYW5kIENvbXBhcmlzb24gT3BlcmF0aW9uc1xyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtdGVzdGluZy1hbmQtY29tcGFyaXNvbi1vcGVyYXRpb25zXHJcbiAgICAvLyA3LjIuMiBJc0FycmF5KGFyZ3VtZW50KVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXNhcnJheVxyXG4gICAgZnVuY3Rpb24gSXNBcnJheShhcmd1bWVudCkge1xyXG4gICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5XHJcbiAgICAgICAgICAgID8gQXJyYXkuaXNBcnJheShhcmd1bWVudClcclxuICAgICAgICAgICAgOiBhcmd1bWVudCBpbnN0YW5jZW9mIE9iamVjdFxyXG4gICAgICAgICAgICAgICAgPyBhcmd1bWVudCBpbnN0YW5jZW9mIEFycmF5XHJcbiAgICAgICAgICAgICAgICA6IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcmd1bWVudCkgPT09IFwiW29iamVjdCBBcnJheV1cIjtcclxuICAgIH1cclxuICAgIC8vIDcuMi4zIElzQ2FsbGFibGUoYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2NhbGxhYmxlXHJcbiAgICBmdW5jdGlvbiBJc0NhbGxhYmxlKGFyZ3VtZW50KSB7XHJcbiAgICAgICAgLy8gTk9URTogVGhpcyBpcyBhbiBhcHByb3hpbWF0aW9uIGFzIHdlIGNhbm5vdCBjaGVjayBmb3IgW1tDYWxsXV0gaW50ZXJuYWwgbWV0aG9kLlxyXG4gICAgICAgIHJldHVybiB0eXBlb2YgYXJndW1lbnQgPT09IFwiZnVuY3Rpb25cIjtcclxuICAgIH1cclxuICAgIC8vIDcuMi40IElzQ29uc3RydWN0b3IoYXJndW1lbnQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvI3NlYy1pc2NvbnN0cnVjdG9yXHJcbiAgICBmdW5jdGlvbiBJc0NvbnN0cnVjdG9yKGFyZ3VtZW50KSB7XHJcbiAgICAgICAgLy8gTk9URTogVGhpcyBpcyBhbiBhcHByb3hpbWF0aW9uIGFzIHdlIGNhbm5vdCBjaGVjayBmb3IgW1tDb25zdHJ1Y3RdXSBpbnRlcm5hbCBtZXRob2QuXHJcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBhcmd1bWVudCA9PT0gXCJmdW5jdGlvblwiO1xyXG4gICAgfVxyXG4gICAgLy8gNy4zIE9wZXJhdGlvbnMgb24gT2JqZWN0c1xyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3BlcmF0aW9ucy1vbi1vYmplY3RzXHJcbiAgICAvLyA3LjMuOSBHZXRNZXRob2QoViwgUClcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWdldG1ldGhvZFxyXG4gICAgZnVuY3Rpb24gR2V0TWV0aG9kKFYsIFApIHtcclxuICAgICAgICB2YXIgZnVuYyA9IFZbUF07XHJcbiAgICAgICAgaWYgKGZ1bmMgPT09IHVuZGVmaW5lZCB8fCBmdW5jID09PSBudWxsKVxyXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgICAgIGlmICghSXNDYWxsYWJsZShmdW5jKSlcclxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xyXG4gICAgICAgIHJldHVybiBmdW5jO1xyXG4gICAgfVxyXG4gICAgLy8gNy40IE9wZXJhdGlvbnMgb24gSXRlcmF0b3IgT2JqZWN0c1xyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3BlcmF0aW9ucy1vbi1pdGVyYXRvci1vYmplY3RzXHJcbiAgICBmdW5jdGlvbiBHZXRJdGVyYXRvcihvYmopIHtcclxuICAgICAgICB2YXIgbWV0aG9kID0gR2V0TWV0aG9kKG9iaiwgaXRlcmF0b3JTeW1ib2wpO1xyXG4gICAgICAgIGlmICghSXNDYWxsYWJsZShtZXRob2QpKVxyXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7IC8vIGZyb20gQ2FsbFxyXG4gICAgICAgIHZhciBpdGVyYXRvciA9IG1ldGhvZC5jYWxsKG9iaik7XHJcbiAgICAgICAgaWYgKCFJc09iamVjdChpdGVyYXRvcikpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcclxuICAgICAgICByZXR1cm4gaXRlcmF0b3I7XHJcbiAgICB9XHJcbiAgICAvLyA3LjQuNCBJdGVyYXRvclZhbHVlKGl0ZXJSZXN1bHQpXHJcbiAgICAvLyBodHRwczovL3RjMzkuZ2l0aHViLmlvL2VjbWEyNjIvMjAxNi8jc2VjLWl0ZXJhdG9ydmFsdWVcclxuICAgIGZ1bmN0aW9uIEl0ZXJhdG9yVmFsdWUoaXRlclJlc3VsdCkge1xyXG4gICAgICAgIHJldHVybiBpdGVyUmVzdWx0LnZhbHVlO1xyXG4gICAgfVxyXG4gICAgLy8gNy40LjUgSXRlcmF0b3JTdGVwKGl0ZXJhdG9yKVxyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtaXRlcmF0b3JzdGVwXHJcbiAgICBmdW5jdGlvbiBJdGVyYXRvclN0ZXAoaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgcmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQuZG9uZSA/IGZhbHNlIDogcmVzdWx0O1xyXG4gICAgfVxyXG4gICAgLy8gNy40LjYgSXRlcmF0b3JDbG9zZShpdGVyYXRvciwgY29tcGxldGlvbilcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLWl0ZXJhdG9yY2xvc2VcclxuICAgIGZ1bmN0aW9uIEl0ZXJhdG9yQ2xvc2UoaXRlcmF0b3IpIHtcclxuICAgICAgICB2YXIgZiA9IGl0ZXJhdG9yW1wicmV0dXJuXCJdO1xyXG4gICAgICAgIGlmIChmKVxyXG4gICAgICAgICAgICBmLmNhbGwoaXRlcmF0b3IpO1xyXG4gICAgfVxyXG4gICAgLy8gOS4xIE9yZGluYXJ5IE9iamVjdCBJbnRlcm5hbCBNZXRob2RzIGFuZCBJbnRlcm5hbCBTbG90c1xyXG4gICAgLy8gaHR0cHM6Ly90YzM5LmdpdGh1Yi5pby9lY21hMjYyLyNzZWMtb3JkaW5hcnktb2JqZWN0LWludGVybmFsLW1ldGhvZHMtYW5kLWludGVybmFsLXNsb3RzXHJcbiAgICAvLyA5LjEuMS4xIE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTylcclxuICAgIC8vIGh0dHBzOi8vdGMzOS5naXRodWIuaW8vZWNtYTI2Mi8jc2VjLW9yZGluYXJ5Z2V0cHJvdG90eXBlb2ZcclxuICAgIGZ1bmN0aW9uIE9yZGluYXJ5R2V0UHJvdG90eXBlT2YoTykge1xyXG4gICAgICAgIHZhciBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihPKTtcclxuICAgICAgICBpZiAodHlwZW9mIE8gIT09IFwiZnVuY3Rpb25cIiB8fCBPID09PSBmdW5jdGlvblByb3RvdHlwZSlcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xyXG4gICAgICAgIC8vIFR5cGVTY3JpcHQgZG9lc24ndCBzZXQgX19wcm90b19fIGluIEVTNSwgYXMgaXQncyBub24tc3RhbmRhcmQuXHJcbiAgICAgICAgLy8gVHJ5IHRvIGRldGVybWluZSB0aGUgc3VwZXJjbGFzcyBjb25zdHJ1Y3Rvci4gQ29tcGF0aWJsZSBpbXBsZW1lbnRhdGlvbnNcclxuICAgICAgICAvLyBtdXN0IGVpdGhlciBzZXQgX19wcm90b19fIG9uIGEgc3ViY2xhc3MgY29uc3RydWN0b3IgdG8gdGhlIHN1cGVyY2xhc3MgY29uc3RydWN0b3IsXHJcbiAgICAgICAgLy8gb3IgZW5zdXJlIGVhY2ggY2xhc3MgaGFzIGEgdmFsaWQgYGNvbnN0cnVjdG9yYCBwcm9wZXJ0eSBvbiBpdHMgcHJvdG90eXBlIHRoYXRcclxuICAgICAgICAvLyBwb2ludHMgYmFjayB0byB0aGUgY29uc3RydWN0b3IuXHJcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgdGhlIHNhbWUgYXMgRnVuY3Rpb24uW1tQcm90b3R5cGVdXSwgdGhlbiB0aGlzIGlzIGRlZmluYXRlbHkgaW5oZXJpdGVkLlxyXG4gICAgICAgIC8vIFRoaXMgaXMgdGhlIGNhc2Ugd2hlbiBpbiBFUzYgb3Igd2hlbiB1c2luZyBfX3Byb3RvX18gaW4gYSBjb21wYXRpYmxlIGJyb3dzZXIuXHJcbiAgICAgICAgaWYgKHByb3RvICE9PSBmdW5jdGlvblByb3RvdHlwZSlcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xyXG4gICAgICAgIC8vIElmIHRoZSBzdXBlciBwcm90b3R5cGUgaXMgT2JqZWN0LnByb3RvdHlwZSwgbnVsbCwgb3IgdW5kZWZpbmVkLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxyXG4gICAgICAgIHZhciBwcm90b3R5cGUgPSBPLnByb3RvdHlwZTtcclxuICAgICAgICB2YXIgcHJvdG90eXBlUHJvdG8gPSBwcm90b3R5cGUgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSk7XHJcbiAgICAgICAgaWYgKHByb3RvdHlwZVByb3RvID09IG51bGwgfHwgcHJvdG90eXBlUHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUpXHJcbiAgICAgICAgICAgIHJldHVybiBwcm90bztcclxuICAgICAgICAvLyBJZiB0aGUgY29uc3RydWN0b3Igd2FzIG5vdCBhIGZ1bmN0aW9uLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxyXG4gICAgICAgIHZhciBjb25zdHJ1Y3RvciA9IHByb3RvdHlwZVByb3RvLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgIGlmICh0eXBlb2YgY29uc3RydWN0b3IgIT09IFwiZnVuY3Rpb25cIilcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xyXG4gICAgICAgIC8vIElmIHdlIGhhdmUgc29tZSBraW5kIG9mIHNlbGYtcmVmZXJlbmNlLCB0aGVuIHdlIGNhbm5vdCBkZXRlcm1pbmUgdGhlIGhlcml0YWdlLlxyXG4gICAgICAgIGlmIChjb25zdHJ1Y3RvciA9PT0gTylcclxuICAgICAgICAgICAgcmV0dXJuIHByb3RvO1xyXG4gICAgICAgIC8vIHdlIGhhdmUgYSBwcmV0dHkgZ29vZCBndWVzcyBhdCB0aGUgaGVyaXRhZ2UuXHJcbiAgICAgICAgcmV0dXJuIGNvbnN0cnVjdG9yO1xyXG4gICAgfVxyXG4gICAgLy8gbmFpdmUgTWFwIHNoaW1cclxuICAgIGZ1bmN0aW9uIENyZWF0ZU1hcFBvbHlmaWxsKCkge1xyXG4gICAgICAgIHZhciBjYWNoZVNlbnRpbmVsID0ge307XHJcbiAgICAgICAgdmFyIGFycmF5U2VudGluZWwgPSBbXTtcclxuICAgICAgICB2YXIgTWFwSXRlcmF0b3IgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBmdW5jdGlvbiBNYXBJdGVyYXRvcihrZXlzLCB2YWx1ZXMsIHNlbGVjdG9yKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0ga2V5cztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IHZhbHVlcztcclxuICAgICAgICAgICAgICAgIHRoaXMuX3NlbGVjdG9yID0gc2VsZWN0b3I7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlW1wiQEBpdGVyYXRvclwiXSA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH07XHJcbiAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzOyB9O1xyXG4gICAgICAgICAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2luZGV4O1xyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgaW5kZXggPCB0aGlzLl9rZXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSB0aGlzLl9zZWxlY3Rvcih0aGlzLl9rZXlzW2luZGV4XSwgdGhpcy5fdmFsdWVzW2luZGV4XSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluZGV4ICsgMSA+PSB0aGlzLl9rZXlzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9rZXlzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzID0gYXJyYXlTZW50aW5lbDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2luZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IHZhbHVlOiByZXN1bHQsIGRvbmU6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdW5kZWZpbmVkLCBkb25lOiB0cnVlIH07XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcEl0ZXJhdG9yLnByb3RvdHlwZS50aHJvdyA9IGZ1bmN0aW9uIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luZGV4ID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgTWFwSXRlcmF0b3IucHJvdG90eXBlLnJldHVybiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2luZGV4ID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbmRleCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBhcnJheVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IGFycmF5U2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4geyB2YWx1ZTogdmFsdWUsIGRvbmU6IHRydWUgfTtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmV0dXJuIE1hcEl0ZXJhdG9yO1xyXG4gICAgICAgIH0oKSk7XHJcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIE1hcCgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX2tleXMgPSBbXTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVJbmRleCA9IC0yO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXAucHJvdG90eXBlLCBcInNpemVcIiwge1xyXG4gICAgICAgICAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9rZXlzLmxlbmd0aDsgfSxcclxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpID49IDA7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fZmluZChrZXksIC8qaW5zZXJ0Ki8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4ID49IDAgPyB0aGlzLl92YWx1ZXNbaW5kZXhdIDogdW5kZWZpbmVkO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSB0aGlzLl9maW5kKGtleSwgLyppbnNlcnQqLyB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuX3ZhbHVlc1tpbmRleF0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2ZpbmQoa2V5LCAvKmluc2VydCovIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpemUgPSB0aGlzLl9rZXlzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gaW5kZXggKyAxOyBpIDwgc2l6ZTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2tleXNbaSAtIDFdID0gdGhpcy5fa2V5c1tpXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzW2kgLSAxXSA9IHRoaXMuX3ZhbHVlc1tpXTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5sZW5ndGgtLTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLl92YWx1ZXMubGVuZ3RoLS07XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGtleSA9PT0gdGhpcy5fY2FjaGVLZXkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fY2FjaGVLZXkgPSBjYWNoZVNlbnRpbmVsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5sZW5ndGggPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLmxlbmd0aCA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUtleSA9IGNhY2hlU2VudGluZWw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jYWNoZUluZGV4ID0gLTI7XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXBJdGVyYXRvcih0aGlzLl9rZXlzLCB0aGlzLl92YWx1ZXMsIGdldEtleSk7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUudmFsdWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMuX2tleXMsIHRoaXMuX3ZhbHVlcywgZ2V0VmFsdWUpOyB9O1xyXG4gICAgICAgICAgICBNYXAucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwSXRlcmF0b3IodGhpcy5fa2V5cywgdGhpcy5fdmFsdWVzLCBnZXRFbnRyeSk7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGVbXCJAQGl0ZXJhdG9yXCJdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5lbnRyaWVzKCk7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGVbaXRlcmF0b3JTeW1ib2xdID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5lbnRyaWVzKCk7IH07XHJcbiAgICAgICAgICAgIE1hcC5wcm90b3R5cGUuX2ZpbmQgPSBmdW5jdGlvbiAoa2V5LCBpbnNlcnQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9jYWNoZUtleSA9PT0ga2V5KVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWNoZUluZGV4O1xyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5fa2V5cy5pbmRleE9mKGtleSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPCAwICYmIGluc2VydCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gdGhpcy5fa2V5cy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fa2V5cy5wdXNoKGtleSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fdmFsdWVzLnB1c2godW5kZWZpbmVkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl9jYWNoZUtleSA9IGtleSwgdGhpcy5fY2FjaGVJbmRleCA9IGluZGV4O1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gTWFwO1xyXG4gICAgICAgIH0oKSk7XHJcbiAgICAgICAgZnVuY3Rpb24gZ2V0S2V5KGtleSwgXykge1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBnZXRWYWx1ZShfLCB2YWx1ZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZ1bmN0aW9uIGdldEVudHJ5KGtleSwgdmFsdWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFtrZXksIHZhbHVlXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvLyBuYWl2ZSBTZXQgc2hpbVxyXG4gICAgZnVuY3Rpb24gQ3JlYXRlU2V0UG9seWZpbGwoKSB7XHJcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIFNldCgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuX21hcCA9IG5ldyBfTWFwKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFNldC5wcm90b3R5cGUsIFwic2l6ZVwiLCB7XHJcbiAgICAgICAgICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC5zaXplOyB9LFxyXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAodmFsdWUpIHsgcmV0dXJuIHRoaXMuX21hcC5oYXModmFsdWUpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLnNldCh2YWx1ZSwgdmFsdWUpLCB0aGlzOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gdGhpcy5fbWFwLmRlbGV0ZSh2YWx1ZSk7IH07XHJcbiAgICAgICAgICAgIFNldC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbiAoKSB7IHRoaXMuX21hcC5jbGVhcigpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9tYXAua2V5cygpOyB9O1xyXG4gICAgICAgICAgICBTZXQucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX21hcC52YWx1ZXMoKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZS5lbnRyaWVzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbWFwLmVudHJpZXMoKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZVtcIkBAaXRlcmF0b3JcIl0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmtleXMoKTsgfTtcclxuICAgICAgICAgICAgU2V0LnByb3RvdHlwZVtpdGVyYXRvclN5bWJvbF0gPSBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLmtleXMoKTsgfTtcclxuICAgICAgICAgICAgcmV0dXJuIFNldDtcclxuICAgICAgICB9KCkpO1xyXG4gICAgfVxyXG4gICAgLy8gbmFpdmUgV2Vha01hcCBzaGltXHJcbiAgICBmdW5jdGlvbiBDcmVhdGVXZWFrTWFwUG9seWZpbGwoKSB7XHJcbiAgICAgICAgdmFyIFVVSURfU0laRSA9IDE2O1xyXG4gICAgICAgIHZhciBrZXlzID0gY3JlYXRlRGljdGlvbmFyeSgpO1xyXG4gICAgICAgIHZhciByb290S2V5ID0gQ3JlYXRlVW5pcXVlS2V5KCk7XHJcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIFdlYWtNYXAoKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9rZXkgPSBDcmVhdGVVbmlxdWVLZXkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBIYXNoTWFwLmhhcyh0YWJsZSwgdGhpcy5fa2V5KSA6IGZhbHNlO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBIYXNoTWFwLmdldCh0YWJsZSwgdGhpcy5fa2V5KSA6IHVuZGVmaW5lZDtcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgV2Vha01hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHRhcmdldCwgdmFsdWUpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0YWJsZSA9IEdldE9yQ3JlYXRlV2Vha01hcFRhYmxlKHRhcmdldCwgLypjcmVhdGUqLyB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRhYmxlW3RoaXMuX2tleV0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFibGUgPSBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIC8qY3JlYXRlKi8gZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlICE9PSB1bmRlZmluZWQgPyBkZWxldGUgdGFibGVbdGhpcy5fa2V5XSA6IGZhbHNlO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBXZWFrTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5PVEU6IG5vdCBhIHJlYWwgY2xlYXIsIGp1c3QgbWFrZXMgdGhlIHByZXZpb3VzIGRhdGEgdW5yZWFjaGFibGVcclxuICAgICAgICAgICAgICAgIHRoaXMuX2tleSA9IENyZWF0ZVVuaXF1ZUtleSgpO1xyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZXR1cm4gV2Vha01hcDtcclxuICAgICAgICB9KCkpO1xyXG4gICAgICAgIGZ1bmN0aW9uIENyZWF0ZVVuaXF1ZUtleSgpIHtcclxuICAgICAgICAgICAgdmFyIGtleTtcclxuICAgICAgICAgICAgZG9cclxuICAgICAgICAgICAgICAgIGtleSA9IFwiQEBXZWFrTWFwQEBcIiArIENyZWF0ZVVVSUQoKTtcclxuICAgICAgICAgICAgd2hpbGUgKEhhc2hNYXAuaGFzKGtleXMsIGtleSkpO1xyXG4gICAgICAgICAgICBrZXlzW2tleV0gPSB0cnVlO1xyXG4gICAgICAgICAgICByZXR1cm4ga2V5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBmdW5jdGlvbiBHZXRPckNyZWF0ZVdlYWtNYXBUYWJsZSh0YXJnZXQsIGNyZWF0ZSkge1xyXG4gICAgICAgICAgICBpZiAoIWhhc093bi5jYWxsKHRhcmdldCwgcm9vdEtleSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghY3JlYXRlKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbiAgICAgICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCByb290S2V5LCB7IHZhbHVlOiBjcmVhdGVEaWN0aW9uYXJ5KCkgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtyb290S2V5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gRmlsbFJhbmRvbUJ5dGVzKGJ1ZmZlciwgc2l6ZSkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7ICsraSlcclxuICAgICAgICAgICAgICAgIGJ1ZmZlcltpXSA9IE1hdGgucmFuZG9tKCkgKiAweGZmIHwgMDtcclxuICAgICAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gR2VuUmFuZG9tQnl0ZXMoc2l6ZSkge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkgPT09IFwiZnVuY3Rpb25cIikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjcnlwdG8gIT09IFwidW5kZWZpbmVkXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSkpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBtc0NyeXB0byAhPT0gXCJ1bmRlZmluZWRcIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbXNDcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KHNpemUpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBGaWxsUmFuZG9tQnl0ZXMobmV3IFVpbnQ4QXJyYXkoc2l6ZSksIHNpemUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBGaWxsUmFuZG9tQnl0ZXMobmV3IEFycmF5KHNpemUpLCBzaXplKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZnVuY3Rpb24gQ3JlYXRlVVVJRCgpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBHZW5SYW5kb21CeXRlcyhVVUlEX1NJWkUpO1xyXG4gICAgICAgICAgICAvLyBtYXJrIGFzIHJhbmRvbSAtIFJGQyA0MTIyIMKnIDQuNFxyXG4gICAgICAgICAgICBkYXRhWzZdID0gZGF0YVs2XSAmIDB4NGYgfCAweDQwO1xyXG4gICAgICAgICAgICBkYXRhWzhdID0gZGF0YVs4XSAmIDB4YmYgfCAweDgwO1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gXCJcIjtcclxuICAgICAgICAgICAgZm9yICh2YXIgb2Zmc2V0ID0gMDsgb2Zmc2V0IDwgVVVJRF9TSVpFOyArK29mZnNldCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGJ5dGUgPSBkYXRhW29mZnNldF07XHJcbiAgICAgICAgICAgICAgICBpZiAob2Zmc2V0ID09PSA0IHx8IG9mZnNldCA9PT0gNiB8fCBvZmZzZXQgPT09IDgpXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IFwiLVwiO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ5dGUgPCAxNilcclxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gXCIwXCI7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgKz0gYnl0ZS50b1N0cmluZygxNikudG9Mb3dlckNhc2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vIHVzZXMgYSBoZXVyaXN0aWMgdXNlZCBieSB2OCBhbmQgY2hha3JhIHRvIGZvcmNlIGFuIG9iamVjdCBpbnRvIGRpY3Rpb25hcnkgbW9kZS5cclxuICAgIGZ1bmN0aW9uIE1ha2VEaWN0aW9uYXJ5KG9iaikge1xyXG4gICAgICAgIG9iai5fXyA9IHVuZGVmaW5lZDtcclxuICAgICAgICBkZWxldGUgb2JqLl9fO1xyXG4gICAgICAgIHJldHVybiBvYmo7XHJcbiAgICB9XHJcbiAgICAvLyBwYXRjaCBnbG9iYWwgUmVmbGVjdFxyXG4gICAgKGZ1bmN0aW9uIChfX2dsb2JhbCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgX19nbG9iYWwuUmVmbGVjdCAhPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICBpZiAoX19nbG9iYWwuUmVmbGVjdCAhPT0gUmVmbGVjdCkge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBSZWZsZWN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc093bi5jYWxsKFJlZmxlY3QsIHApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9fZ2xvYmFsLlJlZmxlY3RbcF0gPSBSZWZsZWN0W3BdO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgX19nbG9iYWwuUmVmbGVjdCA9IFJlZmxlY3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfSkodHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbCA6XHJcbiAgICAgICAgdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDpcclxuICAgICAgICAgICAgRnVuY3Rpb24oXCJyZXR1cm4gdGhpcztcIikoKSk7XHJcbn0pKFJlZmxlY3QgfHwgKFJlZmxlY3QgPSB7fSkpO1xyXG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZWZsZWN0LmpzLm1hcCIsIid1c2Ugc3RyaWN0Jztcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi9saWIvaW5kZXgnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJhbmRvbUZyb21TZWVkID0gcmVxdWlyZSgnLi9yYW5kb20vcmFuZG9tLWZyb20tc2VlZCcpO1xuXG52YXIgT1JJR0lOQUwgPSAnMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVpfLSc7XG52YXIgYWxwaGFiZXQ7XG52YXIgcHJldmlvdXNTZWVkO1xuXG52YXIgc2h1ZmZsZWQ7XG5cbmZ1bmN0aW9uIHJlc2V0KCkge1xuICAgIHNodWZmbGVkID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHNldENoYXJhY3RlcnMoX2FscGhhYmV0Xykge1xuICAgIGlmICghX2FscGhhYmV0Xykge1xuICAgICAgICBpZiAoYWxwaGFiZXQgIT09IE9SSUdJTkFMKSB7XG4gICAgICAgICAgICBhbHBoYWJldCA9IE9SSUdJTkFMO1xuICAgICAgICAgICAgcmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKF9hbHBoYWJldF8gPT09IGFscGhhYmV0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoX2FscGhhYmV0Xy5sZW5ndGggIT09IE9SSUdJTkFMLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0N1c3RvbSBhbHBoYWJldCBmb3Igc2hvcnRpZCBtdXN0IGJlICcgKyBPUklHSU5BTC5sZW5ndGggKyAnIHVuaXF1ZSBjaGFyYWN0ZXJzLiBZb3Ugc3VibWl0dGVkICcgKyBfYWxwaGFiZXRfLmxlbmd0aCArICcgY2hhcmFjdGVyczogJyArIF9hbHBoYWJldF8pO1xuICAgIH1cblxuICAgIHZhciB1bmlxdWUgPSBfYWxwaGFiZXRfLnNwbGl0KCcnKS5maWx0ZXIoZnVuY3Rpb24oaXRlbSwgaW5kLCBhcnIpe1xuICAgICAgIHJldHVybiBpbmQgIT09IGFyci5sYXN0SW5kZXhPZihpdGVtKTtcbiAgICB9KTtcblxuICAgIGlmICh1bmlxdWUubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ3VzdG9tIGFscGhhYmV0IGZvciBzaG9ydGlkIG11c3QgYmUgJyArIE9SSUdJTkFMLmxlbmd0aCArICcgdW5pcXVlIGNoYXJhY3RlcnMuIFRoZXNlIGNoYXJhY3RlcnMgd2VyZSBub3QgdW5pcXVlOiAnICsgdW5pcXVlLmpvaW4oJywgJykpO1xuICAgIH1cblxuICAgIGFscGhhYmV0ID0gX2FscGhhYmV0XztcbiAgICByZXNldCgpO1xufVxuXG5mdW5jdGlvbiBjaGFyYWN0ZXJzKF9hbHBoYWJldF8pIHtcbiAgICBzZXRDaGFyYWN0ZXJzKF9hbHBoYWJldF8pO1xuICAgIHJldHVybiBhbHBoYWJldDtcbn1cblxuZnVuY3Rpb24gc2V0U2VlZChzZWVkKSB7XG4gICAgcmFuZG9tRnJvbVNlZWQuc2VlZChzZWVkKTtcbiAgICBpZiAocHJldmlvdXNTZWVkICE9PSBzZWVkKSB7XG4gICAgICAgIHJlc2V0KCk7XG4gICAgICAgIHByZXZpb3VzU2VlZCA9IHNlZWQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaHVmZmxlKCkge1xuICAgIGlmICghYWxwaGFiZXQpIHtcbiAgICAgICAgc2V0Q2hhcmFjdGVycyhPUklHSU5BTCk7XG4gICAgfVxuXG4gICAgdmFyIHNvdXJjZUFycmF5ID0gYWxwaGFiZXQuc3BsaXQoJycpO1xuICAgIHZhciB0YXJnZXRBcnJheSA9IFtdO1xuICAgIHZhciByID0gcmFuZG9tRnJvbVNlZWQubmV4dFZhbHVlKCk7XG4gICAgdmFyIGNoYXJhY3RlckluZGV4O1xuXG4gICAgd2hpbGUgKHNvdXJjZUFycmF5Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgciA9IHJhbmRvbUZyb21TZWVkLm5leHRWYWx1ZSgpO1xuICAgICAgICBjaGFyYWN0ZXJJbmRleCA9IE1hdGguZmxvb3IociAqIHNvdXJjZUFycmF5Lmxlbmd0aCk7XG4gICAgICAgIHRhcmdldEFycmF5LnB1c2goc291cmNlQXJyYXkuc3BsaWNlKGNoYXJhY3RlckluZGV4LCAxKVswXSk7XG4gICAgfVxuICAgIHJldHVybiB0YXJnZXRBcnJheS5qb2luKCcnKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2h1ZmZsZWQoKSB7XG4gICAgaWYgKHNodWZmbGVkKSB7XG4gICAgICAgIHJldHVybiBzaHVmZmxlZDtcbiAgICB9XG4gICAgc2h1ZmZsZWQgPSBzaHVmZmxlKCk7XG4gICAgcmV0dXJuIHNodWZmbGVkO1xufVxuXG4vKipcbiAqIGxvb2t1cCBzaHVmZmxlZCBsZXR0ZXJcbiAqIEBwYXJhbSBpbmRleFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gbG9va3VwKGluZGV4KSB7XG4gICAgdmFyIGFscGhhYmV0U2h1ZmZsZWQgPSBnZXRTaHVmZmxlZCgpO1xuICAgIHJldHVybiBhbHBoYWJldFNodWZmbGVkW2luZGV4XTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY2hhcmFjdGVyczogY2hhcmFjdGVycyxcbiAgICBzZWVkOiBzZXRTZWVkLFxuICAgIGxvb2t1cDogbG9va3VwLFxuICAgIHNodWZmbGVkOiBnZXRTaHVmZmxlZFxufTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBhbHBoYWJldCA9IHJlcXVpcmUoJy4vYWxwaGFiZXQnKTtcblxuLyoqXG4gKiBEZWNvZGUgdGhlIGlkIHRvIGdldCB0aGUgdmVyc2lvbiBhbmQgd29ya2VyXG4gKiBNYWlubHkgZm9yIGRlYnVnZ2luZyBhbmQgdGVzdGluZy5cbiAqIEBwYXJhbSBpZCAtIHRoZSBzaG9ydGlkLWdlbmVyYXRlZCBpZC5cbiAqL1xuZnVuY3Rpb24gZGVjb2RlKGlkKSB7XG4gICAgdmFyIGNoYXJhY3RlcnMgPSBhbHBoYWJldC5zaHVmZmxlZCgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHZlcnNpb246IGNoYXJhY3RlcnMuaW5kZXhPZihpZC5zdWJzdHIoMCwgMSkpICYgMHgwZixcbiAgICAgICAgd29ya2VyOiBjaGFyYWN0ZXJzLmluZGV4T2YoaWQuc3Vic3RyKDEsIDEpKSAmIDB4MGZcbiAgICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlY29kZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHJhbmRvbUJ5dGUgPSByZXF1aXJlKCcuL3JhbmRvbS9yYW5kb20tYnl0ZScpO1xuXG5mdW5jdGlvbiBlbmNvZGUobG9va3VwLCBudW1iZXIpIHtcbiAgICB2YXIgbG9vcENvdW50ZXIgPSAwO1xuICAgIHZhciBkb25lO1xuXG4gICAgdmFyIHN0ciA9ICcnO1xuXG4gICAgd2hpbGUgKCFkb25lKSB7XG4gICAgICAgIHN0ciA9IHN0ciArIGxvb2t1cCggKCAobnVtYmVyID4+ICg0ICogbG9vcENvdW50ZXIpKSAmIDB4MGYgKSB8IHJhbmRvbUJ5dGUoKSApO1xuICAgICAgICBkb25lID0gbnVtYmVyIDwgKE1hdGgucG93KDE2LCBsb29wQ291bnRlciArIDEgKSApO1xuICAgICAgICBsb29wQ291bnRlcisrO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGVuY29kZTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGFscGhhYmV0ID0gcmVxdWlyZSgnLi9hbHBoYWJldCcpO1xudmFyIGVuY29kZSA9IHJlcXVpcmUoJy4vZW5jb2RlJyk7XG52YXIgZGVjb2RlID0gcmVxdWlyZSgnLi9kZWNvZGUnKTtcbnZhciBpc1ZhbGlkID0gcmVxdWlyZSgnLi9pcy12YWxpZCcpO1xuXG4vLyBJZ25vcmUgYWxsIG1pbGxpc2Vjb25kcyBiZWZvcmUgYSBjZXJ0YWluIHRpbWUgdG8gcmVkdWNlIHRoZSBzaXplIG9mIHRoZSBkYXRlIGVudHJvcHkgd2l0aG91dCBzYWNyaWZpY2luZyB1bmlxdWVuZXNzLlxuLy8gVGhpcyBudW1iZXIgc2hvdWxkIGJlIHVwZGF0ZWQgZXZlcnkgeWVhciBvciBzbyB0byBrZWVwIHRoZSBnZW5lcmF0ZWQgaWQgc2hvcnQuXG4vLyBUbyByZWdlbmVyYXRlIGBuZXcgRGF0ZSgpIC0gMGAgYW5kIGJ1bXAgdGhlIHZlcnNpb24uIEFsd2F5cyBidW1wIHRoZSB2ZXJzaW9uIVxudmFyIFJFRFVDRV9USU1FID0gMTQ1OTcwNzYwNjUxODtcblxuLy8gZG9uJ3QgY2hhbmdlIHVubGVzcyB3ZSBjaGFuZ2UgdGhlIGFsZ29zIG9yIFJFRFVDRV9USU1FXG4vLyBtdXN0IGJlIGFuIGludGVnZXIgYW5kIGxlc3MgdGhhbiAxNlxudmFyIHZlcnNpb24gPSA2O1xuXG4vLyBpZiB5b3UgYXJlIHVzaW5nIGNsdXN0ZXIgb3IgbXVsdGlwbGUgc2VydmVycyB1c2UgdGhpcyB0byBtYWtlIGVhY2ggaW5zdGFuY2Vcbi8vIGhhcyBhIHVuaXF1ZSB2YWx1ZSBmb3Igd29ya2VyXG4vLyBOb3RlOiBJIGRvbid0IGtub3cgaWYgdGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCB3aGVuIHVzaW5nIHRoaXJkXG4vLyBwYXJ0eSBjbHVzdGVyIHNvbHV0aW9ucyBzdWNoIGFzIHBtMi5cbnZhciBjbHVzdGVyV29ya2VySWQgPSByZXF1aXJlKCcuL3V0aWwvY2x1c3Rlci13b3JrZXItaWQnKSB8fCAwO1xuXG4vLyBDb3VudGVyIGlzIHVzZWQgd2hlbiBzaG9ydGlkIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lcyBpbiBvbmUgc2Vjb25kLlxudmFyIGNvdW50ZXI7XG5cbi8vIFJlbWVtYmVyIHRoZSBsYXN0IHRpbWUgc2hvcnRpZCB3YXMgY2FsbGVkIGluIGNhc2UgY291bnRlciBpcyBuZWVkZWQuXG52YXIgcHJldmlvdXNTZWNvbmRzO1xuXG4vKipcbiAqIEdlbmVyYXRlIHVuaXF1ZSBpZFxuICogUmV0dXJucyBzdHJpbmcgaWRcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGUoKSB7XG5cbiAgICB2YXIgc3RyID0gJyc7XG5cbiAgICB2YXIgc2Vjb25kcyA9IE1hdGguZmxvb3IoKERhdGUubm93KCkgLSBSRURVQ0VfVElNRSkgKiAwLjAwMSk7XG5cbiAgICBpZiAoc2Vjb25kcyA9PT0gcHJldmlvdXNTZWNvbmRzKSB7XG4gICAgICAgIGNvdW50ZXIrKztcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb3VudGVyID0gMDtcbiAgICAgICAgcHJldmlvdXNTZWNvbmRzID0gc2Vjb25kcztcbiAgICB9XG5cbiAgICBzdHIgPSBzdHIgKyBlbmNvZGUoYWxwaGFiZXQubG9va3VwLCB2ZXJzaW9uKTtcbiAgICBzdHIgPSBzdHIgKyBlbmNvZGUoYWxwaGFiZXQubG9va3VwLCBjbHVzdGVyV29ya2VySWQpO1xuICAgIGlmIChjb3VudGVyID4gMCkge1xuICAgICAgICBzdHIgPSBzdHIgKyBlbmNvZGUoYWxwaGFiZXQubG9va3VwLCBjb3VudGVyKTtcbiAgICB9XG4gICAgc3RyID0gc3RyICsgZW5jb2RlKGFscGhhYmV0Lmxvb2t1cCwgc2Vjb25kcyk7XG5cbiAgICByZXR1cm4gc3RyO1xufVxuXG5cbi8qKlxuICogU2V0IHRoZSBzZWVkLlxuICogSGlnaGx5IHJlY29tbWVuZGVkIGlmIHlvdSBkb24ndCB3YW50IHBlb3BsZSB0byB0cnkgdG8gZmlndXJlIG91dCB5b3VyIGlkIHNjaGVtYS5cbiAqIGV4cG9zZWQgYXMgc2hvcnRpZC5zZWVkKGludClcbiAqIEBwYXJhbSBzZWVkIEludGVnZXIgdmFsdWUgdG8gc2VlZCB0aGUgcmFuZG9tIGFscGhhYmV0LiAgQUxXQVlTIFVTRSBUSEUgU0FNRSBTRUVEIG9yIHlvdSBtaWdodCBnZXQgb3ZlcmxhcHMuXG4gKi9cbmZ1bmN0aW9uIHNlZWQoc2VlZFZhbHVlKSB7XG4gICAgYWxwaGFiZXQuc2VlZChzZWVkVmFsdWUpO1xuICAgIHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGNsdXN0ZXIgd29ya2VyIG9yIG1hY2hpbmUgaWRcbiAqIGV4cG9zZWQgYXMgc2hvcnRpZC53b3JrZXIoaW50KVxuICogQHBhcmFtIHdvcmtlcklkIHdvcmtlciBtdXN0IGJlIHBvc2l0aXZlIGludGVnZXIuICBOdW1iZXIgbGVzcyB0aGFuIDE2IGlzIHJlY29tbWVuZGVkLlxuICogcmV0dXJucyBzaG9ydGlkIG1vZHVsZSBzbyBpdCBjYW4gYmUgY2hhaW5lZC5cbiAqL1xuZnVuY3Rpb24gd29ya2VyKHdvcmtlcklkKSB7XG4gICAgY2x1c3RlcldvcmtlcklkID0gd29ya2VySWQ7XG4gICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4vKipcbiAqXG4gKiBzZXRzIG5ldyBjaGFyYWN0ZXJzIHRvIHVzZSBpbiB0aGUgYWxwaGFiZXRcbiAqIHJldHVybnMgdGhlIHNodWZmbGVkIGFscGhhYmV0XG4gKi9cbmZ1bmN0aW9uIGNoYXJhY3RlcnMobmV3Q2hhcmFjdGVycykge1xuICAgIGlmIChuZXdDaGFyYWN0ZXJzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYWxwaGFiZXQuY2hhcmFjdGVycyhuZXdDaGFyYWN0ZXJzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxwaGFiZXQuc2h1ZmZsZWQoKTtcbn1cblxuXG4vLyBFeHBvcnQgYWxsIG90aGVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzIG9mIHRoZSBnZW5lcmF0ZSBmdW5jdGlvblxubW9kdWxlLmV4cG9ydHMgPSBnZW5lcmF0ZTtcbm1vZHVsZS5leHBvcnRzLmdlbmVyYXRlID0gZ2VuZXJhdGU7XG5tb2R1bGUuZXhwb3J0cy5zZWVkID0gc2VlZDtcbm1vZHVsZS5leHBvcnRzLndvcmtlciA9IHdvcmtlcjtcbm1vZHVsZS5leHBvcnRzLmNoYXJhY3RlcnMgPSBjaGFyYWN0ZXJzO1xubW9kdWxlLmV4cG9ydHMuZGVjb2RlID0gZGVjb2RlO1xubW9kdWxlLmV4cG9ydHMuaXNWYWxpZCA9IGlzVmFsaWQ7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgYWxwaGFiZXQgPSByZXF1aXJlKCcuL2FscGhhYmV0Jyk7XG5cbmZ1bmN0aW9uIGlzU2hvcnRJZChpZCkge1xuICAgIGlmICghaWQgfHwgdHlwZW9mIGlkICE9PSAnc3RyaW5nJyB8fCBpZC5sZW5ndGggPCA2ICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGNoYXJhY3RlcnMgPSBhbHBoYWJldC5jaGFyYWN0ZXJzKCk7XG4gICAgdmFyIGxlbiA9IGlkLmxlbmd0aDtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbGVuO2krKykge1xuICAgICAgICBpZiAoY2hhcmFjdGVycy5pbmRleE9mKGlkW2ldKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBpc1Nob3J0SWQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjcnlwdG8gPSB0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiAod2luZG93LmNyeXB0byB8fCB3aW5kb3cubXNDcnlwdG8pOyAvLyBJRSAxMSB1c2VzIHdpbmRvdy5tc0NyeXB0b1xuXG5mdW5jdGlvbiByYW5kb21CeXRlKCkge1xuICAgIGlmICghY3J5cHRvIHx8ICFjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTYpICYgMHgzMDtcbiAgICB9XG4gICAgdmFyIGRlc3QgPSBuZXcgVWludDhBcnJheSgxKTtcbiAgICBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGRlc3QpO1xuICAgIHJldHVybiBkZXN0WzBdICYgMHgzMDtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSByYW5kb21CeXRlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vLyBGb3VuZCB0aGlzIHNlZWQtYmFzZWQgcmFuZG9tIGdlbmVyYXRvciBzb21ld2hlcmVcbi8vIEJhc2VkIG9uIFRoZSBDZW50cmFsIFJhbmRvbWl6ZXIgMS4zIChDKSAxOTk3IGJ5IFBhdWwgSG91bGUgKGhvdWxlQG1zYy5jb3JuZWxsLmVkdSlcblxudmFyIHNlZWQgPSAxO1xuXG4vKipcbiAqIHJldHVybiBhIHJhbmRvbSBudW1iZXIgYmFzZWQgb24gYSBzZWVkXG4gKiBAcGFyYW0gc2VlZFxuICogQHJldHVybnMge251bWJlcn1cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dFZhbHVlKCkge1xuICAgIHNlZWQgPSAoc2VlZCAqIDkzMDEgKyA0OTI5NykgJSAyMzMyODA7XG4gICAgcmV0dXJuIHNlZWQvKDIzMzI4MC4wKTtcbn1cblxuZnVuY3Rpb24gc2V0U2VlZChfc2VlZF8pIHtcbiAgICBzZWVkID0gX3NlZWRfO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBuZXh0VmFsdWU6IGdldE5leHRWYWx1ZSxcbiAgICBzZWVkOiBzZXRTZWVkXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IDA7XG4iLCIvKiEgdGV0aGVyIDEuNC4wICovXG5cbihmdW5jdGlvbihyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICBkZWZpbmUoZmFjdG9yeSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUsIGV4cG9ydHMsIG1vZHVsZSk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdC5UZXRoZXIgPSBmYWN0b3J5KCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24ocmVxdWlyZSwgZXhwb3J0cywgbW9kdWxlKSB7XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBUZXRoZXJCYXNlID0gdW5kZWZpbmVkO1xuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICBUZXRoZXJCYXNlID0geyBtb2R1bGVzOiBbXSB9O1xufVxuXG52YXIgemVyb0VsZW1lbnQgPSBudWxsO1xuXG4vLyBTYW1lIGFzIG5hdGl2ZSBnZXRCb3VuZGluZ0NsaWVudFJlY3QsIGV4Y2VwdCBpdCB0YWtlcyBpbnRvIGFjY291bnQgcGFyZW50IDxmcmFtZT4gb2Zmc2V0c1xuLy8gaWYgdGhlIGVsZW1lbnQgbGllcyB3aXRoaW4gYSBuZXN0ZWQgZG9jdW1lbnQgKDxmcmFtZT4gb3IgPGlmcmFtZT4tbGlrZSkuXG5mdW5jdGlvbiBnZXRBY3R1YWxCb3VuZGluZ0NsaWVudFJlY3Qobm9kZSkge1xuICB2YXIgYm91bmRpbmdSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAvLyBUaGUgb3JpZ2luYWwgb2JqZWN0IHJldHVybmVkIGJ5IGdldEJvdW5kaW5nQ2xpZW50UmVjdCBpcyBpbW11dGFibGUsIHNvIHdlIGNsb25lIGl0XG4gIC8vIFdlIGNhbid0IHVzZSBleHRlbmQgYmVjYXVzZSB0aGUgcHJvcGVydGllcyBhcmUgbm90IGNvbnNpZGVyZWQgcGFydCBvZiB0aGUgb2JqZWN0IGJ5IGhhc093blByb3BlcnR5IGluIElFOVxuICB2YXIgcmVjdCA9IHt9O1xuICBmb3IgKHZhciBrIGluIGJvdW5kaW5nUmVjdCkge1xuICAgIHJlY3Rba10gPSBib3VuZGluZ1JlY3Rba107XG4gIH1cblxuICBpZiAobm9kZS5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHZhciBfZnJhbWVFbGVtZW50ID0gbm9kZS5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LmZyYW1lRWxlbWVudDtcbiAgICBpZiAoX2ZyYW1lRWxlbWVudCkge1xuICAgICAgdmFyIGZyYW1lUmVjdCA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChfZnJhbWVFbGVtZW50KTtcbiAgICAgIHJlY3QudG9wICs9IGZyYW1lUmVjdC50b3A7XG4gICAgICByZWN0LmJvdHRvbSArPSBmcmFtZVJlY3QudG9wO1xuICAgICAgcmVjdC5sZWZ0ICs9IGZyYW1lUmVjdC5sZWZ0O1xuICAgICAgcmVjdC5yaWdodCArPSBmcmFtZVJlY3QubGVmdDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVjdDtcbn1cblxuZnVuY3Rpb24gZ2V0U2Nyb2xsUGFyZW50cyhlbCkge1xuICAvLyBJbiBmaXJlZm94IGlmIHRoZSBlbCBpcyBpbnNpZGUgYW4gaWZyYW1lIHdpdGggZGlzcGxheTogbm9uZTsgd2luZG93LmdldENvbXB1dGVkU3R5bGUoKSB3aWxsIHJldHVybiBudWxsO1xuICAvLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD01NDgzOTdcbiAgdmFyIGNvbXB1dGVkU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsKSB8fCB7fTtcbiAgdmFyIHBvc2l0aW9uID0gY29tcHV0ZWRTdHlsZS5wb3NpdGlvbjtcbiAgdmFyIHBhcmVudHMgPSBbXTtcblxuICBpZiAocG9zaXRpb24gPT09ICdmaXhlZCcpIHtcbiAgICByZXR1cm4gW2VsXTtcbiAgfVxuXG4gIHZhciBwYXJlbnQgPSBlbDtcbiAgd2hpbGUgKChwYXJlbnQgPSBwYXJlbnQucGFyZW50Tm9kZSkgJiYgcGFyZW50ICYmIHBhcmVudC5ub2RlVHlwZSA9PT0gMSkge1xuICAgIHZhciBzdHlsZSA9IHVuZGVmaW5lZDtcbiAgICB0cnkge1xuICAgICAgc3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKHBhcmVudCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7fVxuXG4gICAgaWYgKHR5cGVvZiBzdHlsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgc3R5bGUgPT09IG51bGwpIHtcbiAgICAgIHBhcmVudHMucHVzaChwYXJlbnQpO1xuICAgICAgcmV0dXJuIHBhcmVudHM7XG4gICAgfVxuXG4gICAgdmFyIF9zdHlsZSA9IHN0eWxlO1xuICAgIHZhciBvdmVyZmxvdyA9IF9zdHlsZS5vdmVyZmxvdztcbiAgICB2YXIgb3ZlcmZsb3dYID0gX3N0eWxlLm92ZXJmbG93WDtcbiAgICB2YXIgb3ZlcmZsb3dZID0gX3N0eWxlLm92ZXJmbG93WTtcblxuICAgIGlmICgvKGF1dG98c2Nyb2xsKS8udGVzdChvdmVyZmxvdyArIG92ZXJmbG93WSArIG92ZXJmbG93WCkpIHtcbiAgICAgIGlmIChwb3NpdGlvbiAhPT0gJ2Fic29sdXRlJyB8fCBbJ3JlbGF0aXZlJywgJ2Fic29sdXRlJywgJ2ZpeGVkJ10uaW5kZXhPZihzdHlsZS5wb3NpdGlvbikgPj0gMCkge1xuICAgICAgICBwYXJlbnRzLnB1c2gocGFyZW50KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJlbnRzLnB1c2goZWwub3duZXJEb2N1bWVudC5ib2R5KTtcblxuICAvLyBJZiB0aGUgbm9kZSBpcyB3aXRoaW4gYSBmcmFtZSwgYWNjb3VudCBmb3IgdGhlIHBhcmVudCB3aW5kb3cgc2Nyb2xsXG4gIGlmIChlbC5vd25lckRvY3VtZW50ICE9PSBkb2N1bWVudCkge1xuICAgIHBhcmVudHMucHVzaChlbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3KTtcbiAgfVxuXG4gIHJldHVybiBwYXJlbnRzO1xufVxuXG52YXIgdW5pcXVlSWQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgaWQgPSAwO1xuICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiArK2lkO1xuICB9O1xufSkoKTtcblxudmFyIHplcm9Qb3NDYWNoZSA9IHt9O1xudmFyIGdldE9yaWdpbiA9IGZ1bmN0aW9uIGdldE9yaWdpbigpIHtcbiAgLy8gZ2V0Qm91bmRpbmdDbGllbnRSZWN0IGlzIHVuZm9ydHVuYXRlbHkgdG9vIGFjY3VyYXRlLiAgSXQgaW50cm9kdWNlcyBhIHBpeGVsIG9yIHR3byBvZlxuICAvLyBqaXR0ZXIgYXMgdGhlIHVzZXIgc2Nyb2xscyB0aGF0IG1lc3NlcyB3aXRoIG91ciBhYmlsaXR5IHRvIGRldGVjdCBpZiB0d28gcG9zaXRpb25zXG4gIC8vIGFyZSBlcXVpdmlsYW50IG9yIG5vdC4gIFdlIHBsYWNlIGFuIGVsZW1lbnQgYXQgdGhlIHRvcCBsZWZ0IG9mIHRoZSBwYWdlIHRoYXQgd2lsbFxuICAvLyBnZXQgdGhlIHNhbWUgaml0dGVyLCBzbyB3ZSBjYW4gY2FuY2VsIHRoZSB0d28gb3V0LlxuICB2YXIgbm9kZSA9IHplcm9FbGVtZW50O1xuICBpZiAoIW5vZGUgfHwgIWRvY3VtZW50LmJvZHkuY29udGFpbnMobm9kZSkpIHtcbiAgICBub2RlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgbm9kZS5zZXRBdHRyaWJ1dGUoJ2RhdGEtdGV0aGVyLWlkJywgdW5pcXVlSWQoKSk7XG4gICAgZXh0ZW5kKG5vZGUuc3R5bGUsIHtcbiAgICAgIHRvcDogMCxcbiAgICAgIGxlZnQ6IDAsXG4gICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJ1xuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChub2RlKTtcblxuICAgIHplcm9FbGVtZW50ID0gbm9kZTtcbiAgfVxuXG4gIHZhciBpZCA9IG5vZGUuZ2V0QXR0cmlidXRlKCdkYXRhLXRldGhlci1pZCcpO1xuICBpZiAodHlwZW9mIHplcm9Qb3NDYWNoZVtpZF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgemVyb1Bvc0NhY2hlW2lkXSA9IGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdChub2RlKTtcblxuICAgIC8vIENsZWFyIHRoZSBjYWNoZSB3aGVuIHRoaXMgcG9zaXRpb24gY2FsbCBpcyBkb25lXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgZGVsZXRlIHplcm9Qb3NDYWNoZVtpZF07XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gemVyb1Bvc0NhY2hlW2lkXTtcbn07XG5cbmZ1bmN0aW9uIHJlbW92ZVV0aWxFbGVtZW50cygpIHtcbiAgaWYgKHplcm9FbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh6ZXJvRWxlbWVudCk7XG4gIH1cbiAgemVyb0VsZW1lbnQgPSBudWxsO1xufTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRzKGVsKSB7XG4gIHZhciBkb2MgPSB1bmRlZmluZWQ7XG4gIGlmIChlbCA9PT0gZG9jdW1lbnQpIHtcbiAgICBkb2MgPSBkb2N1bWVudDtcbiAgICBlbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcbiAgfSBlbHNlIHtcbiAgICBkb2MgPSBlbC5vd25lckRvY3VtZW50O1xuICB9XG5cbiAgdmFyIGRvY0VsID0gZG9jLmRvY3VtZW50RWxlbWVudDtcblxuICB2YXIgYm94ID0gZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0KGVsKTtcblxuICB2YXIgb3JpZ2luID0gZ2V0T3JpZ2luKCk7XG5cbiAgYm94LnRvcCAtPSBvcmlnaW4udG9wO1xuICBib3gubGVmdCAtPSBvcmlnaW4ubGVmdDtcblxuICBpZiAodHlwZW9mIGJveC53aWR0aCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBib3gud2lkdGggPSBkb2N1bWVudC5ib2R5LnNjcm9sbFdpZHRoIC0gYm94LmxlZnQgLSBib3gucmlnaHQ7XG4gIH1cbiAgaWYgKHR5cGVvZiBib3guaGVpZ2h0ID09PSAndW5kZWZpbmVkJykge1xuICAgIGJveC5oZWlnaHQgPSBkb2N1bWVudC5ib2R5LnNjcm9sbEhlaWdodCAtIGJveC50b3AgLSBib3guYm90dG9tO1xuICB9XG5cbiAgYm94LnRvcCA9IGJveC50b3AgLSBkb2NFbC5jbGllbnRUb3A7XG4gIGJveC5sZWZ0ID0gYm94LmxlZnQgLSBkb2NFbC5jbGllbnRMZWZ0O1xuICBib3gucmlnaHQgPSBkb2MuYm9keS5jbGllbnRXaWR0aCAtIGJveC53aWR0aCAtIGJveC5sZWZ0O1xuICBib3guYm90dG9tID0gZG9jLmJvZHkuY2xpZW50SGVpZ2h0IC0gYm94LmhlaWdodCAtIGJveC50b3A7XG5cbiAgcmV0dXJuIGJveDtcbn1cblxuZnVuY3Rpb24gZ2V0T2Zmc2V0UGFyZW50KGVsKSB7XG4gIHJldHVybiBlbC5vZmZzZXRQYXJlbnQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xufVxuXG52YXIgX3Njcm9sbEJhclNpemUgPSBudWxsO1xuZnVuY3Rpb24gZ2V0U2Nyb2xsQmFyU2l6ZSgpIHtcbiAgaWYgKF9zY3JvbGxCYXJTaXplKSB7XG4gICAgcmV0dXJuIF9zY3JvbGxCYXJTaXplO1xuICB9XG4gIHZhciBpbm5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBpbm5lci5zdHlsZS53aWR0aCA9ICcxMDAlJztcbiAgaW5uZXIuc3R5bGUuaGVpZ2h0ID0gJzIwMHB4JztcblxuICB2YXIgb3V0ZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZXh0ZW5kKG91dGVyLnN0eWxlLCB7XG4gICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgdG9wOiAwLFxuICAgIGxlZnQ6IDAsXG4gICAgcG9pbnRlckV2ZW50czogJ25vbmUnLFxuICAgIHZpc2liaWxpdHk6ICdoaWRkZW4nLFxuICAgIHdpZHRoOiAnMjAwcHgnLFxuICAgIGhlaWdodDogJzE1MHB4JyxcbiAgICBvdmVyZmxvdzogJ2hpZGRlbidcbiAgfSk7XG5cbiAgb3V0ZXIuYXBwZW5kQ2hpbGQoaW5uZXIpO1xuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aENvbnRhaW5lZCA9IGlubmVyLm9mZnNldFdpZHRoO1xuICBvdXRlci5zdHlsZS5vdmVyZmxvdyA9ICdzY3JvbGwnO1xuICB2YXIgd2lkdGhTY3JvbGwgPSBpbm5lci5vZmZzZXRXaWR0aDtcblxuICBpZiAod2lkdGhDb250YWluZWQgPT09IHdpZHRoU2Nyb2xsKSB7XG4gICAgd2lkdGhTY3JvbGwgPSBvdXRlci5jbGllbnRXaWR0aDtcbiAgfVxuXG4gIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQob3V0ZXIpO1xuXG4gIHZhciB3aWR0aCA9IHdpZHRoQ29udGFpbmVkIC0gd2lkdGhTY3JvbGw7XG5cbiAgX3Njcm9sbEJhclNpemUgPSB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiB3aWR0aCB9O1xuICByZXR1cm4gX3Njcm9sbEJhclNpemU7XG59XG5cbmZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgdmFyIG91dCA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzBdO1xuXG4gIHZhciBhcmdzID0gW107XG5cbiAgQXJyYXkucHJvdG90eXBlLnB1c2guYXBwbHkoYXJncywgYXJndW1lbnRzKTtcblxuICBhcmdzLnNsaWNlKDEpLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuICAgIGlmIChvYmopIHtcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICAgICAgaWYgKCh7fSkuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcbiAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiByZW1vdmVDbGFzcyhlbCwgbmFtZSkge1xuICBpZiAodHlwZW9mIGVsLmNsYXNzTGlzdCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBuYW1lLnNwbGl0KCcgJykuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgICBpZiAoY2xzLnRyaW0oKSkge1xuICAgICAgICBlbC5jbGFzc0xpc3QucmVtb3ZlKGNscyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cCgnKF58ICknICsgbmFtZS5zcGxpdCgnICcpLmpvaW4oJ3wnKSArICcoIHwkKScsICdnaScpO1xuICAgIHZhciBjbGFzc05hbWUgPSBnZXRDbGFzc05hbWUoZWwpLnJlcGxhY2UocmVnZXgsICcgJyk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGFkZENsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIG5hbWUuc3BsaXQoJyAnKS5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICAgIGlmIChjbHMudHJpbSgpKSB7XG4gICAgICAgIGVsLmNsYXNzTGlzdC5hZGQoY2xzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZW1vdmVDbGFzcyhlbCwgbmFtZSk7XG4gICAgdmFyIGNscyA9IGdldENsYXNzTmFtZShlbCkgKyAoJyAnICsgbmFtZSk7XG4gICAgc2V0Q2xhc3NOYW1lKGVsLCBjbHMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGhhc0NsYXNzKGVsLCBuYW1lKSB7XG4gIGlmICh0eXBlb2YgZWwuY2xhc3NMaXN0ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBlbC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gIH1cbiAgdmFyIGNsYXNzTmFtZSA9IGdldENsYXNzTmFtZShlbCk7XG4gIHJldHVybiBuZXcgUmVnRXhwKCcoXnwgKScgKyBuYW1lICsgJyggfCQpJywgJ2dpJykudGVzdChjbGFzc05hbWUpO1xufVxuXG5mdW5jdGlvbiBnZXRDbGFzc05hbWUoZWwpIHtcbiAgLy8gQ2FuJ3QgdXNlIGp1c3QgU1ZHQW5pbWF0ZWRTdHJpbmcgaGVyZSBzaW5jZSBub2RlcyB3aXRoaW4gYSBGcmFtZSBpbiBJRSBoYXZlXG4gIC8vIGNvbXBsZXRlbHkgc2VwYXJhdGVseSBTVkdBbmltYXRlZFN0cmluZyBiYXNlIGNsYXNzZXNcbiAgaWYgKGVsLmNsYXNzTmFtZSBpbnN0YW5jZW9mIGVsLm93bmVyRG9jdW1lbnQuZGVmYXVsdFZpZXcuU1ZHQW5pbWF0ZWRTdHJpbmcpIHtcbiAgICByZXR1cm4gZWwuY2xhc3NOYW1lLmJhc2VWYWw7XG4gIH1cbiAgcmV0dXJuIGVsLmNsYXNzTmFtZTtcbn1cblxuZnVuY3Rpb24gc2V0Q2xhc3NOYW1lKGVsLCBjbGFzc05hbWUpIHtcbiAgZWwuc2V0QXR0cmlidXRlKCdjbGFzcycsIGNsYXNzTmFtZSk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzZXMoZWwsIGFkZCwgYWxsKSB7XG4gIC8vIE9mIHRoZSBzZXQgb2YgJ2FsbCcgY2xhc3Nlcywgd2UgbmVlZCB0aGUgJ2FkZCcgY2xhc3NlcywgYW5kIG9ubHkgdGhlXG4gIC8vICdhZGQnIGNsYXNzZXMgdG8gYmUgc2V0LlxuICBhbGwuZm9yRWFjaChmdW5jdGlvbiAoY2xzKSB7XG4gICAgaWYgKGFkZC5pbmRleE9mKGNscykgPT09IC0xICYmIGhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICByZW1vdmVDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGFkZC5mb3JFYWNoKGZ1bmN0aW9uIChjbHMpIHtcbiAgICBpZiAoIWhhc0NsYXNzKGVsLCBjbHMpKSB7XG4gICAgICBhZGRDbGFzcyhlbCwgY2xzKTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgZGVmZXJyZWQgPSBbXTtcblxudmFyIGRlZmVyID0gZnVuY3Rpb24gZGVmZXIoZm4pIHtcbiAgZGVmZXJyZWQucHVzaChmbik7XG59O1xuXG52YXIgZmx1c2ggPSBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgdmFyIGZuID0gdW5kZWZpbmVkO1xuICB3aGlsZSAoZm4gPSBkZWZlcnJlZC5wb3AoKSkge1xuICAgIGZuKCk7XG4gIH1cbn07XG5cbnZhciBFdmVudGVkID0gKGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gRXZlbnRlZCgpIHtcbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgRXZlbnRlZCk7XG4gIH1cblxuICBfY3JlYXRlQ2xhc3MoRXZlbnRlZCwgW3tcbiAgICBrZXk6ICdvbicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9uKGV2ZW50LCBoYW5kbGVyLCBjdHgpIHtcbiAgICAgIHZhciBvbmNlID0gYXJndW1lbnRzLmxlbmd0aCA8PSAzIHx8IGFyZ3VtZW50c1szXSA9PT0gdW5kZWZpbmVkID8gZmFsc2UgOiBhcmd1bWVudHNbM107XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5iaW5kaW5ncyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5ncyA9IHt9O1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzW2V2ZW50XSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5iaW5kaW5nc1tldmVudF0gPSBbXTtcbiAgICAgIH1cbiAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnB1c2goeyBoYW5kbGVyOiBoYW5kbGVyLCBjdHg6IGN0eCwgb25jZTogb25jZSB9KTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdvbmNlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gb25jZShldmVudCwgaGFuZGxlciwgY3R4KSB7XG4gICAgICB0aGlzLm9uKGV2ZW50LCBoYW5kbGVyLCBjdHgsIHRydWUpO1xuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ29mZicsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIG9mZihldmVudCwgaGFuZGxlcikge1xuICAgICAgaWYgKHR5cGVvZiB0aGlzLmJpbmRpbmdzID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgdGhpcy5iaW5kaW5nc1tldmVudF0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBkZWxldGUgdGhpcy5iaW5kaW5nc1tldmVudF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgaSA9IDA7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRoaXMuYmluZGluZ3NbZXZlbnRdW2ldLmhhbmRsZXIgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuYmluZGluZ3NbZXZlbnRdLnNwbGljZShpLCAxKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKytpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ3RyaWdnZXInLFxuICAgIHZhbHVlOiBmdW5jdGlvbiB0cmlnZ2VyKGV2ZW50KSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMuYmluZGluZ3MgIT09ICd1bmRlZmluZWQnICYmIHRoaXMuYmluZGluZ3NbZXZlbnRdKSB7XG4gICAgICAgIHZhciBpID0gMDtcblxuICAgICAgICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgYXJncyA9IEFycmF5KF9sZW4gPiAxID8gX2xlbiAtIDEgOiAwKSwgX2tleSA9IDE7IF9rZXkgPCBfbGVuOyBfa2V5KyspIHtcbiAgICAgICAgICBhcmdzW19rZXkgLSAxXSA9IGFyZ3VtZW50c1tfa2V5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy5iaW5kaW5nc1tldmVudF0ubGVuZ3RoKSB7XG4gICAgICAgICAgdmFyIF9iaW5kaW5ncyRldmVudCRpID0gdGhpcy5iaW5kaW5nc1tldmVudF1baV07XG4gICAgICAgICAgdmFyIGhhbmRsZXIgPSBfYmluZGluZ3MkZXZlbnQkaS5oYW5kbGVyO1xuICAgICAgICAgIHZhciBjdHggPSBfYmluZGluZ3MkZXZlbnQkaS5jdHg7XG4gICAgICAgICAgdmFyIG9uY2UgPSBfYmluZGluZ3MkZXZlbnQkaS5vbmNlO1xuXG4gICAgICAgICAgdmFyIGNvbnRleHQgPSBjdHg7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjb250ZXh0ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29udGV4dCA9IHRoaXM7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaGFuZGxlci5hcHBseShjb250ZXh0LCBhcmdzKTtcblxuICAgICAgICAgIGlmIChvbmNlKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRpbmdzW2V2ZW50XS5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxuICByZXR1cm4gRXZlbnRlZDtcbn0pKCk7XG5cblRldGhlckJhc2UuVXRpbHMgPSB7XG4gIGdldEFjdHVhbEJvdW5kaW5nQ2xpZW50UmVjdDogZ2V0QWN0dWFsQm91bmRpbmdDbGllbnRSZWN0LFxuICBnZXRTY3JvbGxQYXJlbnRzOiBnZXRTY3JvbGxQYXJlbnRzLFxuICBnZXRCb3VuZHM6IGdldEJvdW5kcyxcbiAgZ2V0T2Zmc2V0UGFyZW50OiBnZXRPZmZzZXRQYXJlbnQsXG4gIGV4dGVuZDogZXh0ZW5kLFxuICBhZGRDbGFzczogYWRkQ2xhc3MsXG4gIHJlbW92ZUNsYXNzOiByZW1vdmVDbGFzcyxcbiAgaGFzQ2xhc3M6IGhhc0NsYXNzLFxuICB1cGRhdGVDbGFzc2VzOiB1cGRhdGVDbGFzc2VzLFxuICBkZWZlcjogZGVmZXIsXG4gIGZsdXNoOiBmbHVzaCxcbiAgdW5pcXVlSWQ6IHVuaXF1ZUlkLFxuICBFdmVudGVkOiBFdmVudGVkLFxuICBnZXRTY3JvbGxCYXJTaXplOiBnZXRTY3JvbGxCYXJTaXplLFxuICByZW1vdmVVdGlsRWxlbWVudHM6IHJlbW92ZVV0aWxFbGVtZW50c1xufTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSwgcGVyZm9ybWFuY2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9jcmVhdGVDbGFzcyA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIGRlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoJ3ZhbHVlJyBpbiBkZXNjcmlwdG9yKSBkZXNjcmlwdG9yLndyaXRhYmxlID0gdHJ1ZTsgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRhcmdldCwgZGVzY3JpcHRvci5rZXksIGRlc2NyaXB0b3IpOyB9IH0gcmV0dXJuIGZ1bmN0aW9uIChDb25zdHJ1Y3RvciwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHsgaWYgKHByb3RvUHJvcHMpIGRlZmluZVByb3BlcnRpZXMoQ29uc3RydWN0b3IucHJvdG90eXBlLCBwcm90b1Byb3BzKTsgaWYgKHN0YXRpY1Byb3BzKSBkZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfTsgfSkoKTtcblxudmFyIF9nZXQgPSBmdW5jdGlvbiBnZXQoX3g2LCBfeDcsIF94OCkgeyB2YXIgX2FnYWluID0gdHJ1ZTsgX2Z1bmN0aW9uOiB3aGlsZSAoX2FnYWluKSB7IHZhciBvYmplY3QgPSBfeDYsIHByb3BlcnR5ID0gX3g3LCByZWNlaXZlciA9IF94ODsgX2FnYWluID0gZmFsc2U7IGlmIChvYmplY3QgPT09IG51bGwpIG9iamVjdCA9IEZ1bmN0aW9uLnByb3RvdHlwZTsgdmFyIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iamVjdCwgcHJvcGVydHkpOyBpZiAoZGVzYyA9PT0gdW5kZWZpbmVkKSB7IHZhciBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqZWN0KTsgaWYgKHBhcmVudCA9PT0gbnVsbCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IGVsc2UgeyBfeDYgPSBwYXJlbnQ7IF94NyA9IHByb3BlcnR5OyBfeDggPSByZWNlaXZlcjsgX2FnYWluID0gdHJ1ZTsgZGVzYyA9IHBhcmVudCA9IHVuZGVmaW5lZDsgY29udGludWUgX2Z1bmN0aW9uOyB9IH0gZWxzZSBpZiAoJ3ZhbHVlJyBpbiBkZXNjKSB7IHJldHVybiBkZXNjLnZhbHVlOyB9IGVsc2UgeyB2YXIgZ2V0dGVyID0gZGVzYy5nZXQ7IGlmIChnZXR0ZXIgPT09IHVuZGVmaW5lZCkgeyByZXR1cm4gdW5kZWZpbmVkOyB9IHJldHVybiBnZXR0ZXIuY2FsbChyZWNlaXZlcik7IH0gfSB9O1xuXG5mdW5jdGlvbiBfY2xhc3NDYWxsQ2hlY2soaW5zdGFuY2UsIENvbnN0cnVjdG9yKSB7IGlmICghKGluc3RhbmNlIGluc3RhbmNlb2YgQ29uc3RydWN0b3IpKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjYWxsIGEgY2xhc3MgYXMgYSBmdW5jdGlvbicpOyB9IH1cblxuZnVuY3Rpb24gX2luaGVyaXRzKHN1YkNsYXNzLCBzdXBlckNsYXNzKSB7IGlmICh0eXBlb2Ygc3VwZXJDbGFzcyAhPT0gJ2Z1bmN0aW9uJyAmJiBzdXBlckNsYXNzICE9PSBudWxsKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ1N1cGVyIGV4cHJlc3Npb24gbXVzdCBlaXRoZXIgYmUgbnVsbCBvciBhIGZ1bmN0aW9uLCBub3QgJyArIHR5cGVvZiBzdXBlckNsYXNzKTsgfSBzdWJDbGFzcy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyQ2xhc3MgJiYgc3VwZXJDbGFzcy5wcm90b3R5cGUsIHsgY29uc3RydWN0b3I6IHsgdmFsdWU6IHN1YkNsYXNzLCBlbnVtZXJhYmxlOiBmYWxzZSwgd3JpdGFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSB9IH0pOyBpZiAoc3VwZXJDbGFzcykgT2JqZWN0LnNldFByb3RvdHlwZU9mID8gT2JqZWN0LnNldFByb3RvdHlwZU9mKHN1YkNsYXNzLCBzdXBlckNsYXNzKSA6IHN1YkNsYXNzLl9fcHJvdG9fXyA9IHN1cGVyQ2xhc3M7IH1cblxuaWYgKHR5cGVvZiBUZXRoZXJCYXNlID09PSAndW5kZWZpbmVkJykge1xuICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBtdXN0IGluY2x1ZGUgdGhlIHV0aWxzLmpzIGZpbGUgYmVmb3JlIHRldGhlci5qcycpO1xufVxuXG52YXIgX1RldGhlckJhc2UkVXRpbHMgPSBUZXRoZXJCYXNlLlV0aWxzO1xudmFyIGdldFNjcm9sbFBhcmVudHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRTY3JvbGxQYXJlbnRzO1xudmFyIGdldEJvdW5kcyA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldEJvdW5kcztcbnZhciBnZXRPZmZzZXRQYXJlbnQgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRPZmZzZXRQYXJlbnQ7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIGFkZENsYXNzID0gX1RldGhlckJhc2UkVXRpbHMuYWRkQ2xhc3M7XG52YXIgcmVtb3ZlQ2xhc3MgPSBfVGV0aGVyQmFzZSRVdGlscy5yZW1vdmVDbGFzcztcbnZhciB1cGRhdGVDbGFzc2VzID0gX1RldGhlckJhc2UkVXRpbHMudXBkYXRlQ2xhc3NlcztcbnZhciBkZWZlciA9IF9UZXRoZXJCYXNlJFV0aWxzLmRlZmVyO1xudmFyIGZsdXNoID0gX1RldGhlckJhc2UkVXRpbHMuZmx1c2g7XG52YXIgZ2V0U2Nyb2xsQmFyU2l6ZSA9IF9UZXRoZXJCYXNlJFV0aWxzLmdldFNjcm9sbEJhclNpemU7XG52YXIgcmVtb3ZlVXRpbEVsZW1lbnRzID0gX1RldGhlckJhc2UkVXRpbHMucmVtb3ZlVXRpbEVsZW1lbnRzO1xuXG5mdW5jdGlvbiB3aXRoaW4oYSwgYikge1xuICB2YXIgZGlmZiA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMiB8fCBhcmd1bWVudHNbMl0gPT09IHVuZGVmaW5lZCA/IDEgOiBhcmd1bWVudHNbMl07XG5cbiAgcmV0dXJuIGEgKyBkaWZmID49IGIgJiYgYiA+PSBhIC0gZGlmZjtcbn1cblxudmFyIHRyYW5zZm9ybUtleSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuXG4gIHZhciB0cmFuc2Zvcm1zID0gWyd0cmFuc2Zvcm0nLCAnV2Via2l0VHJhbnNmb3JtJywgJ09UcmFuc2Zvcm0nLCAnTW96VHJhbnNmb3JtJywgJ21zVHJhbnNmb3JtJ107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdHJhbnNmb3Jtcy5sZW5ndGg7ICsraSkge1xuICAgIHZhciBrZXkgPSB0cmFuc2Zvcm1zW2ldO1xuICAgIGlmIChlbC5zdHlsZVtrZXldICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9XG59KSgpO1xuXG52YXIgdGV0aGVycyA9IFtdO1xuXG52YXIgcG9zaXRpb24gPSBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgdGV0aGVycy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXRoZXIpIHtcbiAgICB0ZXRoZXIucG9zaXRpb24oZmFsc2UpO1xuICB9KTtcbiAgZmx1c2goKTtcbn07XG5cbmZ1bmN0aW9uIG5vdygpIHtcbiAgaWYgKHR5cGVvZiBwZXJmb3JtYW5jZSAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH1cbiAgcmV0dXJuICtuZXcgRGF0ZSgpO1xufVxuXG4oZnVuY3Rpb24gKCkge1xuICB2YXIgbGFzdENhbGwgPSBudWxsO1xuICB2YXIgbGFzdER1cmF0aW9uID0gbnVsbDtcbiAgdmFyIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcblxuICB2YXIgdGljayA9IGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgaWYgKHR5cGVvZiBsYXN0RHVyYXRpb24gIT09ICd1bmRlZmluZWQnICYmIGxhc3REdXJhdGlvbiA+IDE2KSB7XG4gICAgICAvLyBXZSB2b2x1bnRhcmlseSB0aHJvdHRsZSBvdXJzZWx2ZXMgaWYgd2UgY2FuJ3QgbWFuYWdlIDYwZnBzXG4gICAgICBsYXN0RHVyYXRpb24gPSBNYXRoLm1pbihsYXN0RHVyYXRpb24gLSAxNiwgMjUwKTtcblxuICAgICAgLy8gSnVzdCBpbiBjYXNlIHRoaXMgaXMgdGhlIGxhc3QgZXZlbnQsIHJlbWVtYmVyIHRvIHBvc2l0aW9uIGp1c3Qgb25jZSBtb3JlXG4gICAgICBwZW5kaW5nVGltZW91dCA9IHNldFRpbWVvdXQodGljaywgMjUwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGxhc3RDYWxsICE9PSAndW5kZWZpbmVkJyAmJiBub3coKSAtIGxhc3RDYWxsIDwgMTApIHtcbiAgICAgIC8vIFNvbWUgYnJvd3NlcnMgY2FsbCBldmVudHMgYSBsaXR0bGUgdG9vIGZyZXF1ZW50bHksIHJlZnVzZSB0byBydW4gbW9yZSB0aGFuIGlzIHJlYXNvbmFibGVcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAocGVuZGluZ1RpbWVvdXQgIT0gbnVsbCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHBlbmRpbmdUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmdUaW1lb3V0ID0gbnVsbDtcbiAgICB9XG5cbiAgICBsYXN0Q2FsbCA9IG5vdygpO1xuICAgIHBvc2l0aW9uKCk7XG4gICAgbGFzdER1cmF0aW9uID0gbm93KCkgLSBsYXN0Q2FsbDtcbiAgfTtcblxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIFsncmVzaXplJywgJ3Njcm9sbCcsICd0b3VjaG1vdmUnXS5mb3JFYWNoKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHRpY2spO1xuICAgIH0pO1xuICB9XG59KSgpO1xuXG52YXIgTUlSUk9SX0xSID0ge1xuICBjZW50ZXI6ICdjZW50ZXInLFxuICBsZWZ0OiAncmlnaHQnLFxuICByaWdodDogJ2xlZnQnXG59O1xuXG52YXIgTUlSUk9SX1RCID0ge1xuICBtaWRkbGU6ICdtaWRkbGUnLFxuICB0b3A6ICdib3R0b20nLFxuICBib3R0b206ICd0b3AnXG59O1xuXG52YXIgT0ZGU0VUX01BUCA9IHtcbiAgdG9wOiAwLFxuICBsZWZ0OiAwLFxuICBtaWRkbGU6ICc1MCUnLFxuICBjZW50ZXI6ICc1MCUnLFxuICBib3R0b206ICcxMDAlJyxcbiAgcmlnaHQ6ICcxMDAlJ1xufTtcblxudmFyIGF1dG9Ub0ZpeGVkQXR0YWNobWVudCA9IGZ1bmN0aW9uIGF1dG9Ub0ZpeGVkQXR0YWNobWVudChhdHRhY2htZW50LCByZWxhdGl2ZVRvQXR0YWNobWVudCkge1xuICB2YXIgbGVmdCA9IGF0dGFjaG1lbnQubGVmdDtcbiAgdmFyIHRvcCA9IGF0dGFjaG1lbnQudG9wO1xuXG4gIGlmIChsZWZ0ID09PSAnYXV0bycpIHtcbiAgICBsZWZ0ID0gTUlSUk9SX0xSW3JlbGF0aXZlVG9BdHRhY2htZW50LmxlZnRdO1xuICB9XG5cbiAgaWYgKHRvcCA9PT0gJ2F1dG8nKSB7XG4gICAgdG9wID0gTUlSUk9SX1RCW3JlbGF0aXZlVG9BdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxudmFyIGF0dGFjaG1lbnRUb09mZnNldCA9IGZ1bmN0aW9uIGF0dGFjaG1lbnRUb09mZnNldChhdHRhY2htZW50KSB7XG4gIHZhciBsZWZ0ID0gYXR0YWNobWVudC5sZWZ0O1xuICB2YXIgdG9wID0gYXR0YWNobWVudC50b3A7XG5cbiAgaWYgKHR5cGVvZiBPRkZTRVRfTUFQW2F0dGFjaG1lbnQubGVmdF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgbGVmdCA9IE9GRlNFVF9NQVBbYXR0YWNobWVudC5sZWZ0XTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgdG9wID0gT0ZGU0VUX01BUFthdHRhY2htZW50LnRvcF07XG4gIH1cblxuICByZXR1cm4geyBsZWZ0OiBsZWZ0LCB0b3A6IHRvcCB9O1xufTtcblxuZnVuY3Rpb24gYWRkT2Zmc2V0KCkge1xuICB2YXIgb3V0ID0geyB0b3A6IDAsIGxlZnQ6IDAgfTtcblxuICBmb3IgKHZhciBfbGVuID0gYXJndW1lbnRzLmxlbmd0aCwgb2Zmc2V0cyA9IEFycmF5KF9sZW4pLCBfa2V5ID0gMDsgX2tleSA8IF9sZW47IF9rZXkrKykge1xuICAgIG9mZnNldHNbX2tleV0gPSBhcmd1bWVudHNbX2tleV07XG4gIH1cblxuICBvZmZzZXRzLmZvckVhY2goZnVuY3Rpb24gKF9yZWYpIHtcbiAgICB2YXIgdG9wID0gX3JlZi50b3A7XG4gICAgdmFyIGxlZnQgPSBfcmVmLmxlZnQ7XG5cbiAgICBpZiAodHlwZW9mIHRvcCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRvcCA9IHBhcnNlRmxvYXQodG9wLCAxMCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgbGVmdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGxlZnQgPSBwYXJzZUZsb2F0KGxlZnQsIDEwKTtcbiAgICB9XG5cbiAgICBvdXQudG9wICs9IHRvcDtcbiAgICBvdXQubGVmdCArPSBsZWZ0O1xuICB9KTtcblxuICByZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBvZmZzZXRUb1B4KG9mZnNldCwgc2l6ZSkge1xuICBpZiAodHlwZW9mIG9mZnNldC5sZWZ0ID09PSAnc3RyaW5nJyAmJiBvZmZzZXQubGVmdC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LmxlZnQgPSBwYXJzZUZsb2F0KG9mZnNldC5sZWZ0LCAxMCkgLyAxMDAgKiBzaXplLndpZHRoO1xuICB9XG4gIGlmICh0eXBlb2Ygb2Zmc2V0LnRvcCA9PT0gJ3N0cmluZycgJiYgb2Zmc2V0LnRvcC5pbmRleE9mKCclJykgIT09IC0xKSB7XG4gICAgb2Zmc2V0LnRvcCA9IHBhcnNlRmxvYXQob2Zmc2V0LnRvcCwgMTApIC8gMTAwICogc2l6ZS5oZWlnaHQ7XG4gIH1cblxuICByZXR1cm4gb2Zmc2V0O1xufVxuXG52YXIgcGFyc2VPZmZzZXQgPSBmdW5jdGlvbiBwYXJzZU9mZnNldCh2YWx1ZSkge1xuICB2YXIgX3ZhbHVlJHNwbGl0ID0gdmFsdWUuc3BsaXQoJyAnKTtcblxuICB2YXIgX3ZhbHVlJHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF92YWx1ZSRzcGxpdCwgMik7XG5cbiAgdmFyIHRvcCA9IF92YWx1ZSRzcGxpdDJbMF07XG4gIHZhciBsZWZ0ID0gX3ZhbHVlJHNwbGl0MlsxXTtcblxuICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xufTtcbnZhciBwYXJzZUF0dGFjaG1lbnQgPSBwYXJzZU9mZnNldDtcblxudmFyIFRldGhlckNsYXNzID0gKGZ1bmN0aW9uIChfRXZlbnRlZCkge1xuICBfaW5oZXJpdHMoVGV0aGVyQ2xhc3MsIF9FdmVudGVkKTtcblxuICBmdW5jdGlvbiBUZXRoZXJDbGFzcyhvcHRpb25zKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIF9jbGFzc0NhbGxDaGVjayh0aGlzLCBUZXRoZXJDbGFzcyk7XG5cbiAgICBfZ2V0KE9iamVjdC5nZXRQcm90b3R5cGVPZihUZXRoZXJDbGFzcy5wcm90b3R5cGUpLCAnY29uc3RydWN0b3InLCB0aGlzKS5jYWxsKHRoaXMpO1xuICAgIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmJpbmQodGhpcyk7XG5cbiAgICB0ZXRoZXJzLnB1c2godGhpcyk7XG5cbiAgICB0aGlzLmhpc3RvcnkgPSBbXTtcblxuICAgIHRoaXMuc2V0T3B0aW9ucyhvcHRpb25zLCBmYWxzZSk7XG5cbiAgICBUZXRoZXJCYXNlLm1vZHVsZXMuZm9yRWFjaChmdW5jdGlvbiAobW9kdWxlKSB7XG4gICAgICBpZiAodHlwZW9mIG1vZHVsZS5pbml0aWFsaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBtb2R1bGUuaW5pdGlhbGl6ZS5jYWxsKF90aGlzKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMucG9zaXRpb24oKTtcbiAgfVxuXG4gIF9jcmVhdGVDbGFzcyhUZXRoZXJDbGFzcywgW3tcbiAgICBrZXk6ICdnZXRDbGFzcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldENsYXNzKCkge1xuICAgICAgdmFyIGtleSA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMCB8fCBhcmd1bWVudHNbMF0gPT09IHVuZGVmaW5lZCA/ICcnIDogYXJndW1lbnRzWzBdO1xuICAgICAgdmFyIGNsYXNzZXMgPSB0aGlzLm9wdGlvbnMuY2xhc3NlcztcblxuICAgICAgaWYgKHR5cGVvZiBjbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiBjbGFzc2VzW2tleV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3B0aW9ucy5jbGFzc2VzW2tleV07XG4gICAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5jbGFzc1ByZWZpeCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNsYXNzUHJlZml4ICsgJy0nICsga2V5O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdzZXRPcHRpb25zJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRpb25zKSB7XG4gICAgICB2YXIgX3RoaXMyID0gdGhpcztcblxuICAgICAgdmFyIHBvcyA9IGFyZ3VtZW50cy5sZW5ndGggPD0gMSB8fCBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmd1bWVudHNbMV07XG5cbiAgICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgb2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0T2Zmc2V0OiAnMCAwJyxcbiAgICAgICAgdGFyZ2V0QXR0YWNobWVudDogJ2F1dG8gYXV0bycsXG4gICAgICAgIGNsYXNzUHJlZml4OiAndGV0aGVyJ1xuICAgICAgfTtcblxuICAgICAgdGhpcy5vcHRpb25zID0gZXh0ZW5kKGRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgICAgdmFyIF9vcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgdmFyIGVsZW1lbnQgPSBfb3B0aW9ucy5lbGVtZW50O1xuICAgICAgdmFyIHRhcmdldCA9IF9vcHRpb25zLnRhcmdldDtcbiAgICAgIHZhciB0YXJnZXRNb2RpZmllciA9IF9vcHRpb25zLnRhcmdldE1vZGlmaWVyO1xuXG4gICAgICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50O1xuICAgICAgdGhpcy50YXJnZXQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gdGFyZ2V0TW9kaWZpZXI7XG5cbiAgICAgIGlmICh0aGlzLnRhcmdldCA9PT0gJ3ZpZXdwb3J0Jykge1xuICAgICAgICB0aGlzLnRhcmdldCA9IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIHRoaXMudGFyZ2V0TW9kaWZpZXIgPSAndmlzaWJsZSc7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMudGFyZ2V0ID09PSAnc2Nyb2xsLWhhbmRsZScpIHtcbiAgICAgICAgdGhpcy50YXJnZXQgPSBkb2N1bWVudC5ib2R5O1xuICAgICAgICB0aGlzLnRhcmdldE1vZGlmaWVyID0gJ3Njcm9sbC1oYW5kbGUnO1xuICAgICAgfVxuXG4gICAgICBbJ2VsZW1lbnQnLCAndGFyZ2V0J10uZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUZXRoZXIgRXJyb3I6IEJvdGggZWxlbWVudCBhbmQgdGFyZ2V0IG11c3QgYmUgZGVmaW5lZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBfdGhpczJba2V5XS5qcXVlcnkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBfdGhpczJba2V5XVswXTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgX3RoaXMyW2tleV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgX3RoaXMyW2tleV0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKF90aGlzMltrZXldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGFkZENsYXNzKHRoaXMuZWxlbWVudCwgdGhpcy5nZXRDbGFzcygnZWxlbWVudCcpKTtcbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgYWRkQ2xhc3ModGhpcy50YXJnZXQsIHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldCcpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuYXR0YWNobWVudCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1RldGhlciBFcnJvcjogWW91IG11c3QgcHJvdmlkZSBhbiBhdHRhY2htZW50Jyk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMudGFyZ2V0QXR0YWNobWVudCA9IHBhcnNlQXR0YWNobWVudCh0aGlzLm9wdGlvbnMudGFyZ2V0QXR0YWNobWVudCk7XG4gICAgICB0aGlzLmF0dGFjaG1lbnQgPSBwYXJzZUF0dGFjaG1lbnQodGhpcy5vcHRpb25zLmF0dGFjaG1lbnQpO1xuICAgICAgdGhpcy5vZmZzZXQgPSBwYXJzZU9mZnNldCh0aGlzLm9wdGlvbnMub2Zmc2V0KTtcbiAgICAgIHRoaXMudGFyZ2V0T2Zmc2V0ID0gcGFyc2VPZmZzZXQodGhpcy5vcHRpb25zLnRhcmdldE9mZnNldCk7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLmRpc2FibGUoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMudGFyZ2V0TW9kaWZpZXIgPT09ICdzY3JvbGwtaGFuZGxlJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMgPSBbdGhpcy50YXJnZXRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzID0gZ2V0U2Nyb2xsUGFyZW50cyh0aGlzLnRhcmdldCk7XG4gICAgICB9XG5cbiAgICAgIGlmICghKHRoaXMub3B0aW9ucy5lbmFibGVkID09PSBmYWxzZSkpIHtcbiAgICAgICAgdGhpcy5lbmFibGUocG9zKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdnZXRUYXJnZXRCb3VuZHMnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBnZXRUYXJnZXRCb3VuZHMoKSB7XG4gICAgICBpZiAodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGlmICh0aGlzLnRhcmdldE1vZGlmaWVyID09PSAndmlzaWJsZScpIHtcbiAgICAgICAgICBpZiAodGhpcy50YXJnZXQgPT09IGRvY3VtZW50LmJvZHkpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHRvcDogcGFnZVlPZmZzZXQsIGxlZnQ6IHBhZ2VYT2Zmc2V0LCBoZWlnaHQ6IGlubmVySGVpZ2h0LCB3aWR0aDogaW5uZXJXaWR0aCB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRzKHRoaXMudGFyZ2V0KTtcblxuICAgICAgICAgICAgdmFyIG91dCA9IHtcbiAgICAgICAgICAgICAgaGVpZ2h0OiBib3VuZHMuaGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogYm91bmRzLndpZHRoLFxuICAgICAgICAgICAgICB0b3A6IGJvdW5kcy50b3AsXG4gICAgICAgICAgICAgIGxlZnQ6IGJvdW5kcy5sZWZ0XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4ob3V0LmhlaWdodCwgYm91bmRzLmhlaWdodCAtIChwYWdlWU9mZnNldCAtIGJvdW5kcy50b3ApKTtcbiAgICAgICAgICAgIG91dC5oZWlnaHQgPSBNYXRoLm1pbihvdXQuaGVpZ2h0LCBib3VuZHMuaGVpZ2h0IC0gKGJvdW5kcy50b3AgKyBib3VuZHMuaGVpZ2h0IC0gKHBhZ2VZT2Zmc2V0ICsgaW5uZXJIZWlnaHQpKSk7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5taW4oaW5uZXJIZWlnaHQsIG91dC5oZWlnaHQpO1xuICAgICAgICAgICAgb3V0LmhlaWdodCAtPSAyO1xuXG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCAtIGJvdW5kcy5sZWZ0KSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihvdXQud2lkdGgsIGJvdW5kcy53aWR0aCAtIChib3VuZHMubGVmdCArIGJvdW5kcy53aWR0aCAtIChwYWdlWE9mZnNldCArIGlubmVyV2lkdGgpKSk7XG4gICAgICAgICAgICBvdXQud2lkdGggPSBNYXRoLm1pbihpbm5lcldpZHRoLCBvdXQud2lkdGgpO1xuICAgICAgICAgICAgb3V0LndpZHRoIC09IDI7XG5cbiAgICAgICAgICAgIGlmIChvdXQudG9wIDwgcGFnZVlPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LnRvcCA9IHBhZ2VZT2Zmc2V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG91dC5sZWZ0IDwgcGFnZVhPZmZzZXQpIHtcbiAgICAgICAgICAgICAgb3V0LmxlZnQgPSBwYWdlWE9mZnNldDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG91dDtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy50YXJnZXRNb2RpZmllciA9PT0gJ3Njcm9sbC1oYW5kbGUnKSB7XG4gICAgICAgICAgdmFyIGJvdW5kcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy50YXJnZXQ7XG4gICAgICAgICAgaWYgKHRhcmdldCA9PT0gZG9jdW1lbnQuYm9keSkge1xuICAgICAgICAgICAgdGFyZ2V0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgICAgICAgICBib3VuZHMgPSB7XG4gICAgICAgICAgICAgIGxlZnQ6IHBhZ2VYT2Zmc2V0LFxuICAgICAgICAgICAgICB0b3A6IHBhZ2VZT2Zmc2V0LFxuICAgICAgICAgICAgICBoZWlnaHQ6IGlubmVySGVpZ2h0LFxuICAgICAgICAgICAgICB3aWR0aDogaW5uZXJXaWR0aFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYm91bmRzID0gZ2V0Qm91bmRzKHRhcmdldCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0YXJnZXQpO1xuXG4gICAgICAgICAgdmFyIGhhc0JvdHRvbVNjcm9sbCA9IHRhcmdldC5zY3JvbGxXaWR0aCA+IHRhcmdldC5jbGllbnRXaWR0aCB8fCBbc3R5bGUub3ZlcmZsb3csIHN0eWxlLm92ZXJmbG93WF0uaW5kZXhPZignc2Nyb2xsJykgPj0gMCB8fCB0aGlzLnRhcmdldCAhPT0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgICAgIHZhciBzY3JvbGxCb3R0b20gPSAwO1xuICAgICAgICAgIGlmIChoYXNCb3R0b21TY3JvbGwpIHtcbiAgICAgICAgICAgIHNjcm9sbEJvdHRvbSA9IDE1O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBoZWlnaHQgPSBib3VuZHMuaGVpZ2h0IC0gcGFyc2VGbG9hdChzdHlsZS5ib3JkZXJUb3BXaWR0aCkgLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckJvdHRvbVdpZHRoKSAtIHNjcm9sbEJvdHRvbTtcblxuICAgICAgICAgIHZhciBvdXQgPSB7XG4gICAgICAgICAgICB3aWR0aDogMTUsXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCAqIDAuOTc1ICogKGhlaWdodCAvIHRhcmdldC5zY3JvbGxIZWlnaHQpLFxuICAgICAgICAgICAgbGVmdDogYm91bmRzLmxlZnQgKyBib3VuZHMud2lkdGggLSBwYXJzZUZsb2F0KHN0eWxlLmJvcmRlckxlZnRXaWR0aCkgLSAxNVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgZml0QWRqID0gMDtcbiAgICAgICAgICBpZiAoaGVpZ2h0IDwgNDA4ICYmIHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBmaXRBZGogPSAtMC4wMDAxMSAqIE1hdGgucG93KGhlaWdodCwgMikgLSAwLjAwNzI3ICogaGVpZ2h0ICsgMjIuNTg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ICE9PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBzY3JvbGxQZXJjZW50YWdlID0gdGhpcy50YXJnZXQuc2Nyb2xsVG9wIC8gKHRhcmdldC5zY3JvbGxIZWlnaHQgLSBoZWlnaHQpO1xuICAgICAgICAgIG91dC50b3AgPSBzY3JvbGxQZXJjZW50YWdlICogKGhlaWdodCAtIG91dC5oZWlnaHQgLSBmaXRBZGopICsgYm91bmRzLnRvcCArIHBhcnNlRmxvYXQoc3R5bGUuYm9yZGVyVG9wV2lkdGgpO1xuXG4gICAgICAgICAgaWYgKHRoaXMudGFyZ2V0ID09PSBkb2N1bWVudC5ib2R5KSB7XG4gICAgICAgICAgICBvdXQuaGVpZ2h0ID0gTWF0aC5tYXgob3V0LmhlaWdodCwgMjQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBvdXQ7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHModGhpcy50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2NsZWFyQ2FjaGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBjbGVhckNhY2hlKCkge1xuICAgICAgdGhpcy5fY2FjaGUgPSB7fTtcbiAgICB9XG4gIH0sIHtcbiAgICBrZXk6ICdjYWNoZScsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGNhY2hlKGssIGdldHRlcikge1xuICAgICAgLy8gTW9yZSB0aGFuIG9uZSBtb2R1bGUgd2lsbCBvZnRlbiBuZWVkIHRoZSBzYW1lIERPTSBpbmZvLCBzb1xuICAgICAgLy8gd2Uga2VlcCBhIGNhY2hlIHdoaWNoIGlzIGNsZWFyZWQgb24gZWFjaCBwb3NpdGlvbiBjYWxsXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHRoaXMuX2NhY2hlW2tdID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLl9jYWNoZVtrXSA9IGdldHRlci5jYWxsKHRoaXMpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVba107XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAnZW5hYmxlJyxcbiAgICB2YWx1ZTogZnVuY3Rpb24gZW5hYmxlKCkge1xuICAgICAgdmFyIF90aGlzMyA9IHRoaXM7XG5cbiAgICAgIHZhciBwb3MgPSBhcmd1bWVudHMubGVuZ3RoIDw9IDAgfHwgYXJndW1lbnRzWzBdID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJndW1lbnRzWzBdO1xuXG4gICAgICBpZiAoISh0aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIGFkZENsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgfVxuICAgICAgYWRkQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5zY3JvbGxQYXJlbnRzLmZvckVhY2goZnVuY3Rpb24gKHBhcmVudCkge1xuICAgICAgICBpZiAocGFyZW50ICE9PSBfdGhpczMudGFyZ2V0Lm93bmVyRG9jdW1lbnQpIHtcbiAgICAgICAgICBwYXJlbnQuYWRkRXZlbnRMaXN0ZW5lcignc2Nyb2xsJywgX3RoaXMzLnBvc2l0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChwb3MpIHtcbiAgICAgICAgdGhpcy5wb3NpdGlvbigpO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rpc2FibGUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkaXNhYmxlKCkge1xuICAgICAgdmFyIF90aGlzNCA9IHRoaXM7XG5cbiAgICAgIHJlbW92ZUNsYXNzKHRoaXMudGFyZ2V0LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgcmVtb3ZlQ2xhc3ModGhpcy5lbGVtZW50LCB0aGlzLmdldENsYXNzKCdlbmFibGVkJykpO1xuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5zY3JvbGxQYXJlbnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB0aGlzLnNjcm9sbFBhcmVudHMuZm9yRWFjaChmdW5jdGlvbiAocGFyZW50KSB7XG4gICAgICAgICAgcGFyZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3Njcm9sbCcsIF90aGlzNC5wb3NpdGlvbik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSwge1xuICAgIGtleTogJ2Rlc3Ryb3knLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBkZXN0cm95KCkge1xuICAgICAgdmFyIF90aGlzNSA9IHRoaXM7XG5cbiAgICAgIHRoaXMuZGlzYWJsZSgpO1xuXG4gICAgICB0ZXRoZXJzLmZvckVhY2goZnVuY3Rpb24gKHRldGhlciwgaSkge1xuICAgICAgICBpZiAodGV0aGVyID09PSBfdGhpczUpIHtcbiAgICAgICAgICB0ZXRoZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIFJlbW92ZSBhbnkgZWxlbWVudHMgd2Ugd2VyZSB1c2luZyBmb3IgY29udmVuaWVuY2UgZnJvbSB0aGUgRE9NXG4gICAgICBpZiAodGV0aGVycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmVtb3ZlVXRpbEVsZW1lbnRzKCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAndXBkYXRlQXR0YWNoQ2xhc3NlcycsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHVwZGF0ZUF0dGFjaENsYXNzZXMoZWxlbWVudEF0dGFjaCwgdGFyZ2V0QXR0YWNoKSB7XG4gICAgICB2YXIgX3RoaXM2ID0gdGhpcztcblxuICAgICAgZWxlbWVudEF0dGFjaCA9IGVsZW1lbnRBdHRhY2ggfHwgdGhpcy5hdHRhY2htZW50O1xuICAgICAgdGFyZ2V0QXR0YWNoID0gdGFyZ2V0QXR0YWNoIHx8IHRoaXMudGFyZ2V0QXR0YWNobWVudDtcbiAgICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAnYm90dG9tJywgJ3JpZ2h0JywgJ21pZGRsZScsICdjZW50ZXInXTtcblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzICE9PSAndW5kZWZpbmVkJyAmJiB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCkge1xuICAgICAgICAvLyB1cGRhdGVBdHRhY2hDbGFzc2VzIGNhbiBiZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UgaW4gYSBwb3NpdGlvbiBjYWxsLCBzb1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIGNsZWFuIHVwIGFmdGVyIG91cnNlbHZlcyBzdWNoIHRoYXQgd2hlbiB0aGUgbGFzdCBkZWZlciBnZXRzXG4gICAgICAgIC8vIHJhbiBpdCBkb2Vzbid0IGFkZCBhbnkgZXh0cmEgY2xhc3NlcyBmcm9tIHByZXZpb3VzIGNhbGxzLlxuICAgICAgICB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLnNwbGljZSgwLCB0aGlzLl9hZGRBdHRhY2hDbGFzc2VzLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdGhpcy5fYWRkQXR0YWNoQ2xhc3NlcyA9IFtdO1xuICAgICAgfVxuICAgICAgdmFyIGFkZCA9IHRoaXMuX2FkZEF0dGFjaENsYXNzZXM7XG5cbiAgICAgIGlmIChlbGVtZW50QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCdlbGVtZW50LWF0dGFjaGVkJykgKyAnLScgKyBlbGVtZW50QXR0YWNoLnRvcCk7XG4gICAgICB9XG4gICAgICBpZiAoZWxlbWVudEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2VsZW1lbnQtYXR0YWNoZWQnKSArICctJyArIGVsZW1lbnRBdHRhY2gubGVmdCk7XG4gICAgICB9XG4gICAgICBpZiAodGFyZ2V0QXR0YWNoLnRvcCkge1xuICAgICAgICBhZGQucHVzaCh0aGlzLmdldENsYXNzKCd0YXJnZXQtYXR0YWNoZWQnKSArICctJyArIHRhcmdldEF0dGFjaC50b3ApO1xuICAgICAgfVxuICAgICAgaWYgKHRhcmdldEF0dGFjaC5sZWZ0KSB7XG4gICAgICAgIGFkZC5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ3RhcmdldC1hdHRhY2hlZCcpICsgJy0nICsgdGFyZ2V0QXR0YWNoLmxlZnQpO1xuICAgICAgfVxuXG4gICAgICB2YXIgYWxsID0gW107XG4gICAgICBzaWRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygnZWxlbWVudC1hdHRhY2hlZCcpICsgJy0nICsgc2lkZSk7XG4gICAgICAgIGFsbC5wdXNoKF90aGlzNi5nZXRDbGFzcygndGFyZ2V0LWF0dGFjaGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuXG4gICAgICBkZWZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghKHR5cGVvZiBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXM2LmVsZW1lbnQsIF90aGlzNi5fYWRkQXR0YWNoQ2xhc3NlcywgYWxsKTtcbiAgICAgICAgaWYgKCEoX3RoaXM2Lm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpczYudGFyZ2V0LCBfdGhpczYuX2FkZEF0dGFjaENsYXNzZXMsIGFsbCk7XG4gICAgICAgIH1cblxuICAgICAgICBkZWxldGUgX3RoaXM2Ll9hZGRBdHRhY2hDbGFzc2VzO1xuICAgICAgfSk7XG4gICAgfVxuICB9LCB7XG4gICAga2V5OiAncG9zaXRpb24nLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBwb3NpdGlvbigpIHtcbiAgICAgIHZhciBfdGhpczcgPSB0aGlzO1xuXG4gICAgICB2YXIgZmx1c2hDaGFuZ2VzID0gYXJndW1lbnRzLmxlbmd0aCA8PSAwIHx8IGFyZ3VtZW50c1swXSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZ3VtZW50c1swXTtcblxuICAgICAgLy8gZmx1c2hDaGFuZ2VzIGNvbW1pdHMgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHksIGxlYXZlIHRydWUgdW5sZXNzIHlvdSBhcmUgcG9zaXRpb25pbmcgbXVsdGlwbGVcbiAgICAgIC8vIHRldGhlcnMgKGluIHdoaWNoIGNhc2UgY2FsbCBUZXRoZXIuVXRpbHMuZmx1c2ggeW91cnNlbGYgd2hlbiB5b3UncmUgZG9uZSlcblxuICAgICAgaWYgKCF0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmNsZWFyQ2FjaGUoKTtcblxuICAgICAgLy8gVHVybiAnYXV0bycgYXR0YWNobWVudHMgaW50byB0aGUgYXBwcm9wcmlhdGUgY29ybmVyIG9yIGVkZ2VcbiAgICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gYXV0b1RvRml4ZWRBdHRhY2htZW50KHRoaXMudGFyZ2V0QXR0YWNobWVudCwgdGhpcy5hdHRhY2htZW50KTtcblxuICAgICAgdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKHRoaXMuYXR0YWNobWVudCwgdGFyZ2V0QXR0YWNobWVudCk7XG5cbiAgICAgIHZhciBlbGVtZW50UG9zID0gdGhpcy5jYWNoZSgnZWxlbWVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXM3LmVsZW1lbnQpO1xuICAgICAgfSk7XG5cbiAgICAgIHZhciB3aWR0aCA9IGVsZW1lbnRQb3Mud2lkdGg7XG4gICAgICB2YXIgaGVpZ2h0ID0gZWxlbWVudFBvcy5oZWlnaHQ7XG5cbiAgICAgIGlmICh3aWR0aCA9PT0gMCAmJiBoZWlnaHQgPT09IDAgJiYgdHlwZW9mIHRoaXMubGFzdFNpemUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBfbGFzdFNpemUgPSB0aGlzLmxhc3RTaXplO1xuXG4gICAgICAgIC8vIFdlIGNhY2hlIHRoZSBoZWlnaHQgYW5kIHdpZHRoIHRvIG1ha2UgaXQgcG9zc2libGUgdG8gcG9zaXRpb24gZWxlbWVudHMgdGhhdCBhcmVcbiAgICAgICAgLy8gZ2V0dGluZyBoaWRkZW4uXG4gICAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgICBoZWlnaHQgPSBfbGFzdFNpemUuaGVpZ2h0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5sYXN0U2l6ZSA9IHsgd2lkdGg6IHdpZHRoLCBoZWlnaHQ6IGhlaWdodCB9O1xuICAgICAgfVxuXG4gICAgICB2YXIgdGFyZ2V0UG9zID0gdGhpcy5jYWNoZSgndGFyZ2V0LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF90aGlzNy5nZXRUYXJnZXRCb3VuZHMoKTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHRhcmdldFNpemUgPSB0YXJnZXRQb3M7XG5cbiAgICAgIC8vIEdldCBhbiBhY3R1YWwgcHggb2Zmc2V0IGZyb20gdGhlIGF0dGFjaG1lbnRcbiAgICAgIHZhciBvZmZzZXQgPSBvZmZzZXRUb1B4KGF0dGFjaG1lbnRUb09mZnNldCh0aGlzLmF0dGFjaG1lbnQpLCB7IHdpZHRoOiB3aWR0aCwgaGVpZ2h0OiBoZWlnaHQgfSk7XG4gICAgICB2YXIgdGFyZ2V0T2Zmc2V0ID0gb2Zmc2V0VG9QeChhdHRhY2htZW50VG9PZmZzZXQodGFyZ2V0QXR0YWNobWVudCksIHRhcmdldFNpemUpO1xuXG4gICAgICB2YXIgbWFudWFsT2Zmc2V0ID0gb2Zmc2V0VG9QeCh0aGlzLm9mZnNldCwgeyB3aWR0aDogd2lkdGgsIGhlaWdodDogaGVpZ2h0IH0pO1xuICAgICAgdmFyIG1hbnVhbFRhcmdldE9mZnNldCA9IG9mZnNldFRvUHgodGhpcy50YXJnZXRPZmZzZXQsIHRhcmdldFNpemUpO1xuXG4gICAgICAvLyBBZGQgdGhlIG1hbnVhbGx5IHByb3ZpZGVkIG9mZnNldFxuICAgICAgb2Zmc2V0ID0gYWRkT2Zmc2V0KG9mZnNldCwgbWFudWFsT2Zmc2V0KTtcbiAgICAgIHRhcmdldE9mZnNldCA9IGFkZE9mZnNldCh0YXJnZXRPZmZzZXQsIG1hbnVhbFRhcmdldE9mZnNldCk7XG5cbiAgICAgIC8vIEl0J3Mgbm93IG91ciBnb2FsIHRvIG1ha2UgKGVsZW1lbnQgcG9zaXRpb24gKyBvZmZzZXQpID09ICh0YXJnZXQgcG9zaXRpb24gKyB0YXJnZXQgb2Zmc2V0KVxuICAgICAgdmFyIGxlZnQgPSB0YXJnZXRQb3MubGVmdCArIHRhcmdldE9mZnNldC5sZWZ0IC0gb2Zmc2V0LmxlZnQ7XG4gICAgICB2YXIgdG9wID0gdGFyZ2V0UG9zLnRvcCArIHRhcmdldE9mZnNldC50b3AgLSBvZmZzZXQudG9wO1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IFRldGhlckJhc2UubW9kdWxlcy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgX21vZHVsZTIgPSBUZXRoZXJCYXNlLm1vZHVsZXNbaV07XG4gICAgICAgIHZhciByZXQgPSBfbW9kdWxlMi5wb3NpdGlvbi5jYWxsKHRoaXMsIHtcbiAgICAgICAgICBsZWZ0OiBsZWZ0LFxuICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAgIHRhcmdldEF0dGFjaG1lbnQ6IHRhcmdldEF0dGFjaG1lbnQsXG4gICAgICAgICAgdGFyZ2V0UG9zOiB0YXJnZXRQb3MsXG4gICAgICAgICAgZWxlbWVudFBvczogZWxlbWVudFBvcyxcbiAgICAgICAgICBvZmZzZXQ6IG9mZnNldCxcbiAgICAgICAgICB0YXJnZXRPZmZzZXQ6IHRhcmdldE9mZnNldCxcbiAgICAgICAgICBtYW51YWxPZmZzZXQ6IG1hbnVhbE9mZnNldCxcbiAgICAgICAgICBtYW51YWxUYXJnZXRPZmZzZXQ6IG1hbnVhbFRhcmdldE9mZnNldCxcbiAgICAgICAgICBzY3JvbGxiYXJTaXplOiBzY3JvbGxiYXJTaXplLFxuICAgICAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAocmV0ID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcmV0ID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgcmV0ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRvcCA9IHJldC50b3A7XG4gICAgICAgICAgbGVmdCA9IHJldC5sZWZ0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGRlc2NyaWJlIHRoZSBwb3NpdGlvbiB0aHJlZSBkaWZmZXJlbnQgd2F5cyB0byBnaXZlIHRoZSBvcHRpbWl6ZXJcbiAgICAgIC8vIGEgY2hhbmNlIHRvIGRlY2lkZSB0aGUgYmVzdCBwb3NzaWJsZSB3YXkgdG8gcG9zaXRpb24gdGhlIGVsZW1lbnRcbiAgICAgIC8vIHdpdGggdGhlIGZld2VzdCByZXBhaW50cy5cbiAgICAgIHZhciBuZXh0ID0ge1xuICAgICAgICAvLyBJdCdzIHBvc2l0aW9uIHJlbGF0aXZlIHRvIHRoZSBwYWdlIChhYnNvbHV0ZSBwb3NpdGlvbmluZyB3aGVuXG4gICAgICAgIC8vIHRoZSBlbGVtZW50IGlzIGEgY2hpbGQgb2YgdGhlIGJvZHkpXG4gICAgICAgIHBhZ2U6IHtcbiAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgICBsZWZ0OiBsZWZ0XG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gSXQncyBwb3NpdGlvbiByZWxhdGl2ZSB0byB0aGUgdmlld3BvcnQgKGZpeGVkIHBvc2l0aW9uaW5nKVxuICAgICAgICB2aWV3cG9ydDoge1xuICAgICAgICAgIHRvcDogdG9wIC0gcGFnZVlPZmZzZXQsXG4gICAgICAgICAgYm90dG9tOiBwYWdlWU9mZnNldCAtIHRvcCAtIGhlaWdodCArIGlubmVySGVpZ2h0LFxuICAgICAgICAgIGxlZnQ6IGxlZnQgLSBwYWdlWE9mZnNldCxcbiAgICAgICAgICByaWdodDogcGFnZVhPZmZzZXQgLSBsZWZ0IC0gd2lkdGggKyBpbm5lcldpZHRoXG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBkb2MgPSB0aGlzLnRhcmdldC5vd25lckRvY3VtZW50O1xuICAgICAgdmFyIHdpbiA9IGRvYy5kZWZhdWx0VmlldztcblxuICAgICAgdmFyIHNjcm9sbGJhclNpemUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAod2luLmlubmVySGVpZ2h0ID4gZG9jLmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQpIHtcbiAgICAgICAgc2Nyb2xsYmFyU2l6ZSA9IHRoaXMuY2FjaGUoJ3Njcm9sbGJhci1zaXplJywgZ2V0U2Nyb2xsQmFyU2l6ZSk7XG4gICAgICAgIG5leHQudmlld3BvcnQuYm90dG9tIC09IHNjcm9sbGJhclNpemUuaGVpZ2h0O1xuICAgICAgfVxuXG4gICAgICBpZiAod2luLmlubmVyV2lkdGggPiBkb2MuZG9jdW1lbnRFbGVtZW50LmNsaWVudFdpZHRoKSB7XG4gICAgICAgIHNjcm9sbGJhclNpemUgPSB0aGlzLmNhY2hlKCdzY3JvbGxiYXItc2l6ZScsIGdldFNjcm9sbEJhclNpemUpO1xuICAgICAgICBuZXh0LnZpZXdwb3J0LnJpZ2h0IC09IHNjcm9sbGJhclNpemUud2lkdGg7XG4gICAgICB9XG5cbiAgICAgIGlmIChbJycsICdzdGF0aWMnXS5pbmRleE9mKGRvYy5ib2R5LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEgfHwgWycnLCAnc3RhdGljJ10uaW5kZXhPZihkb2MuYm9keS5wYXJlbnRFbGVtZW50LnN0eWxlLnBvc2l0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgLy8gQWJzb2x1dGUgcG9zaXRpb25pbmcgaW4gdGhlIGJvZHkgd2lsbCBiZSByZWxhdGl2ZSB0byB0aGUgcGFnZSwgbm90IHRoZSAnaW5pdGlhbCBjb250YWluaW5nIGJsb2NrJ1xuICAgICAgICBuZXh0LnBhZ2UuYm90dG9tID0gZG9jLmJvZHkuc2Nyb2xsSGVpZ2h0IC0gdG9wIC0gaGVpZ2h0O1xuICAgICAgICBuZXh0LnBhZ2UucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIGxlZnQgLSB3aWR0aDtcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMub3B0aW1pemF0aW9ucyAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5vcHRpb25zLm9wdGltaXphdGlvbnMubW92ZUVsZW1lbnQgIT09IGZhbHNlICYmICEodHlwZW9mIHRoaXMudGFyZ2V0TW9kaWZpZXIgIT09ICd1bmRlZmluZWQnKSkge1xuICAgICAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczcuY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzNy50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHZhciBvZmZzZXRQb3NpdGlvbiA9IF90aGlzNy5jYWNoZSgndGFyZ2V0LW9mZnNldHBhcmVudC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0Qm91bmRzKG9mZnNldFBhcmVudCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdmFyIG9mZnNldFBhcmVudFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShvZmZzZXRQYXJlbnQpO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnRTaXplID0gb2Zmc2V0UG9zaXRpb247XG5cbiAgICAgICAgICB2YXIgb2Zmc2V0Qm9yZGVyID0ge307XG4gICAgICAgICAgWydUb3AnLCAnTGVmdCcsICdCb3R0b20nLCAnUmlnaHQnXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBvZmZzZXRCb3JkZXJbc2lkZS50b0xvd2VyQ2FzZSgpXSA9IHBhcnNlRmxvYXQob2Zmc2V0UGFyZW50U3R5bGVbJ2JvcmRlcicgKyBzaWRlICsgJ1dpZHRoJ10pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgb2Zmc2V0UG9zaXRpb24ucmlnaHQgPSBkb2MuYm9keS5zY3JvbGxXaWR0aCAtIG9mZnNldFBvc2l0aW9uLmxlZnQgLSBvZmZzZXRQYXJlbnRTaXplLndpZHRoICsgb2Zmc2V0Qm9yZGVyLnJpZ2h0O1xuICAgICAgICAgIG9mZnNldFBvc2l0aW9uLmJvdHRvbSA9IGRvYy5ib2R5LnNjcm9sbEhlaWdodCAtIG9mZnNldFBvc2l0aW9uLnRvcCAtIG9mZnNldFBhcmVudFNpemUuaGVpZ2h0ICsgb2Zmc2V0Qm9yZGVyLmJvdHRvbTtcblxuICAgICAgICAgIGlmIChuZXh0LnBhZ2UudG9wID49IG9mZnNldFBvc2l0aW9uLnRvcCArIG9mZnNldEJvcmRlci50b3AgJiYgbmV4dC5wYWdlLmJvdHRvbSA+PSBvZmZzZXRQb3NpdGlvbi5ib3R0b20pIHtcbiAgICAgICAgICAgIGlmIChuZXh0LnBhZ2UubGVmdCA+PSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgb2Zmc2V0Qm9yZGVyLmxlZnQgJiYgbmV4dC5wYWdlLnJpZ2h0ID49IG9mZnNldFBvc2l0aW9uLnJpZ2h0KSB7XG4gICAgICAgICAgICAgIC8vIFdlJ3JlIHdpdGhpbiB0aGUgdmlzaWJsZSBwYXJ0IG9mIHRoZSB0YXJnZXQncyBzY3JvbGwgcGFyZW50XG4gICAgICAgICAgICAgIHZhciBzY3JvbGxUb3AgPSBvZmZzZXRQYXJlbnQuc2Nyb2xsVG9wO1xuICAgICAgICAgICAgICB2YXIgc2Nyb2xsTGVmdCA9IG9mZnNldFBhcmVudC5zY3JvbGxMZWZ0O1xuXG4gICAgICAgICAgICAgIC8vIEl0J3MgcG9zaXRpb24gcmVsYXRpdmUgdG8gdGhlIHRhcmdldCdzIG9mZnNldCBwYXJlbnQgKGFic29sdXRlIHBvc2l0aW9uaW5nIHdoZW5cbiAgICAgICAgICAgICAgLy8gdGhlIGVsZW1lbnQgaXMgbW92ZWQgdG8gYmUgYSBjaGlsZCBvZiB0aGUgdGFyZ2V0J3Mgb2Zmc2V0IHBhcmVudCkuXG4gICAgICAgICAgICAgIG5leHQub2Zmc2V0ID0ge1xuICAgICAgICAgICAgICAgIHRvcDogbmV4dC5wYWdlLnRvcCAtIG9mZnNldFBvc2l0aW9uLnRvcCArIHNjcm9sbFRvcCAtIG9mZnNldEJvcmRlci50b3AsXG4gICAgICAgICAgICAgICAgbGVmdDogbmV4dC5wYWdlLmxlZnQgLSBvZmZzZXRQb3NpdGlvbi5sZWZ0ICsgc2Nyb2xsTGVmdCAtIG9mZnNldEJvcmRlci5sZWZ0XG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBjb3VsZCBhbHNvIHRyYXZlbCB1cCB0aGUgRE9NIGFuZCB0cnkgZWFjaCBjb250YWluaW5nIGNvbnRleHQsIHJhdGhlciB0aGFuIG9ubHlcbiAgICAgIC8vIGxvb2tpbmcgYXQgdGhlIGJvZHksIGJ1dCB3ZSdyZSBnb25uYSBnZXQgZGltaW5pc2hpbmcgcmV0dXJucy5cblxuICAgICAgdGhpcy5tb3ZlKG5leHQpO1xuXG4gICAgICB0aGlzLmhpc3RvcnkudW5zaGlmdChuZXh0KTtcblxuICAgICAgaWYgKHRoaXMuaGlzdG9yeS5sZW5ndGggPiAzKSB7XG4gICAgICAgIHRoaXMuaGlzdG9yeS5wb3AoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGZsdXNoQ2hhbmdlcykge1xuICAgICAgICBmbHVzaCgpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBUSEUgSVNTVUVcbiAgfSwge1xuICAgIGtleTogJ21vdmUnLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBtb3ZlKHBvcykge1xuICAgICAgdmFyIF90aGlzOCA9IHRoaXM7XG5cbiAgICAgIGlmICghKHR5cGVvZiB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZSAhPT0gJ3VuZGVmaW5lZCcpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHNhbWUgPSB7fTtcblxuICAgICAgZm9yICh2YXIgdHlwZSBpbiBwb3MpIHtcbiAgICAgICAgc2FtZVt0eXBlXSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBwb3NbdHlwZV0pIHtcbiAgICAgICAgICB2YXIgZm91bmQgPSBmYWxzZTtcblxuICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5oaXN0b3J5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgcG9pbnQgPSB0aGlzLmhpc3RvcnlbaV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBvaW50W3R5cGVdICE9PSAndW5kZWZpbmVkJyAmJiAhd2l0aGluKHBvaW50W3R5cGVdW2tleV0sIHBvc1t0eXBlXVtrZXldKSkge1xuICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZm91bmQpIHtcbiAgICAgICAgICAgIHNhbWVbdHlwZV1ba2V5XSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBjc3MgPSB7IHRvcDogJycsIGxlZnQ6ICcnLCByaWdodDogJycsIGJvdHRvbTogJycgfTtcblxuICAgICAgdmFyIHRyYW5zY3JpYmUgPSBmdW5jdGlvbiB0cmFuc2NyaWJlKF9zYW1lLCBfcG9zKSB7XG4gICAgICAgIHZhciBoYXNPcHRpbWl6YXRpb25zID0gdHlwZW9mIF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgZ3B1ID0gaGFzT3B0aW1pemF0aW9ucyA/IF90aGlzOC5vcHRpb25zLm9wdGltaXphdGlvbnMuZ3B1IDogbnVsbDtcbiAgICAgICAgaWYgKGdwdSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICB2YXIgeVBvcyA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgeFBvcyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBpZiAoX3NhbWUudG9wKSB7XG4gICAgICAgICAgICBjc3MudG9wID0gMDtcbiAgICAgICAgICAgIHlQb3MgPSBfcG9zLnRvcDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IDA7XG4gICAgICAgICAgICB5UG9zID0gLV9wb3MuYm90dG9tO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfc2FtZS5sZWZ0KSB7XG4gICAgICAgICAgICBjc3MubGVmdCA9IDA7XG4gICAgICAgICAgICB4UG9zID0gX3Bvcy5sZWZ0O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSAwO1xuICAgICAgICAgICAgeFBvcyA9IC1fcG9zLnJpZ2h0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYSkge1xuICAgICAgICAgICAgLy8gSHViU3BvdC90ZXRoZXIjMjA3XG4gICAgICAgICAgICB2YXIgcmV0aW5hID0gd2luZG93Lm1hdGNoTWVkaWEoJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDEuM2RwcHgpJykubWF0Y2hlcyB8fCB3aW5kb3cubWF0Y2hNZWRpYSgnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDEuMyknKS5tYXRjaGVzO1xuICAgICAgICAgICAgaWYgKCFyZXRpbmEpIHtcbiAgICAgICAgICAgICAgeFBvcyA9IE1hdGgucm91bmQoeFBvcyk7XG4gICAgICAgICAgICAgIHlQb3MgPSBNYXRoLnJvdW5kKHlQb3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldID0gJ3RyYW5zbGF0ZVgoJyArIHhQb3MgKyAncHgpIHRyYW5zbGF0ZVkoJyArIHlQb3MgKyAncHgpJztcblxuICAgICAgICAgIGlmICh0cmFuc2Zvcm1LZXkgIT09ICdtc1RyYW5zZm9ybScpIHtcbiAgICAgICAgICAgIC8vIFRoZSBaIHRyYW5zZm9ybSB3aWxsIGtlZXAgdGhpcyBpbiB0aGUgR1BVIChmYXN0ZXIsIGFuZCBwcmV2ZW50cyBhcnRpZmFjdHMpLFxuICAgICAgICAgICAgLy8gYnV0IElFOSBkb2Vzbid0IHN1cHBvcnQgM2QgdHJhbnNmb3JtcyBhbmQgd2lsbCBjaG9rZS5cbiAgICAgICAgICAgIGNzc1t0cmFuc2Zvcm1LZXldICs9IFwiIHRyYW5zbGF0ZVooMClcIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKF9zYW1lLnRvcCkge1xuICAgICAgICAgICAgY3NzLnRvcCA9IF9wb3MudG9wICsgJ3B4JztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3NzLmJvdHRvbSA9IF9wb3MuYm90dG9tICsgJ3B4JztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoX3NhbWUubGVmdCkge1xuICAgICAgICAgICAgY3NzLmxlZnQgPSBfcG9zLmxlZnQgKyAncHgnO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjc3MucmlnaHQgPSBfcG9zLnJpZ2h0ICsgJ3B4JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIHZhciBtb3ZlZCA9IGZhbHNlO1xuICAgICAgaWYgKChzYW1lLnBhZ2UudG9wIHx8IHNhbWUucGFnZS5ib3R0b20pICYmIChzYW1lLnBhZ2UubGVmdCB8fCBzYW1lLnBhZ2UucmlnaHQpKSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoc2FtZS5wYWdlLCBwb3MucGFnZSk7XG4gICAgICB9IGVsc2UgaWYgKChzYW1lLnZpZXdwb3J0LnRvcCB8fCBzYW1lLnZpZXdwb3J0LmJvdHRvbSkgJiYgKHNhbWUudmlld3BvcnQubGVmdCB8fCBzYW1lLnZpZXdwb3J0LnJpZ2h0KSkge1xuICAgICAgICBjc3MucG9zaXRpb24gPSAnZml4ZWQnO1xuICAgICAgICB0cmFuc2NyaWJlKHNhbWUudmlld3BvcnQsIHBvcy52aWV3cG9ydCk7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzYW1lLm9mZnNldCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2FtZS5vZmZzZXQudG9wICYmIHNhbWUub2Zmc2V0LmxlZnQpIHtcbiAgICAgICAgKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjc3MucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICAgIHZhciBvZmZzZXRQYXJlbnQgPSBfdGhpczguY2FjaGUoJ3RhcmdldC1vZmZzZXRwYXJlbnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0T2Zmc2V0UGFyZW50KF90aGlzOC50YXJnZXQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgaWYgKGdldE9mZnNldFBhcmVudChfdGhpczguZWxlbWVudCkgIT09IG9mZnNldFBhcmVudCkge1xuICAgICAgICAgICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICBfdGhpczguZWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgICAgb2Zmc2V0UGFyZW50LmFwcGVuZENoaWxkKF90aGlzOC5lbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRyYW5zY3JpYmUoc2FtZS5vZmZzZXQsIHBvcy5vZmZzZXQpO1xuICAgICAgICAgIG1vdmVkID0gdHJ1ZTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNzcy5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XG4gICAgICAgIHRyYW5zY3JpYmUoeyB0b3A6IHRydWUsIGxlZnQ6IHRydWUgfSwgcG9zLnBhZ2UpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIW1vdmVkKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLm9wdGlvbnMuYm9keUVsZW1lbnQuYXBwZW5kQ2hpbGQodGhpcy5lbGVtZW50KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgb2Zmc2V0UGFyZW50SXNCb2R5ID0gdHJ1ZTtcbiAgICAgICAgICB2YXIgY3VycmVudE5vZGUgPSB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZTtcbiAgICAgICAgICB3aGlsZSAoY3VycmVudE5vZGUgJiYgY3VycmVudE5vZGUubm9kZVR5cGUgPT09IDEgJiYgY3VycmVudE5vZGUudGFnTmFtZSAhPT0gJ0JPRFknKSB7XG4gICAgICAgICAgICBpZiAoZ2V0Q29tcHV0ZWRTdHlsZShjdXJyZW50Tm9kZSkucG9zaXRpb24gIT09ICdzdGF0aWMnKSB7XG4gICAgICAgICAgICAgIG9mZnNldFBhcmVudElzQm9keSA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY3VycmVudE5vZGUgPSBjdXJyZW50Tm9kZS5wYXJlbnROb2RlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghb2Zmc2V0UGFyZW50SXNCb2R5KSB7XG4gICAgICAgICAgICB0aGlzLmVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50Lm93bmVyRG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLmVsZW1lbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBbnkgY3NzIGNoYW5nZSB3aWxsIHRyaWdnZXIgYSByZXBhaW50LCBzbyBsZXQncyBhdm9pZCBvbmUgaWYgbm90aGluZyBjaGFuZ2VkXG4gICAgICB2YXIgd3JpdGVDU1MgPSB7fTtcbiAgICAgIHZhciB3cml0ZSA9IGZhbHNlO1xuICAgICAgZm9yICh2YXIga2V5IGluIGNzcykge1xuICAgICAgICB2YXIgdmFsID0gY3NzW2tleV07XG4gICAgICAgIHZhciBlbFZhbCA9IHRoaXMuZWxlbWVudC5zdHlsZVtrZXldO1xuXG4gICAgICAgIGlmIChlbFZhbCAhPT0gdmFsKSB7XG4gICAgICAgICAgd3JpdGUgPSB0cnVlO1xuICAgICAgICAgIHdyaXRlQ1NTW2tleV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHdyaXRlKSB7XG4gICAgICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBleHRlbmQoX3RoaXM4LmVsZW1lbnQuc3R5bGUsIHdyaXRlQ1NTKTtcbiAgICAgICAgICBfdGhpczgudHJpZ2dlcigncmVwb3NpdGlvbmVkJyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBUZXRoZXJDbGFzcztcbn0pKEV2ZW50ZWQpO1xuXG5UZXRoZXJDbGFzcy5tb2R1bGVzID0gW107XG5cblRldGhlckJhc2UucG9zaXRpb24gPSBwb3NpdGlvbjtcblxudmFyIFRldGhlciA9IGV4dGVuZChUZXRoZXJDbGFzcywgVGV0aGVyQmFzZSk7XG4vKiBnbG9iYWxzIFRldGhlckJhc2UgKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgX3NsaWNlZFRvQXJyYXkgPSAoZnVuY3Rpb24gKCkgeyBmdW5jdGlvbiBzbGljZUl0ZXJhdG9yKGFyciwgaSkgeyB2YXIgX2FyciA9IFtdOyB2YXIgX24gPSB0cnVlOyB2YXIgX2QgPSBmYWxzZTsgdmFyIF9lID0gdW5kZWZpbmVkOyB0cnkgeyBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7IF9hcnIucHVzaChfcy52YWx1ZSk7IGlmIChpICYmIF9hcnIubGVuZ3RoID09PSBpKSBicmVhazsgfSB9IGNhdGNoIChlcnIpIHsgX2QgPSB0cnVlOyBfZSA9IGVycjsgfSBmaW5hbGx5IHsgdHJ5IHsgaWYgKCFfbiAmJiBfaVsncmV0dXJuJ10pIF9pWydyZXR1cm4nXSgpOyB9IGZpbmFsbHkgeyBpZiAoX2QpIHRocm93IF9lOyB9IH0gcmV0dXJuIF9hcnI7IH0gcmV0dXJuIGZ1bmN0aW9uIChhcnIsIGkpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyByZXR1cm4gYXJyOyB9IGVsc2UgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkgeyByZXR1cm4gc2xpY2VJdGVyYXRvcihhcnIsIGkpOyB9IGVsc2UgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlJyk7IH0gfTsgfSkoKTtcblxudmFyIF9UZXRoZXJCYXNlJFV0aWxzID0gVGV0aGVyQmFzZS5VdGlscztcbnZhciBnZXRCb3VuZHMgPSBfVGV0aGVyQmFzZSRVdGlscy5nZXRCb3VuZHM7XG52YXIgZXh0ZW5kID0gX1RldGhlckJhc2UkVXRpbHMuZXh0ZW5kO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cbnZhciBCT1VORFNfRk9STUFUID0gWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXTtcblxuZnVuY3Rpb24gZ2V0Qm91bmRpbmdSZWN0KHRldGhlciwgdG8pIHtcbiAgaWYgKHRvID09PSAnc2Nyb2xsUGFyZW50Jykge1xuICAgIHRvID0gdGV0aGVyLnNjcm9sbFBhcmVudHNbMF07XG4gIH0gZWxzZSBpZiAodG8gPT09ICd3aW5kb3cnKSB7XG4gICAgdG8gPSBbcGFnZVhPZmZzZXQsIHBhZ2VZT2Zmc2V0LCBpbm5lcldpZHRoICsgcGFnZVhPZmZzZXQsIGlubmVySGVpZ2h0ICsgcGFnZVlPZmZzZXRdO1xuICB9XG5cbiAgaWYgKHRvID09PSBkb2N1bWVudCkge1xuICAgIHRvID0gdG8uZG9jdW1lbnRFbGVtZW50O1xuICB9XG5cbiAgaWYgKHR5cGVvZiB0by5ub2RlVHlwZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAoZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIG5vZGUgPSB0bztcbiAgICAgIHZhciBzaXplID0gZ2V0Qm91bmRzKHRvKTtcbiAgICAgIHZhciBwb3MgPSBzaXplO1xuICAgICAgdmFyIHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZSh0byk7XG5cbiAgICAgIHRvID0gW3Bvcy5sZWZ0LCBwb3MudG9wLCBzaXplLndpZHRoICsgcG9zLmxlZnQsIHNpemUuaGVpZ2h0ICsgcG9zLnRvcF07XG5cbiAgICAgIC8vIEFjY291bnQgYW55IHBhcmVudCBGcmFtZXMgc2Nyb2xsIG9mZnNldFxuICAgICAgaWYgKG5vZGUub3duZXJEb2N1bWVudCAhPT0gZG9jdW1lbnQpIHtcbiAgICAgICAgdmFyIHdpbiA9IG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0VmlldztcbiAgICAgICAgdG9bMF0gKz0gd2luLnBhZ2VYT2Zmc2V0O1xuICAgICAgICB0b1sxXSArPSB3aW4ucGFnZVlPZmZzZXQ7XG4gICAgICAgIHRvWzJdICs9IHdpbi5wYWdlWE9mZnNldDtcbiAgICAgICAgdG9bM10gKz0gd2luLnBhZ2VZT2Zmc2V0O1xuICAgICAgfVxuXG4gICAgICBCT1VORFNfRk9STUFULmZvckVhY2goZnVuY3Rpb24gKHNpZGUsIGkpIHtcbiAgICAgICAgc2lkZSA9IHNpZGVbMF0udG9VcHBlckNhc2UoKSArIHNpZGUuc3Vic3RyKDEpO1xuICAgICAgICBpZiAoc2lkZSA9PT0gJ1RvcCcgfHwgc2lkZSA9PT0gJ0xlZnQnKSB7XG4gICAgICAgICAgdG9baV0gKz0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdG9baV0gLT0gcGFyc2VGbG9hdChzdHlsZVsnYm9yZGVyJyArIHNpZGUgKyAnV2lkdGgnXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pKCk7XG4gIH1cblxuICByZXR1cm4gdG87XG59XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuICAgIHZhciB0YXJnZXRBdHRhY2htZW50ID0gX3JlZi50YXJnZXRBdHRhY2htZW50O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuY29uc3RyYWludHMpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHZhciBfY2FjaGUgPSB0aGlzLmNhY2hlKCdlbGVtZW50LWJvdW5kcycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBnZXRCb3VuZHMoX3RoaXMuZWxlbWVudCk7XG4gICAgfSk7XG5cbiAgICB2YXIgaGVpZ2h0ID0gX2NhY2hlLmhlaWdodDtcbiAgICB2YXIgd2lkdGggPSBfY2FjaGUud2lkdGg7XG5cbiAgICBpZiAod2lkdGggPT09IDAgJiYgaGVpZ2h0ID09PSAwICYmIHR5cGVvZiB0aGlzLmxhc3RTaXplICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgdmFyIF9sYXN0U2l6ZSA9IHRoaXMubGFzdFNpemU7XG5cbiAgICAgIC8vIEhhbmRsZSB0aGUgaXRlbSBnZXR0aW5nIGhpZGRlbiBhcyBhIHJlc3VsdCBvZiBvdXIgcG9zaXRpb25pbmcgd2l0aG91dCBnbGl0Y2hpbmdcbiAgICAgIC8vIHRoZSBjbGFzc2VzIGluIGFuZCBvdXRcbiAgICAgIHdpZHRoID0gX2xhc3RTaXplLndpZHRoO1xuICAgICAgaGVpZ2h0ID0gX2xhc3RTaXplLmhlaWdodDtcbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0U2l6ZSA9IHRoaXMuY2FjaGUoJ3RhcmdldC1ib3VuZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gX3RoaXMuZ2V0VGFyZ2V0Qm91bmRzKCk7XG4gICAgfSk7XG5cbiAgICB2YXIgdGFyZ2V0SGVpZ2h0ID0gdGFyZ2V0U2l6ZS5oZWlnaHQ7XG4gICAgdmFyIHRhcmdldFdpZHRoID0gdGFyZ2V0U2l6ZS53aWR0aDtcblxuICAgIHZhciBhbGxDbGFzc2VzID0gW3RoaXMuZ2V0Q2xhc3MoJ3Bpbm5lZCcpLCB0aGlzLmdldENsYXNzKCdvdXQtb2YtYm91bmRzJyldO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciBvdXRPZkJvdW5kc0NsYXNzID0gY29uc3RyYWludC5vdXRPZkJvdW5kc0NsYXNzO1xuICAgICAgdmFyIHBpbm5lZENsYXNzID0gY29uc3RyYWludC5waW5uZWRDbGFzcztcblxuICAgICAgaWYgKG91dE9mQm91bmRzQ2xhc3MpIHtcbiAgICAgICAgYWxsQ2xhc3Nlcy5wdXNoKG91dE9mQm91bmRzQ2xhc3MpO1xuICAgICAgfVxuICAgICAgaWYgKHBpbm5lZENsYXNzKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChwaW5uZWRDbGFzcyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBhbGxDbGFzc2VzLmZvckVhY2goZnVuY3Rpb24gKGNscykge1xuICAgICAgWydsZWZ0JywgJ3RvcCcsICdyaWdodCcsICdib3R0b20nXS5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgIGFsbENsYXNzZXMucHVzaChjbHMgKyAnLScgKyBzaWRlKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciB0QXR0YWNobWVudCA9IGV4dGVuZCh7fSwgdGFyZ2V0QXR0YWNobWVudCk7XG4gICAgdmFyIGVBdHRhY2htZW50ID0gZXh0ZW5kKHt9LCB0aGlzLmF0dGFjaG1lbnQpO1xuXG4gICAgdGhpcy5vcHRpb25zLmNvbnN0cmFpbnRzLmZvckVhY2goZnVuY3Rpb24gKGNvbnN0cmFpbnQpIHtcbiAgICAgIHZhciB0byA9IGNvbnN0cmFpbnQudG87XG4gICAgICB2YXIgYXR0YWNobWVudCA9IGNvbnN0cmFpbnQuYXR0YWNobWVudDtcbiAgICAgIHZhciBwaW4gPSBjb25zdHJhaW50LnBpbjtcblxuICAgICAgaWYgKHR5cGVvZiBhdHRhY2htZW50ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBhdHRhY2htZW50ID0gJyc7XG4gICAgICB9XG5cbiAgICAgIHZhciBjaGFuZ2VBdHRhY2hYID0gdW5kZWZpbmVkLFxuICAgICAgICAgIGNoYW5nZUF0dGFjaFkgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoYXR0YWNobWVudC5pbmRleE9mKCcgJykgPj0gMCkge1xuICAgICAgICB2YXIgX2F0dGFjaG1lbnQkc3BsaXQgPSBhdHRhY2htZW50LnNwbGl0KCcgJyk7XG5cbiAgICAgICAgdmFyIF9hdHRhY2htZW50JHNwbGl0MiA9IF9zbGljZWRUb0FycmF5KF9hdHRhY2htZW50JHNwbGl0LCAyKTtcblxuICAgICAgICBjaGFuZ2VBdHRhY2hZID0gX2F0dGFjaG1lbnQkc3BsaXQyWzBdO1xuICAgICAgICBjaGFuZ2VBdHRhY2hYID0gX2F0dGFjaG1lbnQkc3BsaXQyWzFdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2hhbmdlQXR0YWNoWCA9IGNoYW5nZUF0dGFjaFkgPSBhdHRhY2htZW50O1xuICAgICAgfVxuXG4gICAgICB2YXIgYm91bmRzID0gZ2V0Qm91bmRpbmdSZWN0KF90aGlzLCB0byk7XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hZID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiB0QXR0YWNobWVudC50b3AgPT09ICd0b3AnKSB7XG4gICAgICAgICAgdG9wICs9IHRhcmdldEhlaWdodDtcbiAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdEF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJykge1xuICAgICAgICAgIHRvcCAtPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICd0b2dldGhlcicpIHtcbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAnYm90dG9tJyAmJiB0b3AgPCBib3VuZHNbMV0pIHtcbiAgICAgICAgICAgIHRvcCArPSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcblxuICAgICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICd0b3AnO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZUF0dGFjaG1lbnQudG9wID09PSAndG9wJyAmJiB0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgdG9wIC0gKGhlaWdodCAtIHRhcmdldEhlaWdodCkgPj0gYm91bmRzWzFdKSB7XG4gICAgICAgICAgICB0b3AgLT0gaGVpZ2h0IC0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG5cbiAgICAgICAgICAgIGVBdHRhY2htZW50LnRvcCA9ICdib3R0b20nO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0QXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcgJiYgdG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgICAgICB0b3AgLT0gdGFyZ2V0SGVpZ2h0O1xuICAgICAgICAgICAgdEF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG5cbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LnRvcCA9PT0gJ2JvdHRvbScgJiYgdG9wIDwgYm91bmRzWzFdICYmIHRvcCArIChoZWlnaHQgKiAyIC0gdGFyZ2V0SGVpZ2h0KSA8PSBib3VuZHNbM10pIHtcbiAgICAgICAgICAgIHRvcCArPSBoZWlnaHQgLSB0YXJnZXRIZWlnaHQ7XG4gICAgICAgICAgICB0QXR0YWNobWVudC50b3AgPSAndG9wJztcblxuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRBdHRhY2htZW50LnRvcCA9PT0gJ21pZGRsZScpIHtcbiAgICAgICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdICYmIGVBdHRhY2htZW50LnRvcCA9PT0gJ3RvcCcpIHtcbiAgICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAnYm90dG9tJztcbiAgICAgICAgICB9IGVsc2UgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgICB0b3AgKz0gaGVpZ2h0O1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ3RvcCc7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChjaGFuZ2VBdHRhY2hYID09PSAndGFyZ2V0JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0gJiYgdEF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgdEF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoY2hhbmdlQXR0YWNoWCA9PT0gJ3RvZ2V0aGVyJykge1xuICAgICAgICBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuXG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGxlZnQgKyB3aWR0aCA+IGJvdW5kc1syXSAmJiB0QXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB0YXJnZXRXaWR0aDtcbiAgICAgICAgICAgIHRBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG5cbiAgICAgICAgICAgIGxlZnQgLT0gd2lkdGg7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9IGVsc2UgaWYgKGVBdHRhY2htZW50LmxlZnQgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIGxlZnQgLT0gdGFyZ2V0V2lkdGg7XG4gICAgICAgICAgICB0QXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuXG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodEF0dGFjaG1lbnQubGVmdCA9PT0gJ2NlbnRlcicpIHtcbiAgICAgICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdICYmIGVBdHRhY2htZW50LmxlZnQgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAncmlnaHQnO1xuICAgICAgICAgIH0gZWxzZSBpZiAobGVmdCA8IGJvdW5kc1swXSAmJiBlQXR0YWNobWVudC5sZWZ0ID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICBsZWZ0ICs9IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdsZWZ0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFkgPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hZID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSAmJiBlQXR0YWNobWVudC50b3AgPT09ICdib3R0b20nKSB7XG4gICAgICAgICAgdG9wICs9IGhlaWdodDtcbiAgICAgICAgICBlQXR0YWNobWVudC50b3AgPSAndG9wJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0b3AgKyBoZWlnaHQgPiBib3VuZHNbM10gJiYgZUF0dGFjaG1lbnQudG9wID09PSAndG9wJykge1xuICAgICAgICAgIHRvcCAtPSBoZWlnaHQ7XG4gICAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGNoYW5nZUF0dGFjaFggPT09ICdlbGVtZW50JyB8fCBjaGFuZ2VBdHRhY2hYID09PSAnYm90aCcpIHtcbiAgICAgICAgaWYgKGxlZnQgPCBib3VuZHNbMF0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ3JpZ2h0Jykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aDtcbiAgICAgICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSAnbGVmdCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCArPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ2xlZnQnO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChsZWZ0ICsgd2lkdGggPiBib3VuZHNbMl0pIHtcbiAgICAgICAgICBpZiAoZUF0dGFjaG1lbnQubGVmdCA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICBsZWZ0IC09IHdpZHRoO1xuICAgICAgICAgICAgZUF0dGFjaG1lbnQubGVmdCA9ICdyaWdodCc7XG4gICAgICAgICAgfSBlbHNlIGlmIChlQXR0YWNobWVudC5sZWZ0ID09PSAnY2VudGVyJykge1xuICAgICAgICAgICAgbGVmdCAtPSB3aWR0aCAvIDI7XG4gICAgICAgICAgICBlQXR0YWNobWVudC5sZWZ0ID0gJ3JpZ2h0JztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiBwaW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBpbiA9IHBpbi5zcGxpdCgnLCcpLm1hcChmdW5jdGlvbiAocCkge1xuICAgICAgICAgIHJldHVybiBwLnRyaW0oKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2UgaWYgKHBpbiA9PT0gdHJ1ZSkge1xuICAgICAgICBwaW4gPSBbJ3RvcCcsICdsZWZ0JywgJ3JpZ2h0JywgJ2JvdHRvbSddO1xuICAgICAgfVxuXG4gICAgICBwaW4gPSBwaW4gfHwgW107XG5cbiAgICAgIHZhciBwaW5uZWQgPSBbXTtcbiAgICAgIHZhciBvb2IgPSBbXTtcblxuICAgICAgaWYgKHRvcCA8IGJvdW5kc1sxXSkge1xuICAgICAgICBpZiAocGluLmluZGV4T2YoJ3RvcCcpID49IDApIHtcbiAgICAgICAgICB0b3AgPSBib3VuZHNbMV07XG4gICAgICAgICAgcGlubmVkLnB1c2goJ3RvcCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCd0b3AnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAodG9wICsgaGVpZ2h0ID4gYm91bmRzWzNdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignYm90dG9tJykgPj0gMCkge1xuICAgICAgICAgIHRvcCA9IGJvdW5kc1szXSAtIGhlaWdodDtcbiAgICAgICAgICBwaW5uZWQucHVzaCgnYm90dG9tJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2JvdHRvbScpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChsZWZ0IDwgYm91bmRzWzBdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZignbGVmdCcpID49IDApIHtcbiAgICAgICAgICBsZWZ0ID0gYm91bmRzWzBdO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdsZWZ0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb29iLnB1c2goJ2xlZnQnKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAobGVmdCArIHdpZHRoID4gYm91bmRzWzJdKSB7XG4gICAgICAgIGlmIChwaW4uaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgICAgbGVmdCA9IGJvdW5kc1syXSAtIHdpZHRoO1xuICAgICAgICAgIHBpbm5lZC5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG9vYi5wdXNoKCdyaWdodCcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChwaW5uZWQubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIHBpbm5lZENsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBpbm5lZENsYXNzID0gX3RoaXMub3B0aW9ucy5waW5uZWRDbGFzcztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGlubmVkQ2xhc3MgPSBfdGhpcy5nZXRDbGFzcygncGlubmVkJyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzKTtcbiAgICAgICAgICBwaW5uZWQuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHBpbm5lZENsYXNzICsgJy0nICsgc2lkZSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvb2IubGVuZ3RoKSB7XG4gICAgICAgIChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgdmFyIG9vYkNsYXNzID0gdW5kZWZpbmVkO1xuICAgICAgICAgIGlmICh0eXBlb2YgX3RoaXMub3B0aW9ucy5vdXRPZkJvdW5kc0NsYXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgb29iQ2xhc3MgPSBfdGhpcy5vcHRpb25zLm91dE9mQm91bmRzQ2xhc3M7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG9vYkNsYXNzID0gX3RoaXMuZ2V0Q2xhc3MoJ291dC1vZi1ib3VuZHMnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MpO1xuICAgICAgICAgIG9vYi5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICAgICAgICBhZGRDbGFzc2VzLnB1c2gob29iQ2xhc3MgKyAnLScgKyBzaWRlKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSkoKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBpbm5lZC5pbmRleE9mKCdsZWZ0JykgPj0gMCB8fCBwaW5uZWQuaW5kZXhPZigncmlnaHQnKSA+PSAwKSB7XG4gICAgICAgIGVBdHRhY2htZW50LmxlZnQgPSB0QXR0YWNobWVudC5sZWZ0ID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAocGlubmVkLmluZGV4T2YoJ3RvcCcpID49IDAgfHwgcGlubmVkLmluZGV4T2YoJ2JvdHRvbScpID49IDApIHtcbiAgICAgICAgZUF0dGFjaG1lbnQudG9wID0gdEF0dGFjaG1lbnQudG9wID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmICh0QXR0YWNobWVudC50b3AgIT09IHRhcmdldEF0dGFjaG1lbnQudG9wIHx8IHRBdHRhY2htZW50LmxlZnQgIT09IHRhcmdldEF0dGFjaG1lbnQubGVmdCB8fCBlQXR0YWNobWVudC50b3AgIT09IF90aGlzLmF0dGFjaG1lbnQudG9wIHx8IGVBdHRhY2htZW50LmxlZnQgIT09IF90aGlzLmF0dGFjaG1lbnQubGVmdCkge1xuICAgICAgICBfdGhpcy51cGRhdGVBdHRhY2hDbGFzc2VzKGVBdHRhY2htZW50LCB0QXR0YWNobWVudCk7XG4gICAgICAgIF90aGlzLnRyaWdnZXIoJ3VwZGF0ZScsIHtcbiAgICAgICAgICBhdHRhY2htZW50OiBlQXR0YWNobWVudCxcbiAgICAgICAgICB0YXJnZXRBdHRhY2htZW50OiB0QXR0YWNobWVudFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGRlZmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghKF90aGlzLm9wdGlvbnMuYWRkVGFyZ2V0Q2xhc3NlcyA9PT0gZmFsc2UpKSB7XG4gICAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMudGFyZ2V0LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICAgIH1cbiAgICAgIHVwZGF0ZUNsYXNzZXMoX3RoaXMuZWxlbWVudCwgYWRkQ2xhc3NlcywgYWxsQ2xhc3Nlcyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4geyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9O1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfVGV0aGVyQmFzZSRVdGlscyA9IFRldGhlckJhc2UuVXRpbHM7XG52YXIgZ2V0Qm91bmRzID0gX1RldGhlckJhc2UkVXRpbHMuZ2V0Qm91bmRzO1xudmFyIHVwZGF0ZUNsYXNzZXMgPSBfVGV0aGVyQmFzZSRVdGlscy51cGRhdGVDbGFzc2VzO1xudmFyIGRlZmVyID0gX1RldGhlckJhc2UkVXRpbHMuZGVmZXI7XG5cblRldGhlckJhc2UubW9kdWxlcy5wdXNoKHtcbiAgcG9zaXRpb246IGZ1bmN0aW9uIHBvc2l0aW9uKF9yZWYpIHtcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xuXG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgdmFyIF9jYWNoZSA9IHRoaXMuY2FjaGUoJ2VsZW1lbnQtYm91bmRzJywgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGdldEJvdW5kcyhfdGhpcy5lbGVtZW50KTtcbiAgICB9KTtcblxuICAgIHZhciBoZWlnaHQgPSBfY2FjaGUuaGVpZ2h0O1xuICAgIHZhciB3aWR0aCA9IF9jYWNoZS53aWR0aDtcblxuICAgIHZhciB0YXJnZXRQb3MgPSB0aGlzLmdldFRhcmdldEJvdW5kcygpO1xuXG4gICAgdmFyIGJvdHRvbSA9IHRvcCArIGhlaWdodDtcbiAgICB2YXIgcmlnaHQgPSBsZWZ0ICsgd2lkdGg7XG5cbiAgICB2YXIgYWJ1dHRlZCA9IFtdO1xuICAgIGlmICh0b3AgPD0gdGFyZ2V0UG9zLmJvdHRvbSAmJiBib3R0b20gPj0gdGFyZ2V0UG9zLnRvcCkge1xuICAgICAgWydsZWZ0JywgJ3JpZ2h0J10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IGxlZnQgfHwgdGFyZ2V0UG9zU2lkZSA9PT0gcmlnaHQpIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmIChsZWZ0IDw9IHRhcmdldFBvcy5yaWdodCAmJiByaWdodCA+PSB0YXJnZXRQb3MubGVmdCkge1xuICAgICAgWyd0b3AnLCAnYm90dG9tJ10uZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgICB2YXIgdGFyZ2V0UG9zU2lkZSA9IHRhcmdldFBvc1tzaWRlXTtcbiAgICAgICAgaWYgKHRhcmdldFBvc1NpZGUgPT09IHRvcCB8fCB0YXJnZXRQb3NTaWRlID09PSBib3R0b20pIHtcbiAgICAgICAgICBhYnV0dGVkLnB1c2goc2lkZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBhbGxDbGFzc2VzID0gW107XG4gICAgdmFyIGFkZENsYXNzZXMgPSBbXTtcblxuICAgIHZhciBzaWRlcyA9IFsnbGVmdCcsICd0b3AnLCAncmlnaHQnLCAnYm90dG9tJ107XG4gICAgYWxsQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgc2lkZXMuZm9yRWFjaChmdW5jdGlvbiAoc2lkZSkge1xuICAgICAgYWxsQ2xhc3Nlcy5wdXNoKF90aGlzLmdldENsYXNzKCdhYnV0dGVkJykgKyAnLScgKyBzaWRlKTtcbiAgICB9KTtcblxuICAgIGlmIChhYnV0dGVkLmxlbmd0aCkge1xuICAgICAgYWRkQ2xhc3Nlcy5wdXNoKHRoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSk7XG4gICAgfVxuXG4gICAgYWJ1dHRlZC5mb3JFYWNoKGZ1bmN0aW9uIChzaWRlKSB7XG4gICAgICBhZGRDbGFzc2VzLnB1c2goX3RoaXMuZ2V0Q2xhc3MoJ2FidXR0ZWQnKSArICctJyArIHNpZGUpO1xuICAgIH0pO1xuXG4gICAgZGVmZXIoZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEoX3RoaXMub3B0aW9ucy5hZGRUYXJnZXRDbGFzc2VzID09PSBmYWxzZSkpIHtcbiAgICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy50YXJnZXQsIGFkZENsYXNzZXMsIGFsbENsYXNzZXMpO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ2xhc3NlcyhfdGhpcy5lbGVtZW50LCBhZGRDbGFzc2VzLCBhbGxDbGFzc2VzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0cnVlO1xuICB9XG59KTtcbi8qIGdsb2JhbHMgVGV0aGVyQmFzZSAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBfc2xpY2VkVG9BcnJheSA9IChmdW5jdGlvbiAoKSB7IGZ1bmN0aW9uIHNsaWNlSXRlcmF0b3IoYXJyLCBpKSB7IHZhciBfYXJyID0gW107IHZhciBfbiA9IHRydWU7IHZhciBfZCA9IGZhbHNlOyB2YXIgX2UgPSB1bmRlZmluZWQ7IHRyeSB7IGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHsgX2Fyci5wdXNoKF9zLnZhbHVlKTsgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrOyB9IH0gY2F0Y2ggKGVycikgeyBfZCA9IHRydWU7IF9lID0gZXJyOyB9IGZpbmFsbHkgeyB0cnkgeyBpZiAoIV9uICYmIF9pWydyZXR1cm4nXSkgX2lbJ3JldHVybiddKCk7IH0gZmluYWxseSB7IGlmIChfZCkgdGhyb3cgX2U7IH0gfSByZXR1cm4gX2FycjsgfSByZXR1cm4gZnVuY3Rpb24gKGFyciwgaSkgeyBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7IHJldHVybiBhcnI7IH0gZWxzZSBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChhcnIpKSB7IHJldHVybiBzbGljZUl0ZXJhdG9yKGFyciwgaSk7IH0gZWxzZSB7IHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UnKTsgfSB9OyB9KSgpO1xuXG5UZXRoZXJCYXNlLm1vZHVsZXMucHVzaCh7XG4gIHBvc2l0aW9uOiBmdW5jdGlvbiBwb3NpdGlvbihfcmVmKSB7XG4gICAgdmFyIHRvcCA9IF9yZWYudG9wO1xuICAgIHZhciBsZWZ0ID0gX3JlZi5sZWZ0O1xuXG4gICAgaWYgKCF0aGlzLm9wdGlvbnMuc2hpZnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnQgPSB0aGlzLm9wdGlvbnMuc2hpZnQ7XG4gICAgaWYgKHR5cGVvZiB0aGlzLm9wdGlvbnMuc2hpZnQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHNoaWZ0ID0gdGhpcy5vcHRpb25zLnNoaWZ0LmNhbGwodGhpcywgeyB0b3A6IHRvcCwgbGVmdDogbGVmdCB9KTtcbiAgICB9XG5cbiAgICB2YXIgc2hpZnRUb3AgPSB1bmRlZmluZWQsXG4gICAgICAgIHNoaWZ0TGVmdCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHNoaWZ0ID09PSAnc3RyaW5nJykge1xuICAgICAgc2hpZnQgPSBzaGlmdC5zcGxpdCgnICcpO1xuICAgICAgc2hpZnRbMV0gPSBzaGlmdFsxXSB8fCBzaGlmdFswXTtcblxuICAgICAgdmFyIF9zaGlmdCA9IHNoaWZ0O1xuXG4gICAgICB2YXIgX3NoaWZ0MiA9IF9zbGljZWRUb0FycmF5KF9zaGlmdCwgMik7XG5cbiAgICAgIHNoaWZ0VG9wID0gX3NoaWZ0MlswXTtcbiAgICAgIHNoaWZ0TGVmdCA9IF9zaGlmdDJbMV07XG5cbiAgICAgIHNoaWZ0VG9wID0gcGFyc2VGbG9hdChzaGlmdFRvcCwgMTApO1xuICAgICAgc2hpZnRMZWZ0ID0gcGFyc2VGbG9hdChzaGlmdExlZnQsIDEwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2hpZnRUb3AgPSBzaGlmdC50b3A7XG4gICAgICBzaGlmdExlZnQgPSBzaGlmdC5sZWZ0O1xuICAgIH1cblxuICAgIHRvcCArPSBzaGlmdFRvcDtcbiAgICBsZWZ0ICs9IHNoaWZ0TGVmdDtcblxuICAgIHJldHVybiB7IHRvcDogdG9wLCBsZWZ0OiBsZWZ0IH07XG4gIH1cbn0pO1xucmV0dXJuIFRldGhlcjtcblxufSkpO1xuIl19
