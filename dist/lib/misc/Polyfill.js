"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ie_safe_create_mouse_event(type, source) {
    if (MouseEvent.prototype.initMouseEvent) {
        var event_1 = document.createEvent("MouseEvent");
        event_1.initMouseEvent(type, source.bubbles, source.cancelable, window, source.detail, source.screenX, source.screenY, source.clientX, source.clientY, source.ctrlKey, source.altKey, source.shiftKey, source.metaKey, source.button, source.relatedTarget);
        return event_1;
    }
    else {
        return new MouseEvent(type, source);
    }
}
exports.ie_safe_create_mouse_event = ie_safe_create_mouse_event;
//# sourceMappingURL=Polyfill.js.map