"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Observable(defaultValue) {
    return function (target, propertyKey) {
        if (!target['notifyChange']) {
            throw 'Cannot mark Observable property on object that does not provide an notifyChange method.';
        }
        return {
            configurable: false,
            enumerable: true,
            get: function () {
                var state = this['__state'] || (this['__state'] = {});
                if (state[propertyKey] !== undefined) {
                    return state[propertyKey];
                }
                return defaultValue;
            },
            set: function (value) {
                var emit = this['notifyChange'];
                var state = this['__state'] || (this['__state'] = {});
                state[propertyKey] = value;
                emit.call(this, propertyKey);
            },
        };
    };
}
exports.Observable = Observable;
//# sourceMappingURL=Observable.js.map