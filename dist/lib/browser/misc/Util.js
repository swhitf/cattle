define(["require", "exports"], function (require, exports) {
    "use strict";
    function coalesce() {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        for (var _a = 0, inputs_1 = inputs; _a < inputs_1.length; _a++) {
            var x = inputs_1[_a];
            if (x !== undefined && x !== null) {
                return x;
            }
        }
        return undefined;
    }
    exports.coalesce = coalesce;
    function extend(target, data) {
        for (var k in data) {
            target[k] = data[k];
        }
        return target;
    }
    exports.extend = extend;
    function index(arr, indexer) {
        var obj = {};
        for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
            var tm = arr_1[_i];
            obj[indexer(tm)] = tm;
        }
        return obj;
    }
    exports.index = index;
    function flatten(aa) {
        var a = [];
        for (var _i = 0, aa_1 = aa; _i < aa_1.length; _i++) {
            var tm = aa_1[_i];
            if (Array.isArray(tm)) {
                a = a.concat(flatten(tm));
            }
            else {
                a.push(tm);
            }
        }
        return a;
    }
    exports.flatten = flatten;
    function keys(ix) {
        return Object.keys(ix);
    }
    exports.keys = keys;
    function values(ix) {
        var a = [];
        for (var k in ix) {
            a.push(ix[k]);
        }
        return a;
    }
    exports.values = values;
    function zipPairs(pairs) {
        var obj = {};
        for (var _i = 0, pairs_1 = pairs; _i < pairs_1.length; _i++) {
            var pair = pairs_1[_i];
            obj[pair[0]] = pair[1];
        }
        return obj;
    }
    exports.zipPairs = zipPairs;
    function unzipPairs(pairs) {
        var arr = [];
        for (var key in pairs) {
            arr.push([key, pairs[key]]);
        }
        return arr;
    }
    exports.unzipPairs = unzipPairs;
    function max(arr, selector) {
        if (arr.length === 0)
            return null;
        var t = arr[0];
        for (var _i = 0, arr_2 = arr; _i < arr_2.length; _i++) {
            var x = arr_2[_i];
            if (selector(t) < selector(x)) {
                t = x;
            }
        }
        return t;
    }
    exports.max = max;
    function shadowClone(target) {
        if (typeof (target) === 'object') {
            var sc = {};
            for (var prop in target) {
                sc[prop] = shadowClone(target[prop]);
            }
            return sc;
        }
        return target;
    }
    exports.shadowClone = shadowClone;
});
//# sourceMappingURL=Util.js.map