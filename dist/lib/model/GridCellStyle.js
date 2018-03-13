"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var InstanceBuffer = {};
var Mutation;
(function (Mutation) {
    Mutation[Mutation["Add"] = 0] = "Add";
    Mutation[Mutation["Remove"] = 1] = "Remove";
})(Mutation || (Mutation = {}));
var GridCellStyle = /** @class */ (function () {
    function GridCellStyle(values) {
        if (values === void 0) { values = []; }
        this.values = values;
    }
    GridCellStyle.get = function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        values = values.sort(function (a, b) { return a > b ? 1 : -1; });
        for (var i = 0; i < values.length; i++) {
            var a = values[i];
            var b = undefined;
            for (var j = i + 1; j < values.length; j++) {
                if (values[j] !== undefined) {
                    b = values[j];
                }
            }
            if (b !== undefined && a == b) {
                delete values[i];
                i = -1;
            }
        }
        var key = values.join('/');
        if (!InstanceBuffer[key]) {
            InstanceBuffer[key] = new GridCellStyle(values);
        }
        return InstanceBuffer[key];
    };
    Object.defineProperty(GridCellStyle.prototype, "length", {
        get: function () {
            return this.values.length;
        },
        enumerable: true,
        configurable: true
    });
    GridCellStyle.prototype.item = function (index) {
        return this.values[index];
    };
    GridCellStyle.prototype.add = function () {
        var input = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            input[_i] = arguments[_i];
        }
        return GridCellStyle.get.apply(GridCellStyle, this.values.concat(input));
    };
    GridCellStyle.prototype.remove = function () {
        var input = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            input[_i] = arguments[_i];
        }
        return GridCellStyle.get.apply(GridCellStyle, this.values.filter(function (x) { return input.indexOf(x) >= 0; }));
    };
    GridCellStyle.prototype.toArray = function () {
        return this.values.slice(0);
    };
    return GridCellStyle;
}());
exports.GridCellStyle = GridCellStyle;
//# sourceMappingURL=GridCellStyle.js.map