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
var Extensibility_1 = require("../../core/Extensibility");
var Util_1 = require("../../misc/Util");
var GridRange_1 = require("../../model/GridRange");
var KeyBehavior_1 = require("../../vom/input/KeyBehavior");
var GridChangeSet_1 = require("../editing/GridChangeSet");
var DefaultHistoryManager_1 = require("./DefaultHistoryManager");
var HistoryExtension = /** @class */ (function () {
    function HistoryExtension(manager) {
        this.noCapture = false;
        this.suspended = false;
        this.manager = manager || new DefaultHistoryManager_1.DefaultHistoryManager();
    }
    HistoryExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        KeyBehavior_1.KeyBehavior.for(grid.surface)
            .on('CTRL+KEY_Z/xe', function () { return _this.undo(); })
            .on('CTRL+KEY_Y/xe', function () { return _this.redo(); });
        grid.kernel.routines.hook('before:doCommit', this.beforeCommit.bind(this));
        grid.kernel.routines.hook('after:doCommit', this.afterCommit.bind(this));
    };
    HistoryExtension.prototype.undo = function () {
        this.manager.undo();
    };
    HistoryExtension.prototype.redo = function () {
        this.manager.redo();
    };
    HistoryExtension.prototype.push = function (action) {
        this.manager.push(action);
    };
    HistoryExtension.prototype.clear = function () {
        this.manager.clear();
    };
    HistoryExtension.prototype.suspend = function (flag) {
        if (flag === void 0) { flag = true; }
        this.suspended = flag;
    };
    HistoryExtension.prototype.beforeCommit = function (changes) {
        if (this.noCapture || this.suspended)
            return;
        var model = this.grid.model;
        this.capture = Util_1.zipPairs(changes.refs().map(function (r) { return [r, model.findCell(r).value]; }));
    };
    HistoryExtension.prototype.afterCommit = function (changes) {
        if (this.noCapture || !this.capture || this.suspended)
            return;
        var snapshots = this.createSnapshots(this.capture, changes);
        if (snapshots.length) {
            var action = this.createEditAction(snapshots);
            this.push(action);
        }
        this.capture = null;
    };
    HistoryExtension.prototype.createSnapshots = function (capture, changes) {
        var model = this.grid.model;
        var batch = [];
        for (var _i = 0, _a = changes.filter(function (x) { return !x.cascaded; }); _i < _a.length; _i++) {
            var entry = _a[_i];
            batch.push({
                ref: entry.ref,
                newVal: entry.value,
                oldVal: capture[entry.ref],
                cascaded: entry.cascaded,
            });
        }
        return batch;
    };
    HistoryExtension.prototype.createEditAction = function (snapshots) {
        var _this = this;
        return {
            apply: function () {
                _this.invokeSilentCommit(createChanges(snapshots, function (x) { return x.newVal; }));
            },
            rollback: function () {
                _this.invokeSilentCommit(createChanges(snapshots, function (x) { return x.oldVal; }));
            },
        };
    };
    HistoryExtension.prototype.invokeSilentCommit = function (changes) {
        var grid = this.grid;
        try {
            this.noCapture = true;
            grid.exec('commit', changes);
        }
        finally {
            this.noCapture = false;
        }
        var refs = changes.filter(function (x) { return !x.cascaded; }).map(function (x) { return x.ref; });
        var range = GridRange_1.GridRange.fromRefs(grid.model, refs);
        grid.exec('select', range.first().ref, range.last().ref);
    };
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "undo", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "redo", null);
    __decorate([
        Extensibility_1.Command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "push", null);
    __decorate([
        Extensibility_1.Command('clearHistory'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "clear", null);
    __decorate([
        Extensibility_1.Command('suspendHistory'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Boolean]),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "suspend", null);
    return HistoryExtension;
}());
exports.HistoryExtension = HistoryExtension;
function createChanges(snapshots, valSelector) {
    var changeSet = new GridChangeSet_1.GridChangeSet();
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        changeSet.set(s.ref, valSelector(s), s.cascaded);
    }
    return changeSet;
}
//# sourceMappingURL=HistoryExtension.js.map