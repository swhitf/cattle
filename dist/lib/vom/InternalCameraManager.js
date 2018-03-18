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
//@no-export
var SimpleEventEmitter_1 = require("../base/SimpleEventEmitter");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var CameraEvent_1 = require("./events/CameraEvent");
var InternalCamera_1 = require("./InternalCamera");
var InternalCameraManager = /** @class */ (function (_super) {
    __extends(InternalCameraManager, _super);
    function InternalCameraManager() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.array = [];
        return _this;
    }
    Object.defineProperty(InternalCameraManager.prototype, "count", {
        get: function () {
            return this.array.length;
        },
        enumerable: true,
        configurable: true
    });
    InternalCameraManager.prototype.create = function (id, order, bounds, vector) {
        order = order === undefined ? this.array.length + 1 : order;
        if (!!this.item(id)) {
            throw "Camera " + id + " already exists.";
        }
        var camera = new InternalCamera_1.InternalCamera(id, order, bounds || Rect_1.Rect.empty, vector || Point_1.Point.empty, this);
        this.array.push(camera);
        this.array.sort(function (a, b) { return a.order - b.order; });
        this.array = this.array.reverse();
        this.emit(new CameraEvent_1.CameraEvent('create', camera));
        return camera;
    };
    InternalCameraManager.prototype.destroy = function (id) {
        var idx = this.indexOf(id);
        if (idx >= 0) {
            var camera = this.array[idx];
            this.array.splice(idx, 1);
            this.emit(new CameraEvent_1.CameraEvent('destroy', camera));
        }
        else {
            throw "Invalid id: " + id;
        }
    };
    InternalCameraManager.prototype.item = function (idOrIndex) {
        return (this.array[idOrIndex] ||
            this.array.filter(function (x) { return x.id == idOrIndex.toString(); })[0]);
    };
    InternalCameraManager.prototype.test = function (viewPt) {
        for (var i = this.array.length - 1; i >= 0; i--) {
            var camera = this.array[i];
            if (camera.bounds.contains(viewPt)) {
                return camera;
            }
        }
        return null;
    };
    InternalCameraManager.prototype.toArray = function () {
        return this.array.slice(0);
    };
    InternalCameraManager.prototype.indexOf = function (id) {
        for (var i = 0; i < this.array.length; i++) {
            if (this.array[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    return InternalCameraManager;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.InternalCameraManager = InternalCameraManager;
//# sourceMappingURL=InternalCameraManager.js.map