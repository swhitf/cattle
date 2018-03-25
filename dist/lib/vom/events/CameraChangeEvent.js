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
var CameraEvent_1 = require("./CameraEvent");
/**
 * Represents an event raised when a camera object property has changed.
 */
var CameraChangeEvent = /** @class */ (function (_super) {
    __extends(CameraChangeEvent, _super);
    /**
     * Initializes a new instance of CameraChangeEvent.
     *
     * @param target The camera that the event was raised for.
     * @param property The name of the property that changed.
     */
    function CameraChangeEvent(target, property) {
        var _this = _super.call(this, 'change', target) || this;
        _this.property = property;
        return _this;
    }
    return CameraChangeEvent;
}(CameraEvent_1.CameraEvent));
exports.CameraChangeEvent = CameraChangeEvent;
//# sourceMappingURL=CameraChangeEvent.js.map