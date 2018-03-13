"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function debug_events(ee) {
    var original = ee['emit'];
    ee['emit'] = function (e) {
        console.debug(e.type + ' -> ', e);
        original.apply(this, arguments);
    };
}
exports.debug_events = debug_events;
//# sourceMappingURL=EventEmitter.js.map