"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var SimpleEventEmitter_1 = require("../../base/SimpleEventEmitter");
var GridCellEvent_1 = require("../../core/events/GridCellEvent");
var Extensibility_1 = require("../../core/Extensibility");
var Rect_1 = require("../../geom/Rect");
var dom = require("../../misc/Dom");
var Vectors_1 = require("../../misc/Vectors");
var GridRange_1 = require("../../model/GridRange");
var KeyBehavior_1 = require("../../vom/input/KeyBehavior");
var MouseBehavior_1 = require("../../vom/input/MouseBehavior");
var GridChangeSet_1 = require("./GridChangeSet");
var GridCommitEvent_1 = require("./GridCommitEvent");
var GridInputEvent_1 = require("./GridInputEvent");
var State;
(function (State) {
    State["Idle"] = "idle";
    State["Editing"] = "editing";
    State["EditingPrecise"] = "editingPrecice";
})(State || (State = {}));
var EditingExtension = /** @class */ (function (_super) {
    __extends(EditingExtension, _super);
    function EditingExtension(autoApply) {
        if (autoApply === void 0) { autoApply = true; }
        var _this = _super.call(this) || this;
        _this.autoApply = autoApply;
        _this.state = State.Idle;
        return _this;
    }
    EditingExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        this.input = InputHandle.create(grid.container);
        MouseBehavior_1.MouseBehavior.for(grid.surface)
            .on(['LEFT.DBLCLICK/e'], function () { return _this.doBeginEdit(); });
        KeyBehavior_1.KeyBehavior.for(grid.surface)
            .when(function () { return _this.state == State.Idle; }, function (x) { return x
            .on('BACKSPACE/e/x', function () { return _this.doBeginEdit(''); })
            .on('DELETE', function () { return _this.erase(); })
            .on('*.PRESS', function (e) { return !!e.char && !e.modifiers.ctrl && !e.modifiers.alt ? _this.doBeginEdit(e.char) : false; }); });
        MouseBehavior_1.MouseBehavior.for(this.input.elmt)
            .on(['LEFT', 'MIDDLE', 'RIGHT'], function () { return _this.state = State.EditingPrecise; });
        KeyBehavior_1.KeyBehavior.for(this.input.elmt)
            .on('ESCAPE/e/x', function () { return _this.doEndEdit(false); })
            .on('ENTER/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.e); })
            .on('TAB/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.e); })
            .on('SHIFT+TAB/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.w); })
            .when(function () { return _this.state == State.Editing; }, function (x) { return x
            .on('UP_ARROW/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.n); })
            .on('DOWN_ARROW/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.s); })
            .on('RIGHT_ARROW/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.e); })
            .on('LEFT_ARROW/e/x', function () { return _this.endEditToNeighbor(Vectors_1.Vectors.w); }); })
            .on([
            'SHIFT+UP_ARROW/e', 'CTRL+UP_ARROW/e',
            'SHIFT+DOWN_ARROW/e', 'CTRL+DOWN_ARROW/e',
            'SHIFT+RIGHT_ARROW/e', 'CTRL+RIGHT_ARROW/e',
            'SHIFT+LEFT_ARROW/e', 'CTRL+LEFT_ARROW/e',
        ], function () { return _this.state = State.EditingPrecise; });
        //Before select commit pending edit
        kernel.routines.hook('before:doSelect', function () { return _this.doEndEdit(true); });
    };
    Object.defineProperty(EditingExtension.prototype, "primarySelection", {
        get: function () {
            return this.grid.kernel.variables.get('primarySelection');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EditingExtension.prototype, "selections", {
        get: function () {
            return this.grid.kernel.variables.get('selections');
        },
        enumerable: true,
        configurable: true
    });
    EditingExtension.prototype.commitUniform = function (cellRefs, uniformValue) {
        var changes = new GridChangeSet_1.GridChangeSet();
        for (var _i = 0, cellRefs_1 = cellRefs; _i < cellRefs_1.length; _i++) {
            var ref = cellRefs_1[_i];
            changes.set(ref, uniformValue, false);
        }
        this.doCommit(changes);
    };
    EditingExtension.prototype.commit = function (changes) {
        this.doCommit(changes);
    };
    EditingExtension.prototype.doBeginEdit = function (override) {
        var _a = this, grid = _a.grid, input = _a.input, primarySelection = _a.primarySelection;
        if (this.state != State.Idle || !primarySelection)
            return false;
        var cell = grid.model.findCell(primarySelection.from);
        if (!cell || is_readonly(cell))
            return false;
        var inputRect = this.computeInputRect();
        if (!inputRect)
            return false;
        if (!!override || override === '') {
            input.val(override);
        }
        else {
            input.val(cell.value);
        }
        input.goto(inputRect);
        input.focus();
        this.state = State.Editing;
        grid.emit(new GridCellEvent_1.GridCellEvent('beginEdit', grid, primarySelection.from));
        return true;
    };
    EditingExtension.prototype.doEndEdit = function (commit) {
        var _a = this, grid = _a.grid, input = _a.input, primarySelection = _a.primarySelection;
        if (this.state == State.Idle)
            return false;
        var newValue = input.val();
        input.visible = false;
        input.val('');
        grid.focus();
        if (commit && !!primarySelection) {
            this.commitUniform([primarySelection.from], newValue);
        }
        this.state = State.Idle;
        grid.emit(new GridCellEvent_1.GridCellEvent('endEdit', grid, primarySelection.from));
        return true;
    };
    EditingExtension.prototype.erase = function () {
        var _a = this, grid = _a.grid, selections = _a.selections;
        if (this.state != State.Idle)
            return;
        var changes = new GridChangeSet_1.GridChangeSet();
        for (var _i = 0, selections_1 = selections; _i < selections_1.length; _i++) {
            var s = selections_1[_i];
            var range = GridRange_1.GridRange.fromRefs(grid.model, [s.from, s.to]);
            var cells = range.ltr.filter(function (x) { return !is_readonly(x); });
            cells.forEach(function (c) { return changes.set(c.ref, '', false); });
        }
        this.commit(changes);
    };
    EditingExtension.prototype.doCommit = function (changes) {
        var _a = this, autoApply = _a.autoApply, grid = _a.grid;
        if (changes.length) {
            grid.emit(new GridCommitEvent_1.GridCommitEvent(grid, changes));
            if (autoApply) {
                changes.apply(grid.model);
                grid.forceUpdate();
            }
        }
    };
    EditingExtension.prototype.computeInputRect = function () {
        var surface = this.grid.surface;
        var inputNet = surface.query('net.input')[0];
        var inputArea = inputNet.absoluteBounds;
        var inputBorder = inputNet.border.width;
        for (var i = 0; i < surface.cameras.count; i++) {
            var camera = surface.cameras.item(i);
            if (inputArea.intersects(camera.area)) {
                //Deflate for border
                inputArea = inputArea.inflate([inputBorder * -1, inputBorder * -1]);
                //Convert to view point
                return Rect_1.Rect.fromPoints(camera.toViewPoint('surface', inputArea.topLeft()), camera.toViewPoint('surface', inputArea.bottomRight()));
            }
        }
        return null;
    };
    EditingExtension.prototype.endEditToNeighbor = function (vector) {
        var _a = this, grid = _a.grid, primarySelection = _a.primarySelection;
        if (this.doEndEdit(true)) {
            grid.exec('selectNext', 'cell', vector);
            return true;
        }
        return false;
    };
    __decorate([
        Extensibility_1.Variable('input', false),
        __metadata("design:type", InputHandle)
    ], EditingExtension.prototype, "input", void 0);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Array, Object]),
        __metadata("design:returntype", void 0)
    ], EditingExtension.prototype, "commitUniform", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [GridChangeSet_1.GridChangeSet]),
        __metadata("design:returntype", void 0)
    ], EditingExtension.prototype, "commit", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", Boolean)
    ], EditingExtension.prototype, "doBeginEdit", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Boolean]),
        __metadata("design:returntype", Boolean)
    ], EditingExtension.prototype, "doEndEdit", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], EditingExtension.prototype, "erase", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [GridChangeSet_1.GridChangeSet]),
        __metadata("design:returntype", void 0)
    ], EditingExtension.prototype, "doCommit", null);
    return EditingExtension;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.EditingExtension = EditingExtension;
