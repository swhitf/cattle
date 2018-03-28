"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chrono = require("chrono-node");
var moment = require("moment");
function parseFloatWithFallback(input, fallback) {
    var num = parseFloat(input);
    if (isNaN(num))
        return fallback || num;
}
var NumberType = /** @class */ (function () {
    function NumberType() {
        this.name = 'number';
    }
    NumberType.prototype.format = function (value, data) {
        var num = parseFloat(value);
        if (isNaN(num))
            return '';
        //Cell data can include a format object with instructions for formatting
        var settings = data.type || {};
        return !!settings.precision ? num.toFixed(settings.precision) : num.toString();
    };
    NumberType.prototype.convert = function (value, data) {
        var num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };
    return NumberType;
}());
var DateType = /** @class */ (function () {
    function DateType() {
        this.name = 'date';
    }
    DateType.prototype.format = function (value, data) {
        var dt = chrono.parseDate(value);
        if (!dt)
            return '';
        var mt = moment(dt);
        //Cell data can include a format object with instructions for formatting
        var settings = data.type || {};
        return mt.format(settings.format || 'L');
    };
    DateType.prototype.convert = function (value, data) {
        var dt = chrono.parseDate(value);
        if (!dt)
            return null;
        return moment(dt);
    };
    return DateType;
}());
/**
 * Standard GridValueType implementations.
 */
exports.GridValueTypes = {
    string: {
        name: 'string',
        format: function (x) { return x; },
        convert: function (x) { return x; },
    },
    number: new NumberType(),
    date: new DateType(),
};
//# sourceMappingURL=GridValueType.js.map