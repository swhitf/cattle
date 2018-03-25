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
 * Represents an event raised from a Visual object when a mouse action is performed on the visual.
 */
var VisualMouseEvent = /** @class */ (function (_super) {
    __extends(VisualMouseEvent, _super);
    /**
     * Initializes a new instance of VisualMouseEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param camera The camera on which the mouse gesture was performed.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param button If applicable the button that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     */
    function VisualMouseEvent(type, target, camera, surfacePoint, button, modifiers) {
        var _this = _super.call(this, type, target) || this;
        _this.camera = camera;
        _this.surfacePoint = surfacePoint;
        _this.button = button;
        _this.modifiers = modifiers;
        return _this;
    }
    return VisualMouseEvent;
}(VisualEvent_1.VisualEvent));
exports.VisualMouseEvent = VisualMouseEvent;
//# sourceMappingURL=VisualMouseEvent.js.map