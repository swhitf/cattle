"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var GridChangeSet = /** @class */ (function () {
    function GridChangeSet() {
        this.map = {};
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
        return !!this.map[ref];
    };
    GridChangeSet.prototype.get = function (ref) {
        return this.map[ref];
    };
    GridChangeSet.prototype.set = function (ref, value, cascaded) {
        this.delete(ref);
        var entry = { ref: ref, value: value, cascaded: !!cascaded };
        this.map[ref] = entry;
        this.list.push(entry);
    };
    GridChangeSet.prototype.delete = function (ref) {
        if (this.has(ref)) {
            var entry = this.map[ref];
            var idx = this.list.indexOf(entry);
            delete this.map[ref];
            this.list.splice(idx, 1);
            return true;
        }
        return false;
    };
    GridChangeSet.prototype.value = function (ref) {
        var entry = this.map[ref];
        return !!entry ? entry.value : undefined;
    };
    GridChangeSet.prototype.refs = function () {
        return Object.keys(this.map);
    };
    GridChangeSet.prototype.apply = function (model) {
        for (var ref in this.map) {
            var tm = this.map[ref];
            var cell = model.findCell(ref);
            //Do not apply a non-cascaded readonly cell
            if (is_readonly(cell) && !tm.cascaded)
                continue;
            cell.value = tm.value;
        }
    };
    return GridChangeSet;
}());
exports.GridChangeSet = GridChangeSet;
function is_readonly(cell) {
    return cell['readonly'] === true || cell['editable'] === false;
}
//# sourceMappingURL=GridChangeSet.js.map