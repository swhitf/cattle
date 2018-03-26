"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides an abstract base class for Destroyable implementations.
 */
var AbstractDestroyable = /** @class */ (function () {
    function AbstractDestroyable() {
        this.destroyables = [];
    }
    /**
     * Throws an exception if this object has been destroyed.  Call this before operations that should be prevented
     * on a destroyed object.
     */
    AbstractDestroyable.prototype.guardDestroyed = function () {
        if (this.isDestroyed) {
            throw 'This object has been destroyed.';
        }
    };
    /**
     * Chains the specified Destroyable objects to this Destroyable so they are destroyed when this object is destroyed.
     *
     * @param objects the Destroyable objects
     */
    AbstractDestroyable.prototype.chain = function () {
        var objects = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            objects[_i] = arguments[_i];
        }
        for (var i = 0; i < objects.length; i++) {
            this.destroyables.push(typeof (objects[i]) == 'function'
                ? objects[i]
                : objects[i].destroy.bind(objects[i]));
        }
    };
    /**
     * Destroys this object, releasing any resources it holds and rendering it unusable.
     */
    AbstractDestroyable.prototype.destroy = function () {
        this.guardDestroyed();
        this.destroyables.forEach(function (x) { return x(); });
        this.destroyables = null;
        this.isDestroyed = true;
    };
    /**
     * Indicates whether or not this object has been destroyed.
     */
    AbstractDestroyable.prototype.destroyed = function () {
        return this.isDestroyed;
    };
    return AbstractDestroyable;
}());
exports.AbstractDestroyable = AbstractDestroyable;
//# sourceMappingURL=AbstractDestroyable.js.map