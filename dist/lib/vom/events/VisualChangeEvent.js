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
var VisualEvent_1 = require("./VisualEvent");
/**
 * Represents an event raised from a Visual object when a property on the visual changes value.
 */
var VisualChangeEvent = /** @class */ (function (_super) {
    __extends(VisualChangeEvent, _super);
    /**
     * Initializes a new instance of VisualChangeEvent.
     *
     * @param target The visual that the event was raised from.
     * @param property The name of the property that changed.
     */
    function VisualChangeEvent(target, property) {
        var _this = _super.call(this, 'change', target) || this;
        _this.property = property;
        return _this;
    }
    return VisualChangeEvent;
}(VisualEvent_1.VisualEvent));
exports.VisualChangeEvent = VisualChangeEvent;
//# sourceMappingURL=VisualChangeEvent.js.map