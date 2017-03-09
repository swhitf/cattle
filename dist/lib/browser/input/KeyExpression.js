define(["require", "exports", "./Keys"], function (require, exports, Keys_1) {
    "use strict";
    var KeyExpression = (function () {
        function KeyExpression(keys, exclusive) {
            this.exclusive = exclusive;
            this.ctrl = keys.some(function (x) { return x === Keys_1.Keys.CTRL; });
            this.alt = keys.some(function (x) { return x === Keys_1.Keys.ALT; });
            this.shift = keys.some(function (x) { return x === Keys_1.Keys.SHIFT; });
            this.key = keys.filter(function (x) { return x !== Keys_1.Keys.CTRL && x !== Keys_1.Keys.ALT && x !== Keys_1.Keys.SHIFT; })[0] || null;
        }
        KeyExpression.parse = function (input) {
            var exclusive = input[0] === '!';
            if (exclusive) {
                input = input.substr(1);
            }
            var keys = input
                .split(/[\s\-\+]+/)
                .map(function (x) { return Keys_1.Keys.parse(x); });
            return new KeyExpression(keys, exclusive);
        };
        KeyExpression.prototype.matches = function (keyData) {
            if (keyData instanceof KeyExpression) {
                return (this.ctrl == keyData.ctrl &&
                    this.alt == keyData.alt &&
                    this.shift == keyData.shift &&
                    this.key == keyData.key);
            }
            else if (keyData instanceof KeyboardEvent) {
                return (this.ctrl == keyData.ctrlKey &&
                    this.alt == keyData.altKey &&
                    this.shift == keyData.shiftKey &&
                    this.key == keyData.keyCode);
            }
            throw 'KeyExpression.matches: Invalid input';
        };
        return KeyExpression;
    }());
    exports.KeyExpression = KeyExpression;
});
//# sourceMappingURL=KeyExpression.js.map