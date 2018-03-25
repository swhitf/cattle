"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var CallbackDestroyable_1 = require("../../base/CallbackDestroyable");
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var MouseExpression_1 = require("./MouseExpression");
var MouseBehavior = /** @class */ (function (_super) {
    __extends(MouseBehavior, _super);
    function MouseBehavior(object) {
        var _this = _super.call(this) || this;
        _this.object = object;
        _this.predicateStack = [];
        return _this;
    }
    MouseBehavior.for = function (object) {
        return (object instanceof HTMLElement)
            ? new HTMLElementMouseBehavior(object)
            : new VisualMouseBehavior(object);
    };
    MouseBehavior.prototype.on = function (expressions, callback) {
        if (!Array.isArray(expressions)) {
            return this.on([expressions], callback);
        }
        for (var _i = 0, expressions_1 = expressions; _i < expressions_1.length; _i++) {
            var e = expressions_1[_i];
            this.chain(this.createListener(MouseExpression_1.MouseExpression.parse(e), callback, this.predicateStack[this.predicateStack.length - 1]));
        }
        return this;
    };
    MouseBehavior.prototype.when = function (predicate, configurator) {
        try {
            this.predicateStack.push(predicate);
            configurator(this);
        }
        finally {
            this.predicateStack.pop();
        }
        return this;
    };
    return MouseBehavior;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.MouseBehavior = MouseBehavior;
var VisualMouseBehavior = /** @class */ (function (_super) {
    __extends(VisualMouseBehavior, _super);
    function VisualMouseBehavior() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VisualMouseBehavior.prototype.createListener = function (me, callback, predicate) {
        var emitter = this.object;
        return emitter.on(me.event, function (evt) {
            if (!!predicate && !predicate())
                return;
            if (me.matches(evt)) {
                if (me.exclusive) {
                    evt.cancel();
                }
                callback(evt);
            }
        });
    };
    return VisualMouseBehavior;
}(MouseBehavior));
var HTMLElementMouseBehavior = /** @class */ (function (_super) {
    __extends(HTMLElementMouseBehavior, _super);
    function HTMLElementMouseBehavior() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HTMLElementMouseBehavior.prototype.createListener = function (me, callback, predicate) {
        var elmt = this.object;
        var handler = function (evt) {
            if (!!predicate && !predicate())
                return;
            if (me.matches(evt)) {
                if (me.exclusive) {
                    evt.preventDefault();
                }
                callback(evt);
            }
        };
        elmt.addEventListener(me.event, handler);
        return new CallbackDestroyable_1.CallbackDestroyable(function () { return elmt.removeEventListener(me.event, handler); });
    };
    return HTMLElementMouseBehavior;
}(MouseBehavior));
//# sourceMappingURL=MouseBehavior.js.map