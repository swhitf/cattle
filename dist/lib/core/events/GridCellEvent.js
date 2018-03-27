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
Object.defineProperty(exports, "__esModule", { value: true });
var Event_1 = require("../../base/Event");
var GridCellEvent = /** @class */ (function (_super) {
    __extends(GridCellEvent, _super);
    function GridCellEvent(type, grid, cellRef) {
        var _this = _super.call(this, type) || this;
        _this.grid = grid;
        _this.cellRef = cellRef;
        return _this;
    }
    return GridCellEvent;
}(Event_1.Event));
exports.GridCellEvent = GridCellEvent;
//# sourceMappingURL=GridCellEvent.js.map