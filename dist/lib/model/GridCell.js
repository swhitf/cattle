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
var Observable_1 = require("../base/Observable");
var GridCellStyle_1 = require("./GridCellStyle");
var GridObject_1 = require("./GridObject");
var GridRef_1 = require("./GridRef");
/**
 * Represents a cell within a grid.
 */
var GridCell = /** @class */ (function (_super) {
    __extends(GridCell, _super);
    /**
     * Initializes a new instance of DefaultGridCell.
     *
     * @param params
     */
    function GridCell(params) {
        var _this = _super.call(this) || this;
        _this.ref = GridRef_1.GridRef.make(params.colRef, params.rowRef);
        _this.type = params.type || 'default';
        _this.data = params.data || {};
        _this.colRef = params.colRef;
        _this.colSpan = params.colSpan || 1;
        _this.rowRef = params.rowRef;
        _this.rowSpan = params.rowSpan || 1;
        _this.style = GridCellStyle_1.GridCellStyle.get.apply(GridCellStyle_1.GridCellStyle, (params.style || []));
        _this.value = (params.value === undefined || params.value === null) ? '' : params.value;
        return _this;
    }
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Object)
    ], GridCell.prototype, "data", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", GridCellStyle_1.GridCellStyle)
    ], GridCell.prototype, "style", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", String)
    ], GridCell.prototype, "value", void 0);
    return GridCell;
}(GridObject_1.GridObject));
exports.GridCell = GridCell;
//# sourceMappingURL=GridCell.js.map