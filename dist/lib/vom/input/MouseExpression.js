"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var VisualMouseEvent_1 = require("../events/VisualMouseEvent");
var u = require("../../misc/Util");
var Modifiers_1 = require("./Modifiers");
var MouseExpression = /** @class */ (function () {
    function MouseExpression(cfg) {
        this.event = null;
        this.button = null;
        u.extend(this, cfg);
    }
    MouseExpression.create = function (e) {
        var cfg = { exact: false, exclusive: false, };
        if (e instanceof MouseEvent) {
            cfg.event = e.type;
            cfg.button = e.button;
            cfg.modifiers = new Modifiers_1.Modifiers(e.altKey, e.ctrlKey, e.shiftKey);
        }
        else {
            cfg.event = e.type;
            cfg.button = e.button;
            cfg.modifiers = e.modifiers;
        }
        return new MouseExpression(cfg);
    };
    MouseExpression.parse = function (input) {
        var cfg = {
            keys: [],
        };
        var _a = input.split('/'), expr = _a[0], tags = _a.slice(1);
        var _b = divide_expression(expr), left = _b[0], right = _b[1];
        cfg.event = parse_event(left);
        cfg.button = parse_button(left);
        cfg.modifiers = Modifiers_1.Modifiers.parse(right);
        cfg.exact = !!~tags.indexOf('e');
        cfg.exclusive = !!~tags.indexOf('x');
        return new MouseExpression(cfg);
    };
    MouseExpression.prototype.matches = function (input) {
        var expr = norm(input);
        if (this.event !== expr.event)
            return false;
        if (this.button !== null && this.button !== expr.button)
            return false;
        if (this.exact && !this.modifiers.matchesExact(expr.modifiers))
            return false;
        if (!this.modifiers.matches(expr.modifiers))
            return false;
        return true;
    };
    MouseExpression.prototype.toString = function () {
        var keys = [];
        if (this.modifiers.ctrl)
            keys.push('CTRL');
        if (this.modifiers.alt)
            keys.push('ALT');
        if (this.modifiers.shift)
            keys.push('SHIFT');
        return [this.button, this.event].join('_') + '+' + keys.join('+');
    };
    return MouseExpression;
}());
exports.MouseExpression = MouseExpression;
function norm(x) {
    return (x instanceof MouseEvent || x instanceof VisualMouseEvent_1.VisualMouseEvent)
        ? MouseExpression.create(x)
        : x;
}
function parse_event(value) {
    value = ((value || '').trim().toLowerCase()).split('.')[1] || 'down';
    switch (value) {
        case 'down':
        case 'move':
        case 'up':
        case 'drag':
        case 'enter':
        case 'leave':
            return ('mouse' + value);
        case 'mousedown':
        case 'mousemove':
        case 'mouseup':
        case 'mousedrag':
        case 'mouseenter':
        case 'mouseleave':
        case 'click':
        case 'dblclick':
            // case 'dragbegin':
            // case 'drag':
            // case 'dragend':
            return value;
        default:
            throw 'Invalid MouseEventType: ' + value;
    }
}
function parse_button(value) {
    value = ((value || '').trim().toLowerCase()).split('.')[0];
    switch (value) {
        case 'left':
        case 'primary':
        case 'button1':
            return 0;
        case 'middle':
        case 'button2':
            return 1;
        case 'right':
        case 'secondary':
        case 'button3':
            return 2;
        default:
            throw 'Invalid MouseButton: ' + value;
    }
}
function divide_expression(value) {
    var parts = value.split('+');
    if (parts.length > 1) {
        parts = [parts[0], parts.slice(1).join('+')];
    }
    return parts;
}
//# sourceMappingURL=MouseExpression.js.map