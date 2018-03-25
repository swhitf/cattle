"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var GridEvent_1 = require("../../core/events/GridEvent");
var Extensibility_1 = require("../../core/Extensibility");
var u = require("../../misc/Util");
var Vectors_1 = require("../../misc/Vectors");
var GridRef_1 = require("../../model/GridRef");
var GridWalk_1 = require("../../model/GridWalk");
var KeyBehavior_1 = require("../../vom/input/KeyBehavior");
var MouseBehavior_1 = require("../../vom/input/MouseBehavior");
var SelectMode;
(function (SelectMode) {
    SelectMode["Default"] = "default";
    SelectMode["Extend"] = "extend";
    SelectMode["Append"] = "append";
})(SelectMode = exports.SelectMode || (exports.SelectMode = {}));
var SelectorExtension = /** @class */ (function () {
    function SelectorExtension() {
        this.canSelect = true;
        this.selections = [];
    }
    SelectorExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.kernel = kernel;
        /*
        KeyInput.for(grid)
            .on('!TAB', () => this.selectNeighbor(Vectors.e))
            .on('!SHIFT+TAB', () => this.selectNeighbor(Vectors.w))
            .on('!CTRL+RIGHT_ARROW', () => this.selectEdge(Vectors.e))
            .on('!CTRL+LEFT_ARROW', () => this.selectEdge(Vectors.w))
            .on('!CTRL+UP_ARROW', () => this.selectEdge(Vectors.n))
            .on('!CTRL+DOWN_ARROW', () => this.selectEdge(Vectors.s))
            .on('!CTRL+A', () => this.selectAll())
            .on('!HOME', () => this.selectBorder(Vectors.w))
            .on('!CTRL+HOME', () => this.selectBorder(Vectors.nw))
            .on('!END', () => this.selectBorder(Vectors.e))
            .on('!CTRL+END', () => this.selectBorder(Vectors.se))
        ;

        MouseInput.for(grid)
            .on('DOWN:SHIFT+PRIMARY', (e:GridMouseEvent) => this.selectLine(new Point(e.gridX, e.gridY)))
            .on('DOWN:PRIMARY', (e:GridMouseEvent) => this.beginSelectGesture(e.gridX, e.gridY))
            .on('DRAG:PRIMARY', (e:GridMouseDragEvent) => this.updateSelectGesture(e.gridX, e.gridY))
            .on('UP:PRIMARY', (e:GridMouseDragEvent) => this.endSelectGesture(e.gridX, e.gridY))
        ;
        */
        //event.target to cell ref
        var ref = function (e) {
            var cell = grid.layout.pickCell(e.surfacePoint);
            return !!cell ? cell.ref : null;
        };
        MouseBehavior_1.MouseBehavior.for(grid.surface)
            .on(['LEFT.DOWN/e'], function (e) { return _this.select(ref(e)); })
            .on(['LEFT.DOWN+CTRL/e'], function (e) { return _this.select(ref(e), SelectMode.Append); })
            .on(['LEFT.DRAG', 'LEFT.DOWN+SHIFT'], function (e) { return _this.select(ref(e), SelectMode.Extend); });
        KeyBehavior_1.KeyBehavior.for(grid.surface)
            .on('TAB/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.e); })
            .on('SHIFT+TAB/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.w); })
            .on('RIGHT_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.e); })
            .on('LEFT_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.w); })
            .on('UP_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.n); })
            .on('DOWN_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.s); })
            .on('SHIFT+RIGHT_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.e, SelectMode.Extend); })
            .on('SHIFT+LEFT_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.w, SelectMode.Extend); })
            .on('SHIFT+UP_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.n, SelectMode.Extend); })
            .on('SHIFT+DOWN_ARROW/e', function () { return _this.selectNext('cell', Vectors_1.Vectors.s, SelectMode.Extend); })
            .on('HOME/e', function () { return _this.selectNext('edge', Vectors_1.Vectors.w); })
            .on('END/e', function () { return _this.selectNext('edge', Vectors_1.Vectors.e); })
            .on('CTRL+HOME/e', function () { return _this.selectNext('edge', Vectors_1.Vectors.nw); })
            .on('CTRL+END/e', function () { return _this.selectNext('edge', Vectors_1.Vectors.se); })
            .on('CTRL+A/e', function () { return _this.selectAll(); });
        //On select visualize selection
        grid.on('select', function () { return _this.doVisualizeSelection(); });
        kernel.variables.define('primarySelection', { get: function () { return _this.primarySelection; } });
    };
    Object.defineProperty(SelectorExtension.prototype, "nets", {
        get: function () {
            return this.kernel.variables.get('nets');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SelectorExtension.prototype, "primarySelection", {
        get: function () {
            return u.last(this.selections) || null;
        },
        enumerable: true,
        configurable: true
    });
    SelectorExtension.prototype.select = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.doSelect.apply(this, args);
    };
    // @command()
    // private selectBorder(vector:Point, autoScroll = true):void
    // {
    //     let { grid } = this;
    //     let ref = this.selection[0] || null;
    //     if (ref)
    //     {
    //         vector = vector.normalize();
    //         let startCell = grid.model.findCell(ref);
    //         let xy = { x: startCell.colRef, y: startCell.rowRef } as PointLike;
    //         if (vector.x < 0)
    //         {
    //             xy.x = 0;
    //         }
    //         if (vector.x > 0)
    //         {
    //             xy.x = grid.modelWidth - 1;
    //         }
    //         if (vector.y < 0)
    //         {
    //             xy.y = 0;
    //         }
    //         if (vector.y > 0)
    //         {
    //             xy.y = grid.modelHeight - 1;
    //         }
    //         let resultCell = grid.model.locateCell(xy.x, xy.y);
    //         if (resultCell)
    //         {
    //             this.select([resultCell.ref], autoScroll);
    //         }
    //     }
    // }
    // @command()
    // private selectEdge(vector:Point, autoScroll = true):void
    // {
    //     let { grid } = this;
    //     vector = vector.normalize();
    //     let empty = (cell:GridCell) => <any>(cell.value === ''  || cell.value === '0' || cell.value === undefined || cell.value === null);
    //     let ref = this.selection[0] || null;
    //     if (ref)
    //     {
    //         let startCell = grid.model.findCell(ref);
    //         let currCell = grid.model.findCellNeighbor(startCell.ref, vector);
    //         let resultCell = <GridCell>null;
    //         if (!currCell)
    //             return;
    //         while (true)
    //         {
    //             let a = currCell;
    //             let b = grid.model.findCellNeighbor(a.ref, vector);
    //             if (!a || !b)
    //             {
    //                 resultCell = !!a ? a : null;
    //                 break;
    //             }
    //             if (empty(a) + empty(b) == 1)
    //             {
    //                 resultCell = empty(a) ? b : a;
    //                 break;
    //             }
    //             currCell = b;
    //         }
    //         if (resultCell)
    //         {
    //             this.select([resultCell.ref], autoScroll);
    //         }
    //     }
    // }
    // @command()
    // private selectLine(gridPt:Point, autoScroll = true):void
    // {
    //     let { grid } = this;
    //     let ref = this.selection[0] || null;
    //     if (!ref)
    //         return;
    //     let startPt = grid.getCellGridRect(ref).topLeft();
    //     let lineRect = Rect.fromPoints(startPt, gridPt);
    //     let cellRefs = grid.getCellsInGridRect(lineRect).map(x => x.ref);
    //     cellRefs.splice(cellRefs.indexOf(ref), 1);
    //     cellRefs.splice(0, 0, ref);
    //     this.select(cellRefs, autoScroll);
    // }
    SelectorExtension.prototype.selectNext = function (type, vector, mode) {
        var _a = this, grid = _a.grid, primarySelection = _a.primarySelection;
        if (primarySelection) {
            var source = mode == SelectMode.Extend ? primarySelection.to : primarySelection.from;
            var nextCell = this.resolveTarget(source, type, vector);
            if (nextCell) {
                this.doSelect(nextCell.ref, mode);
            }
        }
    };
    SelectorExtension.prototype.selectAll = function () {
        var grid = this.grid;
        var from = 'A1';
        var to = GridRef_1.GridRef.make(grid.model.width - 1, grid.model.height - 1);
        this.select(from, to);
    };
    SelectorExtension.prototype.doSelect = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        args = args.filter(function (x) { return !!x; });
        if (!this.canSelect)
            return;
        var from = args[0];
        var to = GridRef_1.GridRef.valid(args[1]) ? args[1] : from;
        var mode = !GridRef_1.GridRef.valid(u.last(args)) ? u.last(args) : SelectMode.Default;
        var _a = this, grid = _a.grid, selections = _a.selections;
        var model = grid.model;
        var valid = !!model.findCell(from) && !!model.findCell(to);
        if (mode == SelectMode.Default) {
            if (valid) {
                selections.splice(0, selections.length, new SelectionImpl(from, to));
            }
            else {
                selections.splice(0, selections.length);
            }
        }
        else if (mode == SelectMode.Append) {
            if (valid) {
                selections.push(new SelectionImpl(from, to));
            }
        }
        else if (mode == SelectMode.Extend) {
            if (!!selections.length && valid) {
                var primary = u.last(selections);
                selections[selections.length - 1] = new SelectionImpl(primary.from, from);
            }
        }
        grid.emit(new GridEvent_1.GridEvent('select', grid));
    };
    SelectorExtension.prototype.doVisualizeSelection = function () {
        var _a = this, primarySelection = _a.primarySelection, selections = _a.selections, nets = _a.nets;
        var selectionMap = u.index(selections, function (x) { return x.id; });
        var netMap = u.index(nets.toArray(function (x) { return x.type == 'selection'; }), function (x) { return x.id; });
        //For any selections that do not have nets, create nets
        for (var id in selectionMap) {
            var s = selectionMap[id];
            //If primary selection and only one cell, don't show a selection net
            if (s == primarySelection && s.from == s.to)
                continue;
            if (!netMap[id]) {
                netMap[id] = nets.create(id, 'selection', s.from, s.to);
            }
        }
        //For any nets that do not have selections, destroy nets
        for (var id in netMap) {
            var n = netMap[id];
            if (!selectionMap[id]) {
                nets.destroy(id);
                delete netMap[id];
            }
        }
        //If we have selections, show the primary net on the primary selection from cell
        if (primarySelection) {
            var inputNet = nets.get('input');
            if (inputNet) {
                inputNet.move(primarySelection.from);
            }
            else {
                inputNet = nets.create('input', 'input', primarySelection.from);
            }
        }
        else {
            nets.destroy('input');
        }
    };
    SelectorExtension.prototype.resolveTarget = function (fromRef, target, vector) {
        var model = this.grid.model;
        if (target == 'cell') {
            return GridWalk_1.GridWalk.until(model, fromRef, vector, function (cell) { return cell.ref != fromRef; });
        }
        else if (target == 'edge') {
            return GridWalk_1.GridWalk.toEdge(model, fromRef, vector);
        }
        else if (target == 'dataPoint') {
            return GridWalk_1.GridWalk.toEdge(model, fromRef, vector);
        }
        throw 'What is this type: ' + target;
    };
    __decorate([
        Extensibility_1.Variable(false),
        __metadata("design:type", Boolean)
    ], SelectorExtension.prototype, "canSelect", void 0);
    __decorate([
        Extensibility_1.Variable(false),
        __metadata("design:type", Array)
    ], SelectorExtension.prototype, "selections", void 0);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], SelectorExtension.prototype, "select", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Object, String]),
        __metadata("design:returntype", void 0)
    ], SelectorExtension.prototype, "selectNext", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], SelectorExtension.prototype, "selectAll", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], SelectorExtension.prototype, "doSelect", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], SelectorExtension.prototype, "doVisualizeSelection", null);
    return SelectorExtension;
}());
exports.SelectorExtension = SelectorExtension;
var SelectionImpl = /** @class */ (function () {
    function SelectionImpl(from, to) {
        this.from = from;
        this.to = to;
        this.id = "S" + ++SelectionImpl.tracker;
    }
    SelectionImpl.prototype.toString = function () {
        if (this.from === this.to) {
            return this.from;
        }
        else {
            return this.from + ":" + this.to;
        }
    };
    SelectionImpl.tracker = 0;
    return SelectionImpl;
}());
//# sourceMappingURL=SelectorExtension.js.map