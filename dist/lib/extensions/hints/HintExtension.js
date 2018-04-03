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
var Extensibility_1 = require("../../core/Extensibility");
var Keys_1 = require("../../vom/input/Keys");
var HintExtension = /** @class */ (function (_super) {
    __extends(HintExtension, _super);
    function HintExtension(providers) {
        var _this = _super.call(this) || this;
        _this.providers = providers;
        return _this;
    }
    HintExtension.prototype.init = function (grid, kernel) {
        this.grid = grid;
        this.editInput.addEventListener('keypress', this.onEditInputKeyPress.bind(this));
        this.editInput.addEventListener('keyup', this.onEditInputKeyUp.bind(this));
    };
    Object.defineProperty(HintExtension.prototype, "editInput", {
        get: function () {
            return this.grid.kernel.variables.get('editInput');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HintExtension.prototype, "primarySelection", {
        get: function () {
            return this.grid.kernel.variables.get('primarySelection');
        },
        enumerable: true,
        configurable: true
    });
    HintExtension.prototype.onEditInputKeyPress = function (e) {
        var _this = this;
        if (!!e.which) {
            setTimeout(function () { return _this.doSuggestion(); }, 0);
        }
    };
    HintExtension.prototype.onEditInputKeyUp = function (e) {
        var _this = this;
        if (e.ctrlKey && e.keyCode == Keys_1.Keys.SPACE) {
            setTimeout(function () { return _this.doSuggestion(); }, 0);
        }
    };
    HintExtension.prototype.doSuggestion = function () {
        var _a = this, grid = _a.grid, editInput = _a.editInput, primarySelection = _a.primarySelection, providers = _a.providers;
        //Only suggest if selection at the end
        if (editInput.selectionEnd != editInput.value.length)
            return;
        var input = editInput.value;
        var cell = grid.model.findCell(primarySelection.from);
        var suggestion = this.getSuggestion(cell, input);
        console.log(editInput.value, 'results in suggestion', suggestion);
        if (suggestion) {
            editInput.value = suggestion;
            editInput.setSelectionRange(input.length, suggestion.length);
            editInput.focus();
        }
    };
    HintExtension.prototype.getSuggestion = function (cell, input) {
        var result = null;
        for (var _i = 0, _a = this.providers; _i < _a.length; _i++) {
            var p = _a[_i];
            result = p.suggest(cell, input);
            if (!!result)
                break;
        }
        return result;
    };
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], HintExtension.prototype, "doSuggestion", null);
    return HintExtension;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.HintExtension = HintExtension;
//# sourceMappingURL=HintExtension.js.map