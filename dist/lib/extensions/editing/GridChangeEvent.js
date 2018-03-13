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
var GridChangeEvent = /** @class */ (function (_super) {
    __extends(GridChangeEvent, _super);
    function GridChangeEvent(changes) {
        var _this = _super.call(this, 'change') || this;
        _this.changes = changes;
        return _this;
    }
    return GridChangeEvent;
}(Event_1.Event));
exports.GridChangeEvent = GridChangeEvent;
//# sourceMappingURL=GridChangeEvent.js.map