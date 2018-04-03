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
var sha256 = require("tiny-sha256");
var SimpleEventEmitter_1 = require("../../base/SimpleEventEmitter");
var dom = require("../../misc/Dom");
var clipboard_1 = require("../../polyfill/clipboard");
var ClipEvent_1 = require("./ClipEvent");
var ClipboardImpl = /** @class */ (function (_super) {
    __extends(ClipboardImpl, _super);
    function ClipboardImpl() {
        var _this = _super.call(this) || this;
        dom.on(window, 'paste', _this.onWindowPaste.bind(_this));
        return _this;
    }
    ClipboardImpl.prototype.copy = function (data) {
        clipboard_1.ClipboardPolyfill.writeText(data);
        this.emit(new ClipEvent_1.ClipEvent('copy', data));
    };
    ClipboardImpl.prototype.cut = function (data) {
        clipboard_1.ClipboardPolyfill.writeText(data);
        this.pendingCutHash = sha256(data);
    };
    ClipboardImpl.prototype.onWindowPaste = function (e) {
        var text = e.clipboardData.getData('text/plain');
        if (text === null || text == undefined)
            return;
        if (this.pendingCutHash && this.pendingCutHash == sha256(text)) {
            delete this.pendingCutHash;
            this.emit(new ClipEvent_1.ClipEvent('cut', text));
        }
        else {
            this.emit(new ClipEvent_1.ClipEvent('paste', text));
        }
    };
    return ClipboardImpl;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.clipboard = new ClipboardImpl();
//# sourceMappingURL=Clipboard.js.map