function is_readonly(cell) {
    return cell['readonly'] === true || cell['editable'] === false;
}
var InputHandle = /** @class */ (function (_super) {
    __extends(InputHandle, _super);
    function InputHandle(root, text) {
        var _this = _super.call(this) || this;
        _this.root = root;
        _this.text = text;
        text.addEventListener('keypress', function (e) {
            if (!!e.which) {
                _this.emit(new GridInputEvent_1.GridInputEvent('type'));
            }
        });
        return _this;
    }
    InputHandle.create = function (root) {
        var text = document.createElement('input');
        text.type = 'text';
        text.className = 'grid-input';
        dom.css(text, {
            pointerEvents: 'auto',
            display: 'block',
            position: 'absolute',
            left: '0px',
            top: '0px',
            padding: '0',
            margin: '0',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
        });
        return new InputHandle(root, text);
    };
    Object.defineProperty(InputHandle.prototype, "elmt", {
        get: function () {
            return this.text;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputHandle.prototype, "range", {
        get: function () {
            return {
                start: this.text.selectionStart,
                end: this.text.selectionEnd,
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputHandle.prototype, "visible", {
        get: function () {
            return !!this.text.parentElement;
        },
        set: function (value) {
            if (value == this.visible)
                return;
            if (value) {
                this.root.ownerDocument.body.appendChild(this.text);
            }
            else {
                this.text.parentElement.removeChild(this.text);
            }
        },
        enumerable: true,
        configurable: true
    });
    InputHandle.prototype.goto = function (relativeRect, autoShow) {
        if (autoShow === void 0) { autoShow = true; }
        if (autoShow) {
            this.visible = true;
        }
        var rootOffset = dom.cumulativeOffset(this.root);
        var textRect = Rect_1.Rect.fromLike(relativeRect).offset(rootOffset);
        dom.css(this.text, {
            left: textRect.left + "px",
            top: textRect.top + "px",
            width: textRect.width + "px",
            height: textRect.height + "px",
        });
    };
    InputHandle.prototype.focus = function () {
        var _a = this, text = _a.text, visible = _a.visible;
        if (!visible)
            return;
        setTimeout(function () {
            text.focus();
            text.setSelectionRange(text.value.length, text.value.length);
        }, 0);
    };
    InputHandle.prototype.val = function (value, range) {
        var _a = this, text = _a.text, visible = _a.visible;
        if (!visible)
            return;
        if (value !== undefined) {
            text.value = value;
            if (range) {
                text.setSelectionRange(range.start, range.end || range.start);
            }
        }
        return text.value;
    };
    return InputHandle;
}(SimpleEventEmitter_1.SimpleEventEmitter));
//# sourceMappingURL=EditingExtension.js.map