"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents an event raised from an EventEmitter.
 */
var Event = /** @class */ (function () {
    /**
     * Initializes a new instance of Event.
     *
     * @param type A string value that identifies the type of event.
     */
    function Event(type) {
        this.canceledVal = false;
        this.type = type;
    }
    Object.defineProperty(Event.prototype, "canceled", {
        /**
         * Indicates whether or not the event has been cancelled.
         */
        get: function () {
            return this.canceledVal;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Cancels the event causing notification/propagation to stop.
     */
    Event.prototype.cancel = function () {
        this.canceledVal = true;
    };
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=Event.js.map