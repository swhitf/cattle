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
var ClipEvent = /** @class */ (function (_super) {
    __extends(ClipEvent, _super);
    function ClipEvent(type, data) {
        var _this = _super.call(this, type) || this;
        _this.data = data;
        return _this;
    }
    return ClipEvent;
}(Event_1.Event));
exports.ClipEvent = ClipEvent;
//# sourceMappingURL=ClipEvent.js.map