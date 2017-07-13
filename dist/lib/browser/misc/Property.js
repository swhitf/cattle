define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function property(defaultValue, filter) {
        return function (ctor, propName) {
            Object.defineProperty(ctor, propName, {
                configurable: false,
                enumerable: true,
                get: function () {
                    var val = this['__' + propName];
                    return (val === undefined) ? defaultValue : val;
                },
                set: function (newVal) {
                    this['__' + propName] = newVal;
                    filter(this, newVal);
                }
            });
        };
    }
    exports.property = property;
});
//# sourceMappingURL=Property.js.map