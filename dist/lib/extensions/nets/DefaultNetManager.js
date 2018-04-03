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
var AbstractDestroyable_1 = require("../../base/AbstractDestroyable");
var Observable_1 = require("../../base/Observable");
var Rect_1 = require("../../geom/Rect");
var NetVisual_1 = require("./NetVisual");
var DefaultNetManager = /** @class */ (function () {
    function DefaultNetManager(grid) {
        this.grid = grid;
        this.list = [];
        this.lookup = {};
    }
    Object.defineProperty(DefaultNetManager.prototype, "count", {
        get: function () {
            return this.list.length;
        },
        enumerable: true,
        configurable: true
    });
    DefaultNetManager.prototype.create = function (id, type, from, to) {
        var nh = NetHandleImpl.create(this.grid, id, type, from, to);
        this.list.push(nh);
        this.lookup[id] = nh;
        return nh;
    };
    DefaultNetManager.prototype.destroy = function (id) {
        var _a = this, list = _a.list, lookup = _a.lookup;
        var net = lookup[id];
        if (net) {
            net.destroy();
            list.splice(list.indexOf(net), 1);
            delete lookup[id];
        }
        else {
            throw "Invalid id: " + id;
        }
    };
    DefaultNetManager.prototype.createPrivate = function (id, type, from, to) {
        if (!!this.lookup[id]) {
            throw "Net already exists with id of " + id + ".";
        }
        var nh = NetHandleImpl.create(this.grid, id, type, from, to);
        this.lookup[id] = nh;
        return nh;
    };
    DefaultNetManager.prototype.get = function (id) {
        return this.lookup[id] || null;
    };
    DefaultNetManager.prototype.item = function (index) {
        return this.list[index] || null;
    };
    DefaultNetManager.prototype.toArray = function (filter) {
        return this.list.filter(filter || (function (x) { return true; }));
    };
    DefaultNetManager.prototype.indexOf = function (id) {
        for (var i = 0; i < this.list.length; i++) {
            if (this.list[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    return DefaultNetManager;
}());
exports.DefaultNetManager = DefaultNetManager;
var NetHandleImpl = /** @class */ (function (_super) {
    __extends(NetHandleImpl, _super);
    function NetHandleImpl() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NetHandleImpl.create = function (grid, id, type, from, to) {
        var visual = new NetVisual_1.NetVisual();
        visual.classes.add(type);
        visual.mountTo(grid.surface.root);
        var handle = new NetHandleImpl();
        handle.id = id;
        handle.grid = grid;
        handle.visual = visual;
        handle.type = type;
        handle.move(from, to);
        return handle;
    };
    Object.defineProperty(NetHandleImpl.prototype, "bounds", {
        get: function () {
            return this.visual.absoluteBounds;
        },
        enumerable: true,
        configurable: true
    });
    NetHandleImpl.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.visual.unmountSelf();
        this.visual = null;
    };
    NetHandleImpl.prototype.move = function (from, to) {
        to = to || from;
        var _a = this, grid = _a.grid, visual = _a.visual;
        var fromRect = grid.layout.measureCell(from);
        var toRect = grid.layout.measureCell(to || from);
        var bounds = Rect_1.Rect.fromMany([fromRect, toRect]);
        visual.topLeft = bounds.topLeft();
        visual.size = bounds.size();
        this.fromRef = from;
        this.toRef = to;
    };
    NetHandleImpl.prototype.notifyChange = function (property) {
        var _a = this, grid = _a.grid, visual = _a.visual;
        if (property == 'visible') {
            if (this.visible) {
                visual.mountTo(grid.surface.root);
            }
            else {
                visual.unmountSelf();
            }
        }
    };
    __decorate([
        Observable_1.Observable(true),
        __metadata("design:type", Boolean)
    ], NetHandleImpl.prototype, "visible", void 0);
    return NetHandleImpl;
}(AbstractDestroyable_1.AbstractDestroyable));
//# sourceMappingURL=DefaultNetManager.js.map