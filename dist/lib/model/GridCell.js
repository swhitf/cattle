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
var Base26_1 = require("../misc/Base26");
var GridCellStyle_1 = require("./GridCellStyle");
var Observable_1 = require("../base/Observable");
var GridObject_1 = require("./GridObject");
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
        _this.ref = GridCell.makeRef(params.colRef, params.rowRef);
        _this.type = params.type || 'default';
        _this.colRef = params.colRef;
        _this.colSpan = params.colSpan || 1;
        _this.rowRef = params.rowRef;
        _this.rowSpan = params.rowSpan || 1;
        _this.style = GridCellStyle_1.GridCellStyle.get.apply(GridCellStyle_1.GridCellStyle, (params.style || []));
        _this.value = (params.value === undefined || params.value === null) ? '' : params.value;
        return _this;
    }
    /**
     * Determines whether or not the specified string is a valid cell reference.
     *
     * @param str
     */
    GridCell.isRef = function (str) {
        return !!str.match(/[A-Za-z]+\d+/);
    };
    /**
     * Creates a cell reference string from the specified column and row references.
     *
     * @param col
     * @param row
     */
    GridCell.makeRef = function (col, row) {
        return Base26_1.Base26.num(col).str + (row + 1).toString();
    };
    /**
     * Reads a cell reference string and returns the column and row reference values.
     *
     * @param cellRef
     */
    GridCell.unmakeRef = function (cellRef) {
        var b26cr = '';
        var b10rr = '';
        for (var i = 0; i < cellRef.length; i++) {
            var c = cellRef.charAt(i);
            if (!isNaN(+c)) {
                b26cr = cellRef.slice(0, i);
                b10rr = cellRef.slice(i, cellRef.length);
                break;
            }
        }
        return { col: Base26_1.Base26.str(b26cr).num, row: parseInt(b10rr) - 1, };
    };
    /**
     * Reads a cell reference string and returns the column and row as the first and
     * second values in an array.
     *
     * @param cellRef
     */
    GridCell.unmakeRefToArray = function (cellRef) {
        var parts = this.unmakeRef(cellRef);
        return [parts.col, parts.row];
    };
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