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
var Papa = require("papaparse");
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var Extensibility_1 = require("../../core/Extensibility");
var Point_1 = require("../../geom/Point");
var GridRange_1 = require("../../model/GridRange");
var KeyBehavior_1 = require("../../vom/input/KeyBehavior");
var GridChangeSet_1 = require("../editing/GridChangeSet");
var Clipboard_1 = require("./Clipboard");
// :(
var NewLine = '\r\n'; // = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
var ClipboardExtension = /** @class */ (function (_super) {
    __extends(ClipboardExtension, _super);
    function ClipboardExtension() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ClipboardExtension.prototype.init = function (grid) {
        var _this = this;
        this.grid = grid;
        KeyBehavior_1.KeyBehavior.for(grid.surface)
            .on('CTRL+KEY_C', function () { return _this.doCopy(); })
            .on('CTRL+KEY_X', function () { return _this.doCut(); });
        this.chain(Clipboard_1.clipboard.on('paste', function (e) { return _this.onPasteOrCut(e.data, false); }), Clipboard_1.clipboard.on('cut', function (e) { return _this.onPasteOrCut(e.data, true); }));
        grid.kernel.routines.hook('before:doBeginEdit', function () { return _this.clearCopy(); });
        grid.kernel.routines.hook('before:doCommit', function () { return _this.clearCopy(); });
    };
    Object.defineProperty(ClipboardExtension.prototype, "nets", {
        get: function () {
            return this.grid.kernel.variables.get('nets');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ClipboardExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('primarySelection');
        },
        enumerable: true,
        configurable: true
    });
    ClipboardExtension.prototype.clearCopy = function () {
        this.destroyCopyNet();
    };
    ClipboardExtension.prototype.doCopy = function (delimiter) {
        if (delimiter === void 0) { delimiter = '\t'; }
        Clipboard_1.clipboard.copy(this.captureSelectionAsText());
        this.createCopyNet();
    };
    ClipboardExtension.prototype.doCut = function (delimiter) {
        if (delimiter === void 0) { delimiter = '\t'; }
        Clipboard_1.clipboard.cut(this.captureSelectionAsText());
        this.createCopyNet();
    };
    ClipboardExtension.prototype.doPaste = function (text, wasPreviouslyCut) {
        var _a = this, grid = _a.grid, nets = _a.nets;
        var copyRegion = nets.get('copy');
        var data = this.parsePastedText(text);
        var range = this.computePasteRange(data);
        var changes = this.computeChangeSet(data, range);
        if (!changes)
            return;
        if (wasPreviouslyCut && copyRegion) {
            var deleteRange = GridRange_1.GridRange.fromRefs(grid.model, [copyRegion.fromRef, copyRegion.toRef]);
            for (var _i = 0, _b = deleteRange.ltr; _i < _b.length; _i++) {
                var cell = _b[_i];
                changes.set(cell.ref, '');
            }
        }
        this.grid.kernel.commands.exec('commit', changes);
        this.grid.kernel.commands.exec('select', range.first().ref, range.last().ref);
    };
    ClipboardExtension.prototype.onPasteOrCut = function (text, wasPreviouslyCut) {
        var ae = document.activeElement;
        while (!!ae) {
            if (ae == this.grid.surface.view)
                break;
            ae = ae.parentElement;
        }
        if (ae) {
            this.doPaste(text, wasPreviouslyCut);
        }
    };
    ClipboardExtension.prototype.captureSelectionAsText = function (delimiter) {
        if (delimiter === void 0) { delimiter = '\t'; }
        var _a = this, grid = _a.grid, nets = _a.nets, selection = _a.selection;
        if (!selection)
            return;
        var range = GridRange_1.GridRange.fromRefs(grid.model, [selection.from, selection.to]);
        if (!range.length)
            return;
        var text = '';
        var rr = range.ltr[0].rowRef;
        for (var r = 0; r < range.height; r++) {
            for (var c = 0; c < range.width; c++) {
                text += range.ltr[(r + c)].value;
                if (c < (range.width - 1)) {
                    text += delimiter;
                }
            }
            text += NewLine;
        }
        return text;
    };
    ClipboardExtension.prototype.parsePastedText = function (pastedText) {
        var parsed = Papa.parse(pastedText, {
            delimiter: pastedText.indexOf('\t') >= 0 ? '\t' : undefined,
        });
        return parsed.data.filter(function (x) { return x.length > 1 || (x.length == 1 && !!x[0]); });
    };
    ClipboardExtension.prototype.computePasteRange = function (data) {
        var _a = this, grid = _a.grid, selection = _a.selection;
        var focusCell = grid.model.findCell(selection.from);
        var size = new Point_1.Point(Math.max.apply(Math, data.map(function (x) { return x.length; })), data.length);
        var start = new Point_1.Point(focusCell.colRef, focusCell.rowRef);
        var end = start.add(size).subtract(1);
        return GridRange_1.GridRange.fromPoints(grid.model, [start, end]);
    };
    ClipboardExtension.prototype.computeChangeSet = function (data, range) {
        var _a = this, grid = _a.grid, selection = _a.selection;
        var changes = new GridChangeSet_1.GridChangeSet();
        var start = Point_1.Point.create([range.first().colRef, range.first().rowRef]);
        for (var _i = 0, _b = range.ltr; _i < _b.length; _i++) {
            var cell = _b[_i];
            var xy = new Point_1.Point(cell.colRef, cell.rowRef).subtract(start);
            var value = data[xy.y][xy.x] || '';
            changes.set(cell.ref, value);
        }
        return changes;
    };
    ClipboardExtension.prototype.createCopyNet = function () {
        var _a = this, nets = _a.nets, selection = _a.selection;
        this.destroyCopyNet();
        nets.create('copy', 'copy', selection.from, selection.to);
    };
    ClipboardExtension.prototype.destroyCopyNet = function () {
        var nets = this.nets;
        var net = nets.get('copy');
        if (net)
            nets.destroy('copy');
    };
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "clearCopy", null);
    __decorate([
        Extensibility_1.Command('copy'),
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "doCopy", null);
    __decorate([
        Extensibility_1.Command('cut'),
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "doCut", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String, Boolean]),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "doPaste", null);
    return ClipboardExtension;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.ClipboardExtension = ClipboardExtension;
//# sourceMappingURL=ClipboardExtension.js.map