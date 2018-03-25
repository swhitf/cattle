"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function when(predicate, callback) {
    return function () {
        if (predicate()) {
            callback();
        }
    };
}
exports.when = when;
//# sourceMappingURL=common.js.map