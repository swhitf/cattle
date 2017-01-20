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
var KeyInput_1 = require("../input/KeyInput");
var Extensibility_1 = require("../ui/Extensibility");
var _ = require("../misc/Util");
var HistoryExtension = (function () {
    function HistoryExtension() {
        this.future = [];
        this.past = [];
        this.noCapture = false;
    }
    HistoryExtension.prototype.init = function (grid, kernel) {
        var _this = this;
        this.grid = grid;
        KeyInput_1.KeyInput.for(grid.root)
            .on('!CTRL+KEY_Z', function () { return _this.undo(); })
            .on('!CTRL+KEY_Y', function () { return _this.redo(); });
        grid.kernel.routines.hook('before:commit', this.beforeCommit.bind(this));
    };
    HistoryExtension.prototype.undo = function () {
        if (!this.past.length) {
            return;
        }
        var action = this.past.pop();
        action.rollback();
        this.future.push(action);
    };
    HistoryExtension.prototype.redo = function () {
        if (!this.future.length) {
            return;
        }
        var action = this.future.pop();
        action.apply();
        this.past.push(action);
    };
    HistoryExtension.prototype.push = function (action) {
        this.past.push(action);
        this.future = [];
    };
    HistoryExtension.prototype.beforeCommit = function (changes) {
        if (this.noCapture)
            return;
        var snapshots = this.createSnapshots(changes);
        var action = this.createEditAction(snapshots);
        this.push(action);
    };
    HistoryExtension.prototype.createSnapshots = function (changes) {
        var model = this.grid.model;
        var batch = [];
        for (var ref in changes) {
            batch.push({
                ref: ref,
                newVal: changes[ref],
                oldVal: model.findCell(ref).value,
            });
        }
        return batch;
    };
    HistoryExtension.prototype.createEditAction = function (snapshots) {
        var _this = this;
        return {
            apply: function () {
                _this.invokeSilentCommit(_.zipPairs(snapshots.map(function (x) { return [x.ref, x.newVal]; })));
            },
            rollback: function () {
                _this.invokeSilentCommit(_.zipPairs(snapshots.map(function (x) { return [x.ref, x.oldVal]; })));
            },
        };
    };
    HistoryExtension.prototype.invokeSilentCommit = function (changes) {
        var kernel = this.grid.kernel;
        try {
            this.noCapture = true;
            kernel.commands.exec('commit', changes);
        }
        finally {
            this.noCapture = false;
        }
        kernel.commands.exec('select', _.keys(changes));
    };
    return HistoryExtension;
}());
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
exports.HistoryExtension = HistoryExtension;
//# sourceMappingURL=HistoryExtension.js.map