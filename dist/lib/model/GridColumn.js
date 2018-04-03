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
var GridObject_1 = require("./GridObject");
/**
 * Represents a grid column.
 */
var GridColumn = /** @class */ (function (_super) {
    __extends(GridColumn, _super);
    /**
     * Initializes a new instance of DefaultGridColumn.
     *
     * @param ref
     * @param width
     */
    function GridColumn(ref, width) {
        if (width === void 0) { width = GridColumn.defaultWidth; }
        var _this = _super.call(this) || this;
        _this.ref = ref;
        _this.width = width;
        return _this;
    }
    /**
     * The default width of a row; this can be altered.
     */
    GridColumn.defaultWidth = 100;
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Number)
    ], GridColumn.prototype, "width", void 0);
    return GridColumn;
}(GridObject_1.GridObject));
exports.GridColumn = GridColumn;
//# sourceMappingURL=GridColumn.js.map