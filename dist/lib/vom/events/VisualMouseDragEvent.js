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
var VisualMouseEvent_1 = require("./VisualMouseEvent");
/**
 * Represents an event raised from a Visual object when the mouse is dragged over the visual.
 */
var VisualMouseDragEvent = /** @class */ (function (_super) {
    __extends(VisualMouseDragEvent, _super);
    /**
     * Initializes a new instance of VisualMouseDragEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param camera The camera on which the mouse gesture was performed.
     * @param surfacePoint The position of the mouse relative to the surface when the event was raised.
     * @param button If applicable the button that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     * @param distance The distance the mouse has been dragged since the start of the drag gesture.
     */
    function VisualMouseDragEvent(target, camera, surfacePoint, button, modifiers, distance) {
        var _this = _super.call(this, 'mousedrag', target, camera, surfacePoint, button, modifiers) || this;
        _this.distance = distance;
        return _this;
    }
    return VisualMouseDragEvent;
}(VisualMouseEvent_1.VisualMouseEvent));
exports.VisualMouseDragEvent = VisualMouseDragEvent;
//# sourceMappingURL=VisualMouseDragEvent.js.map