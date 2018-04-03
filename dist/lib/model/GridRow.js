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
 * Represents a grid row.
 */
var GridRow = /** @class */ (function (_super) {
    __extends(GridRow, _super);
    /**
     * Initializes a new instance of DefaultGridRow.
     *
     * @param ref
     * @param height
     */
    function GridRow(ref, height) {
        if (height === void 0) { height = GridRow.defaultHeight; }
        var _this = _super.call(this) || this;
        _this.ref = ref;
        _this.height = height;
        return _this;
    }
    /**
     * The default height of a row; this can be altered.
     */
    GridRow.defaultHeight = 21;
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Number)
    ], GridRow.prototype, "height", void 0);
    return GridRow;
}(GridObject_1.GridObject));
exports.GridRow = GridRow;
//# sourceMappingURL=GridRow.js.map