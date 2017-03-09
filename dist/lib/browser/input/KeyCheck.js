define(["require", "exports"], function (require, exports) {
    "use strict";
    var Tracker;
    var KeyCheck = (function () {
        function KeyCheck() {
        }
        KeyCheck.init = function () {
            if (!Tracker) {
                Tracker = {};
                window.addEventListener('keydown', function (e) { return Tracker[e.keyCode] = true; });
                window.addEventListener('keyup', function (e) { return Tracker[e.keyCode] = false; });
            }
        };
        KeyCheck.down = function (key) {
            return !!Tracker && !!Tracker[key];
        };
        return KeyCheck;
    }());
    exports.KeyCheck = KeyCheck;
});
//# sourceMappingURL=KeyCheck.js.map