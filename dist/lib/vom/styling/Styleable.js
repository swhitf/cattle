"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Styleable(defaultValue) {
    return function (target, propertyKey) {
        Reflect.defineMetadata("cattle:styleable:" + propertyKey, true, target);
        if (!target['notifyChange']) {
            throw 'Cannot mark Styleable property on object that does not provide an notifyChange method.';
        }
        return {
            configurable: false,
            enumerable: true,
            get: function () {
                var state = this['__state'] || (this['__state'] = {});
                var style = this['__style'] || (this['__style'] = {});
                if (state[propertyKey] !== undefined) {
                    return state[propertyKey];
                }
                if (style[propertyKey] !== undefined) {
                    return style[propertyKey];
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
exports.Styleable = Styleable;
//# sourceMappingURL=Styleable.js.map