"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VisualKeyboardEvent_1 = require("../events/VisualKeyboardEvent");
var Keys_1 = require("./Keys");
var Modifiers_1 = require("./Modifiers");
var KeyExpression = /** @class */ (function () {
    function KeyExpression(event, keys, tags) {
        if (tags === void 0) { tags = []; }
        this.event = event;
        this.key = keys.filter(function (x) { return x !== Keys_1.Keys.CTRL && x !== Keys_1.Keys.ALT && x !== Keys_1.Keys.SHIFT; })[0] || null;
        this.exact = !!~tags.indexOf('e');
        this.exclusive = !!~tags.indexOf('x');
        this.modifiers = new Modifiers_1.Modifiers(keys.some(function (x) { return x === Keys_1.Keys.ALT; }), keys.some(function (x) { return x === Keys_1.Keys.CTRL; }), keys.some(function (x) { return x === Keys_1.Keys.SHIFT; }));
    }
    KeyExpression.create = function (e) {
        if (e instanceof KeyboardEvent) {
            var keys = [e.keyCode];
            if (e.ctrlKey)
                keys.push(Keys_1.Keys.CTRL);
            if (e.altKey)
                keys.push(Keys_1.Keys.ALT);
            if (e.shiftKey)
                keys.push(Keys_1.Keys.SHIFT);
            return new KeyExpression(e.type, keys);
        }
        else {
            var keys = [e.key];
            if (e.modifiers.ctrl)
                keys.push(Keys_1.Keys.CTRL);
            if (e.modifiers.alt)
                keys.push(Keys_1.Keys.ALT);
            if (e.modifiers.shift)
                keys.push(Keys_1.Keys.SHIFT);
            return new KeyExpression(e.type, keys);
        }
    };
    KeyExpression.parse = function (input) {
        var _a = input.split('/'), expr = _a[0], tags = _a.slice(1);
        var _b = extract_event(expr), keys = _b[0], event = _b[1];
        var sequence = keys
            .split(/[\s\-\+]+/)
            .filter(function (x) { return !!x; })
            .map(function (x) { return Keys_1.Keys.parse(x); });
        return new KeyExpression(event, sequence, tags);
    };
    KeyExpression.prototype.matches = function (input) {
        var expr = norm(input);
        if (this.key != Keys_1.Keys.WILDCARD && this.key != expr.key)
            return false;
        if (this.exact && !this.modifiers.matchesExact(expr.modifiers))
            return false;
        if (!this.modifiers.matches(expr.modifiers))
            return false;
        return true;
    };
    KeyExpression.prototype.toString = function () {
        var keys = [String.fromCharCode(this.key)];
        if (this.modifiers.ctrl)
            keys.push('CTRL');
        if (this.modifiers.alt)
            keys.push('ALT');
        if (this.modifiers.shift)
            keys.push('SHIFT');
        return keys.join('+');
    };
    return KeyExpression;
}());
exports.KeyExpression = KeyExpression;
function norm(x) {
    return (x instanceof KeyboardEvent || x instanceof VisualKeyboardEvent_1.VisualKeyboardEvent)
        ? KeyExpression.create(x)
        : x;
}
function extract_event(expr) {
    var event = 'keydown';
    if (expr.indexOf('.') >= 0) {
        event = expr.match(/\.([\w*]+)\+?/)[1];
        expr = expr.replace("." + event, '');
        event = event.toLowerCase();
        switch (event) {
            case 'down':
            case 'press':
            case 'up':
                event = 'key' + event;
                break;
            case 'keydown':
            case 'keypress':
            case 'keyup':
                break;
            default:
                throw 'Invalid KeyEventType: ' + event;
        }
    }
    return [expr, event];
}
//# sourceMappingURL=KeyExpression.js.map