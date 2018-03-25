"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var KeyedSet = /** @class */ (function () {
    function KeyedSet(indexer) {
        this.indexer = indexer;
        this.list = [];
        this.index = {};
    }
    Object.defineProperty(KeyedSet.prototype, "array", {
        get: function () {
            return this.list;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(KeyedSet.prototype, "size", {
        get: function () {
            return this.list.length;
        },
        enumerable: true,
        configurable: true
    });
    KeyedSet.prototype.add = function (value) {
        var key = this.indexer(value);
        if (this.index[key]) {
            return false;
        }
        else {
            this.index[key] = value;
            this.list.push(value);
            return true;
        }
    };
    KeyedSet.prototype.addAll = function (values) {
        var _this = this;
        values.forEach(function (x) { return _this.add(x); });
    };
    KeyedSet.prototype.merge = function (value) {
        var key = this.indexer(value);
        if (this.index[key]) {
            Object.assign(this.index[key], value);
        }
        else {
            this.add(value);
        }
    };
    KeyedSet.prototype.clear = function () {
        this.index = {};
        this.list = [];
    };
    KeyedSet.prototype.delete = function (key) {
        var value = this.get(key);
        if (value) {
            var i = this.list.indexOf(value);
            delete this.index[key];
            this.list.splice(i, 1);
            return true;
        }
        else {
            return false;
        }
    };
    KeyedSet.prototype.remove = function (value) {
        return this.delete(this.indexer(value));
    };
    KeyedSet.prototype.removeAll = function (values) {
        var _this = this;
        values.forEach(function (x) { return _this.remove(x); });
    };
    KeyedSet.prototype.removeWhere = function (predicate) {
        var _this = this;
        var before = this.list.length;
        this.list = this.list.filter(function (tm, i) {
            if (predicate(tm, i)) {
                delete _this.index[_this.indexer(tm)];
                return false;
            }
            return true;
        });
        return before - this.list.length;
    };
    KeyedSet.prototype.has = function (value) {
        var key = this.indexer(value);
        return !!this.index[key];
    };
    KeyedSet.prototype.get = function (key) {
        return this.index[key] || null;
    };
    KeyedSet.prototype.first = function () {
        return this.list[0];
    };
    KeyedSet.prototype.last = function () {
        return this.list[this.list.length - 1];
    };
    KeyedSet.prototype.forEach = function (callback, thisArg) {
        this.list.forEach(callback, thisArg);
    };
    KeyedSet.prototype.filter = function (callback) {
        return this.list.filter(callback);
    };
    KeyedSet.prototype.find = function (callback) {
        return this.list.find(callback);
    };
    KeyedSet.prototype.map = function (callback) {
        return this.list.map(callback);
    };
    KeyedSet.prototype.reduce = function (callback, initial) {
        return this.list.reduce(callback, initial);
    };
    return KeyedSet;
}());
exports.KeyedSet = KeyedSet;
//# sourceMappingURL=KeyedSet.js.map