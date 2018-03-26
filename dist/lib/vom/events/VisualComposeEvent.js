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
 * Represents an event raised from a Visual object when its composition has changed.
 */
var VisualComposeEvent = /** @class */ (function (_super) {
    __extends(VisualComposeEvent, _super);
    /**
     * Initializes a new instance of VisualComposeEvent.
     *
     * @param target The visual that the event was raised from.
     * @param subject The subject component.
     * @param mode What happaned.
     */
    function VisualComposeEvent(target, subject, mode) {
        var _this = _super.call(this, 'compose', target) || this;
        _this.subject = subject;
        _this.mode = mode;
        return _this;
    }
    return VisualComposeEvent;
}(VisualEvent_1.VisualEvent));
exports.VisualComposeEvent = VisualComposeEvent;
//# sourceMappingURL=VisualComposeEvent.js.map