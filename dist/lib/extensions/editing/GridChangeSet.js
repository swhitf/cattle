"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridChangeSet = /** @class */ (function () {
    function GridChangeSet() {
        this.index = {};
        this.list = [];
    }
    Object.defineProperty(GridChangeSet.prototype, "length", {
        get: function () {
            return this.list.length;
        },
        enumerable: true,
        configurable: true
    });
    GridChangeSet.prototype.has = function (ref) {
        return !!this.index[ref];
    };
    GridChangeSet.prototype.get = function (ref) {
        return this.index[ref];
    };
    GridChangeSet.prototype.set = function (ref, value, cascaded) {
        this.delete(ref);
        var entry = { ref: ref, value: value, cascaded: !!cascaded };
        this.index[ref] = entry;
        this.list.push(entry);
    };
    GridChangeSet.prototype.delete = function (ref) {
        if (this.has(ref)) {
            var entry = this.index[ref];
            var idx = this.list.indexOf(entry);
            delete this.index[ref];
            this.list.splice(idx, 1);
            return true;
        }
        return false;
    };
    GridChangeSet.prototype.value = function (ref) {
        var entry = this.index[ref];
        return !!entry ? entry.value : undefined;
    };
    GridChangeSet.prototype.refs = function () {
        return Object.keys(this.index);
    };
    GridChangeSet.prototype.apply = function (model) {
        for (var ref in this.index) {
            var tm = this.index[ref];
            var cell = model.findCell(ref);
            //Do not apply a non-cascaded readonly cell
            if (is_readonly(cell) && !tm.cascaded)
                continue;
            cell.value = tm.value;
        }
    };
    GridChangeSet.prototype.forEach = function (callback) {
        this.list.forEach(callback);
    };
    GridChangeSet.prototype.filter = function (callback) {
        return this.list.filter(function (x) { return callback(x); });
    };
    GridChangeSet.prototype.map = function (callback) {
        return this.list.map(callback);
    };
    return GridChangeSet;
}());
exports.GridChangeSet = GridChangeSet;
function is_readonly(cell) {
    return cell['readonly'] === true || cell['editable'] === false;
}
//# sourceMappingURL=GridChangeSet.js.map