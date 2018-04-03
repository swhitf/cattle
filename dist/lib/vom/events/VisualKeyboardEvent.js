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
 * Represents an event raised from a Visual object when a keyboard action is performed on the visual.
 */
var VisualKeyboardEvent = /** @class */ (function (_super) {
    __extends(VisualKeyboardEvent, _super);
    /**
     * Initializes a new instance of VisualKeyboardEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The visual that the event was raised from.
     * @param key The key that was actioned.
     * @param modifiers An object describing the modifiers keys active during the event.
     */
    function VisualKeyboardEvent(type, target, key, char, modifiers) {
        var _this = _super.call(this, type, target) || this;
        _this.key = key;
        _this.char = char;
        _this.modifiers = modifiers;
        return _this;
    }
    return VisualKeyboardEvent;
}(VisualEvent_1.VisualEvent));
exports.VisualKeyboardEvent = VisualKeyboardEvent;
//# sourceMappingURL=VisualKeyboardEvent.js.map