"use strict";
var Util_1 = require("../misc/Util");
var GridRange_1 = require("../model/GridRange");
var Point_1 = require("../geom/Point");
var RefExtract = /(?!.*['"`])[A-Za-z]+[0-9]+:?([A-Za-z]+[0-9])?/g;
var RefConvert = /([A-Za-z]+)([0-9]+)/g;
var SupportFunctions = {
    //Math:
    abs: Math.abs,
    acos: Math.acos,
    asin: Math.asin,
    atan: Math.atan,
    atan2: Math.atan2,
    ceil: Math.ceil,
    cos: Math.cos,
    exp: Math.exp,
    floor: Math.floor,
    log: Math.log,
    max: Math.max,
    min: Math.min,
    pow: Math.pow,
    random: Math.random,
    round: Math.round,
    sin: Math.sin,
    sqrt: Math.sqrt,
    tan: Math.tan,
    //Custom:
    sum: function (values) {
        return values.reduce(function (t, x) { return t + x; }, 0);
    },
};
var ComputeExtension = (function () {
    function ComputeExtension() {
        this.tracker = {};
    }
    Object.defineProperty(ComputeExtension.prototype, "selection", {
        get: function () {
            return this.grid.kernel.variables.get('selection');
        },
        enumerable: true,
        configurable: true
    });
    ComputeExtension.prototype.init = function (grid, kernel) {
        this.grid = grid;
        kernel.routines.override('commit', this.commitOverride.bind(this));
        kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
    };
    ComputeExtension.prototype.beginEditOverride = function (override, impl) {
        var _a = this, selection = _a.selection, tracker = _a.tracker;
        if (!selection[0]) {
            return false;
        }
        if (!override && override !== '') {
            override = tracker[selection[0]] || null;
        }
        return impl(override);
    };
    ComputeExtension.prototype.commitOverride = function (changes, impl) {
        var tracker = this.tracker;
        for (var ref in changes) {
            var val = changes[ref];
            if (val.length > 0 && val[0] === '=') {
                tracker[ref] = val;
                changes[ref] = this.evaluate(val);
            }
        }
        impl(changes);
    };
    ComputeExtension.prototype.evaluate = function (formula) {
        var result = null;
        while (result = RefExtract.exec(formula)) {
            if (!result.length)
                continue;
            formula =
                formula.substr(0, result.index) +
                    ("expr('" + result[0] + "')") +
                    formula.substring(result.index + result[0].length);
        }
        var functions = Util_1.extend({}, SupportFunctions);
        functions.expr = this.resolveExpr.bind(this);
        var code = ("with (arguments[0]) { return (" + formula.substr(1) + "); }").toLowerCase();
        console.log(code);
        var f = new Function(code).bind(null, functions);
        return f().toString() || '0';
    };
    ComputeExtension.prototype.resolveExpr = function (expr) {
        var _a = expr.split(':'), from = _a[0], to = _a[1];
        var fromCell = this.resolveRef(from);
        if (to === undefined) {
            if (!!fromCell) {
                return parseInt(fromCell.value) || 0;
            }
        }
        else {
            var toCell = this.resolveRef(to);
            if (!!fromCell && !!toCell) {
                var fromVector = new Point_1.Point(fromCell.colRef, fromCell.rowRef);
                var toVector = new Point_1.Point(toCell.colRef, toCell.rowRef);
                var range = GridRange_1.GridRange.select(this.grid.model, fromVector, toVector, true);
                return range.ltr.map(function (x) { return parseInt(x.value) || 0; });
            }
        }
        return 0;
    };
    ComputeExtension.prototype.resolveRef = function (nameRef) {
        RefConvert.lastIndex = 0;
        var result = RefConvert.exec(nameRef);
        var exprRef = result[1];
        var rowRef = parseInt(result[2]);
        var colRef = 0;
        for (var i = exprRef.length - 1; i >= 0; i--) {
            var x = (exprRef.length - 1) - i;
            var n = exprRef[x].toUpperCase().charCodeAt(0) - 64;
            colRef += n * (26 * i);
            if (i == 0) {
                colRef += n;
            }
        }
        return this.grid.model.locateCell(colRef - 1, rowRef - 1);
    };
    return ComputeExtension;
}());
exports.ComputeExtension = ComputeExtension;
//# sourceMappingURL=ComputeExtension.js.map