"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Helper function that destroys a Destroyable if the reference is valid and it has not been destroyed.
 *
 * @param d the destroyable
 * @returns {boolean} whether any action was taken
 */
function safely(d) {
    if (!!d && !d.destroyed()) {
        d.destroy();
        return true;
    }
    return false;
}
exports.safely = safely;
/**
 * Helper function that destroys a Destroyable after the specified callback has been executed.
 *
 * @param d the destroyable
 * @param callback the callback
 */
function after(d, callback) {
    callback(d);
    safely(d);
}
exports.after = after;
//# sourceMappingURL=Destroy.js.map