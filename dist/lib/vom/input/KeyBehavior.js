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
var KeyExpression_1 = require("./KeyExpression");
var KeyBehavior = /** @class */ (function (_super) {
    __extends(KeyBehavior, _super);
    function KeyBehavior(object) {
        var _this = _super.call(this) || this;
        _this.object = object;
        _this.predicateStack = [];
        return _this;
    }
    KeyBehavior.for = function (object) {
        return (object instanceof HTMLElement)
            ? new HTMLElementKeyBehavior(object)
            : new VisualKeyBehavior(object);
    };
    KeyBehavior.prototype.on = function (expressions, callback) {
        if (!Array.isArray(expressions)) {
            return this.on([expressions], callback);
        }
        for (var _i = 0, expressions_1 = expressions; _i < expressions_1.length; _i++) {
            var e = expressions_1[_i];
            this.chain(this.createListener(KeyExpression_1.KeyExpression.parse(e), callback, this.predicateStack[this.predicateStack.length - 1]));
        }
        return this;
    };
    KeyBehavior.prototype.when = function (predicate, configurator) {
        try {
            this.predicateStack.push(predicate);
            configurator(this);
        }
        finally {
            this.predicateStack.pop();
        }
        return this;
    };
    return KeyBehavior;
}(AbstractDestroyable_1.AbstractDestroyable));
exports.KeyBehavior = KeyBehavior;
var VisualKeyBehavior = /** @class */ (function (_super) {
    __extends(VisualKeyBehavior, _super);
    function VisualKeyBehavior() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    VisualKeyBehavior.prototype.createListener = function (ke, callback, predicate) {
        var emitter = this.object;
        return emitter.on(ke.event, function (evt) {
            if (!!predicate && !predicate())
                return;
            if (ke.matches(evt)) {
                if (ke.exclusive) {
                    evt.cancel();
                }
                callback(evt);
            }
        });
    };
    return VisualKeyBehavior;
}(KeyBehavior));
var HTMLElementKeyBehavior = /** @class */ (function (_super) {
    __extends(HTMLElementKeyBehavior, _super);
    function HTMLElementKeyBehavior() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HTMLElementKeyBehavior.prototype.createListener = function (ke, callback, predicate) {
        var elmt = this.object;
        var handler = function (evt) {
            if (!!predicate && !predicate())
                return;
            if (ke.matches(evt)) {
                if (ke.exclusive) {
                    evt.preventDefault();
                }
                callback(evt);
            }
        };
        elmt.addEventListener(ke.event, handler);
        return new CallbackDestroyable_1.CallbackDestroyable(function () { return elmt.removeEventListener(ke.event, handler); });
    };
    return HTMLElementKeyBehavior;
}(KeyBehavior));
//# sourceMappingURL=KeyBehavior.js.map