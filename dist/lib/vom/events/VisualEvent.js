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
/**
 * Represents an event raised from a Visual object.
 */
var VisualEvent = /** @class */ (function (_super) {
    __extends(VisualEvent, _super);
    /**
     * Initializes a new instance of VisualEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     */
    function VisualEvent(type, target) {
        var _this = _super.call(this, type) || this;
        _this.target = target;
        return _this;
    }
    return VisualEvent;
}(Event_1.Event));
exports.VisualEvent = VisualEvent;
//# sourceMappingURL=VisualEvent.js.map