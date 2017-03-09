define(["require", "exports", "./Keys", "../misc/Util", "./KeyCheck"], function (require, exports, Keys_1, _, KeyCheck_1) {
    "use strict";
    function parse_event(value) {
        value = (value || '').trim().toLowerCase();
        switch (value) {
            case 'down':
            case 'move':
            case 'up':
                return ('mouse' + value);
            case 'click':
            case 'dblclick':
            case 'down':
            case 'move':
            case 'up':
            case 'dragbegin':
            case 'drag':
            case 'dragend':
                return value;
            default:
                throw 'Invalid MouseEventType: ' + value;
        }
    }
    function parse_button(value) {
        value = (value || '').trim().toLowerCase();
        switch (value) {
            case 'primary':
            case 'button1':
                return 0;
            case 'secondary':
            case 'button2':
                return 1;
            case 'button3':
                return 2;
            default:
                throw 'Invalid MouseButton: ' + value;
        }
    }
    function divide_expression(value) {
        var parts = value.split(':');
        if (parts.length == 1) {
            parts.splice(0, 0, 'down');
        }
        return parts.slice(0, 2);
    }
    var MouseExpression = (function () {
        function MouseExpression(cfg) {
            this.event = null;
            this.button = null;
            this.keys = [];
            this.exclusive = false;
            _.extend(this, cfg);
        }
        MouseExpression.parse = function (input) {
            var cfg = {
                keys: [],
            };
            cfg.exclusive = input[0] === '!';
            if (cfg.exclusive) {
                input = input.substr(1);
            }
            var _a = divide_expression(input), left = _a[0], right = _a[1];
            cfg.event = parse_event(left);
            right.split(/[\s\-\+]+/)
                .forEach(function (x) {
                var key = Keys_1.Keys.parse(x, false);
                if (key !== null) {
                    cfg.keys.push(key);
                }
                else {
                    cfg.button = parse_button(x);
                }
            });
            return new MouseExpression(cfg);
        };
        MouseExpression.prototype.matches = function (mouseData) {
            if (this.event !== mouseData.type)
                return false;
            if (this.button !== null && this.button !== mouseData.button)
                return false;
            for (var _i = 0, _a = this.keys; _i < _a.length; _i++) {
                var k = _a[_i];
                if (!KeyCheck_1.KeyCheck.down(k))
                    return false;
            }
            return true;
        };
        return MouseExpression;
    }());
    exports.MouseExpression = MouseExpression;
});
//# sourceMappingURL=MouseExpression.js.map