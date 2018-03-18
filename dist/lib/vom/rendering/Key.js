"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Key = /** @class */ (function () {
    function Key(id, sort) {
        if (sort === void 0) { sort = 0; }
        this.id = id;
        this.sort = sort;
    }
    Key.prototype.toString = function () {
        return this.sort + "/" + this.id;
    };
    return Key;
}());
exports.Key = Key;
//# sourceMappingURL=Key.js.map