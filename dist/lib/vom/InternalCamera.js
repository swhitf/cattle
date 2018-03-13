"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var CameraChangeEvent_1 = require("./events/CameraChangeEvent");
var Observable_1 = require("../base/Observable");
var Rect_1 = require("../geom/Rect");
var Point_1 = require("../geom/Point");
var InternalCamera = /** @class */ (function () {
    function InternalCamera(id, order, bounds, vector, emitter) {
        this.emitter = emitter;
        this.initializing = true;
        this.id = id;
        this.order = order;
        this.bounds = bounds;
        this.vector = vector;
        this.initializing = false;
    }
    Object.defineProperty(InternalCamera.prototype, "area", {
        get: function () {
            return new Rect_1.Rect(this.vector.x, this.vector.y, this.bounds.width, this.bounds.height);
        },
        enumerable: true,
        configurable: true
    });
    InternalCamera.prototype.toCameraPoint = function (type, pt) {
        var x = Point_1.Point.create(pt);
        if (type === 'surface') {
            return x.subtract(this.vector);
        }
        else {
            return x.subtract([this.bounds.left, this.bounds.top]);
        }
    };
    InternalCamera.prototype.toSurfacePoint = function (type, pt) {
        var x = type === 'view'
            ? this.toCameraPoint(type, pt)
            : Point_1.Point.create(pt);
        return x.add(this.vector);
    };
    InternalCamera.prototype.toViewPoint = function (type, pt) {
        var x = type === 'surface'
            ? this.toCameraPoint(type, pt)
            : Point_1.Point.create(pt);
        return x.add([this.bounds.left, this.bounds.top]);
    };
    InternalCamera.prototype.notifyChange = function (property) {
        if (!this.initializing) {
            this.emitter.emit(new CameraChangeEvent_1.CameraChangeEvent(this, property));
        }
    };
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Number)
    ], InternalCamera.prototype, "order", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Rect_1.Rect)
    ], InternalCamera.prototype, "bounds", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Point_1.Point)
    ], InternalCamera.prototype, "vector", void 0);
    return InternalCamera;
}());
exports.InternalCamera = InternalCamera;
//# sourceMappingURL=InternalCamera.js.map