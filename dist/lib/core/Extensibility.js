"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function Dependency(name) {
}
exports.Dependency = Dependency;
/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs a task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
function Command(name) {
    return function (ctor, key, descriptor) {
        var mdk = 'cattle:commands';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            impl: descriptor.value,
        });
    };
}
exports.Command = Command;
/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
function Routine(name) {
    return function (ctor, key, descriptor) {
        var routine = descriptor.value;
        var wrapper = function () {
            var kernel = (this['__kernel'] || this['kernel']);
            return kernel.routines.signal(key, Array.prototype.slice.call(arguments, 0), routine.bind(this));
        };
        return { value: wrapper };
    };
}
exports.Routine = Routine;
function Variable(name, mutable) {
    if (typeof (name) === 'boolean') {
        return Variable(undefined, name);
    }
    return function (ctor, key) {
        var mdk = 'cattle:variables';
        var list = Reflect.getMetadata(mdk, ctor);
        if (!list) {
            Reflect.defineMetadata(mdk, (list = []), ctor);
        }
        list.push({
            name: name || key,
            key: key,
            mutable: mutable,
        });
        var valStoreKey = "__" + (name || key);
        Object.defineProperty(ctor, name || key, {
            configurable: false,
            enumerable: true,
            get: function () {
                return this[valStoreKey];
            },
            set: function (newVal) {
                this[valStoreKey] = newVal;
            }
        });
    };
}
exports.Variable = Variable;
//# sourceMappingURL=Extensibility.js.map