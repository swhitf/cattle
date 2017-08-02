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
var HistoryManager_1 = require("./HistoryManager");
var Util_1 = require("../../misc/Util");
var EditingExtension_1 = require("../common/EditingExtension");
var KeyInput_1 = require("../../input/KeyInput");
var Extensibility_1 = require("../../ui/Extensibility");
var HistoryExtension = (function () {
    function HistoryExtension(manager) {
        this.noCapture = false;
        this.suspended = false;
        this.manager = manager || new HistoryManager_1.DefaultHistoryManager();
    }
    HistoryExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', function () { return _this.undo(); })
            .on('!CTRL+KEY_Y', function () { return _this.redo(); });
        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
        grid.kernel.routines.hook('after:commit', this.afterCommit.bind(this));
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
        var compiled = changes.compile(model);
        for (var _i = 0, _a = compiled.filter(function (x) { return !x.cascaded; }); _i < _a.length; _i++) {
            var entry = _a[_i];
            batch.push({
                ref: entry.cell.ref,
                newVal: entry.value,
                oldVal: capture[entry.cell.ref],
                cascaded: entry.cascaded,
            });
        }
        return batch;
    };
    HistoryExtension.prototype.createEditAction = function (snapshots) {
        var _this = this;
        return {
            apply: function () {
                _this.invokeSilentCommit(create_changes(snapshots, function (x) { return x.newVal; }));
            },
            rollback: function () {
                _this.invokeSilentCommit(create_changes(snapshots, function (x) { return x.oldVal; }));
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
        var compiled = changes.compile(grid.model);
        var refs = compiled.filter(function (x) { return !x.cascaded; }).map(function (x) { return x.cell.ref; });
        grid.exec('select', refs);
    };
    __decorate([
        Extensibility_1.command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "undo", null);
    __decorate([
        Extensibility_1.command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "redo", null);
    __decorate([
        Extensibility_1.command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "push", null);
    __decorate([
        Extensibility_1.command('clearHistory'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "clear", null);
    __decorate([
        Extensibility_1.command('suspendHistory'),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Boolean]),
        __metadata("design:returntype", void 0)
    ], HistoryExtension.prototype, "suspend", null);
    return HistoryExtension;
}());
exports.HistoryExtension = HistoryExtension;
function create_changes(snapshots, valSelector) {
    var changeSet = new EditingExtension_1.GridChangeSet();
    for (var _i = 0, snapshots_1 = snapshots; _i < snapshots_1.length; _i++) {
        var s = snapshots_1[_i];
        changeSet.put(s.ref, valSelector(s), s.cascaded);
    }
    return changeSet;
}
//# sourceMappingURL=HistoryExtension.js.map