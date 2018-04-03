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
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var Tether = /** @class */ (function () {
    function Tether() {
    }
    Tether.anchor = function (subject) {
        return new AnchorTether(subject);
    };
    Tether.dock = function (subject, to, where) {
        throw 'Not implemented';
    };
    return Tether;
}());
exports.Tether = Tether;
var GeomProps = ['topLeft', 'size', 'top', 'left', 'width', 'height'];
var AnchorTether = /** @class */ (function (_super) {
    __extends(AnchorTether, _super);
    function AnchorTether(subject) {
        var _this = _super.call(this) || this;
        _this.subject = subject;
        if (!subject.parent) {
            throw 'Cannot anchor a visual without a parent.';
        }
        _this.chain(subject.parent.on('change', _this.onTargetChange.bind(_this)));
        _this.parent = subject.parent;
        _this.origTopLeft = subject.topLeft;
        _this.origSize = subject.parent.size;
        return _this;
    }
    AnchorTether.prototype.onTargetChange = function (e) {
        if (this.parent != this.subject.parent) {
            this.destroy();
            return;
        }
        if (GeomProps.indexOf(e.property) < 0)
            return;
        this.subject.topLeft = this.origTopLeft.add(this.parent.size.subtract(this.origSize));
    };
    return AnchorTether;
}(AbstractDestroyable_1.AbstractDestroyable));
//# sourceMappingURL=Tether.js.map