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
var GridEvent_1 = require("../../core/events/GridEvent");
var GridCommitEvent = /** @class */ (function (_super) {
    __extends(GridCommitEvent, _super);
    function GridCommitEvent(grid, changes) {
        var _this = _super.call(this, 'change', grid) || this;
        _this.grid = grid;
        _this.changes = changes;
        return _this;
    }
    return GridCommitEvent;
}(GridEvent_1.GridEvent));
exports.GridCommitEvent = GridCommitEvent;
//# sourceMappingURL=GridCommitEvent.js.map