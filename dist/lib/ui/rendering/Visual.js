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
var Point_1 = require("../../geom/Point");
var Rect_1 = require("../../geom/Rect");
var EventEmitter_1 = require("../internal/EventEmitter");
var Visual = (function (_super) {
    __extends(Visual, _super);
    function Visual(bounds, children) {
        if (bounds === void 0) { bounds = Rect_1.Rect.empty; }
        if (children === void 0) { children = []; }
        var _this = _super.call(this) || this;
        _this.children = [];
        _this.cachedData = {};
        _this.data = {};
        _this.data.position = bounds.topLeft();
        _this.data.size = bounds.size();
        if (children && children.length) {
            _this.mount.apply(_this, children);
        }
        return _this;
    }
    Visual.prototype.toString = function () {
        return this.constructor['name'] + " " + this.left + "x" + this.top + " " + this.width + ":" + this.height;
    };
    Object.defineProperty(Visual.prototype, "state", {
        //endregion
        //region Framework
        get: function () {
            return this.data;
        },
        enumerable: true,
        configurable: true
    });
    Visual.prototype.cache = function (key, getter) {
        if (this.cachedData[key] !== undefined) {
            return this.cachedData[key];
        }
        return (this.cachedData[key] = getter());
    };
    Visual.prototype.get = function (stateProp) {
        return this.data[stateProp];
    };
    Visual.prototype.set = function (stateProp, value) {
        this.data[stateProp] = value;
        this.notify('invalidated', this);
    };
    Visual.prototype.update = function (mutator) {
        mutator(this.data);
        this.notify('invalidated', this);
    };
    Visual.prototype.notify = function (event, subject, clearCache) {
        if (clearCache === void 0) { clearCache = true; }
        if (clearCache) {
            this.cachedData = {};
        }
        if (this.parentVisual) {
            this.parentVisual.notify(event, subject);
        }
        this.emit(event, this);
        this.emit('changed', this);
    };
    Object.defineProperty(Visual.prototype, "left", {
        //endregion
        //region Physicality
        get: function () {
            return this.data.position.x;
        },
        set: function (value) {
            this.setPosition(value, this.top);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "right", {
        get: function () {
            return this.left + this.width;
        },
        set: function (value) {
            this.left = value - this.width;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "top", {
        get: function () {
            return this.data.position.y;
        },
        set: function (value) {
            this.setPosition(this.left, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "bottom", {
        get: function () {
            return this.top + this.height;
        },
        set: function (value) {
            this.top = value - this.height;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "z", {
        get: function () {
            return this.data.zValue;
        },
        set: function (value) {
            this.setZ(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "width", {
        get: function () {
            return this.data.size.x;
        },
        set: function (value) {
            this.setSize(value, this.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "height", {
        get: function () {
            return this.data.size.y;
        },
        set: function (value) {
            this.setSize(this.width, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "rotation", {
        get: function () {
            return this.data.rotation;
        },
        set: function (value) {
            this.setRotation(value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "center", {
        get: function () {
            return this.data.position.add([this.width / 2, this.height / 2]);
        },
        set: function (value) {
            this.setPosition(value.x - this.width / 2, value.y - this.width / 2);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "topLeft", {
        get: function () {
            return this.data.position;
        },
        set: function (value) {
            this.setPosition(value.x, value.y);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "size", {
        get: function () {
            return this.data.size;
        },
        set: function (value) {
            this.setSize(value.x, value.y);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "bounds", {
        get: function () {
            var _this = this;
            return this.cache('bounds', function () { return Rect_1.Rect.fromEdges(_this.left, _this.top, _this.right, _this.bottom); });
        },
        enumerable: true,
        configurable: true
    });
    // public localTransform():Matrix
    // {
    //     return Matrix.identity
    //         .translate(this.left, this.top)
    //         .translate(this.width / 2, this.height / 2)
    //         .rotate(this.rotation, AngleUnits.Degrees)
    //         .translate(this.width / -2, this.height / -2);
    // }
    // public transform():Matrix
    // {
    //     let m = Matrix.identity;
    //     if (!!this.parentVisual)
    //     {
    //         m = this.parentVisual.transform();
    //     }
    //     return m.multiply(this.localTransform());
    // }
    Visual.prototype.setPosition = function (x, y, silent) {
        if (silent === void 0) { silent = false; }
        this.data.position = new Point_1.Point(x, y);
        this.data.auto = null;
        if (!silent) {
            this.notify('invalidated', this);
        }
    };
    Visual.prototype.setSize = function (w, h, silent) {
        if (silent === void 0) { silent = false; }
        this.data.size = new Point_1.Point(w, h);
        this.data.auto = null;
        if (!silent) {
            this.notify('invalidated', this);
        }
    };
    Visual.prototype.setRotation = function (rotation, silent) {
        if (silent === void 0) { silent = false; }
        this.data.rotation = rotation;
        this.data.auto = null;
        if (!silent) {
            this.notify('invalidated', this);
        }
    };
    Visual.prototype.setZ = function (z, silent) {
        if (silent === void 0) { silent = false; }
        this.data.zValue = z;
        if (!silent && !!this.parentVisual) {
            this.notify('arranged', this);
        }
    };
    Object.defineProperty(Visual.prototype, "childCount", {
        //endregion
        //region Composition
        get: function () {
            return this.children.length;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "parent", {
        get: function () {
            return this.parentVisual;
        },
        enumerable: true,
        configurable: true
    });
    Visual.prototype.isMounted = function () {
        return !!this.parentVisual ? this.parentVisual.isMounted() : false;
    };
    Visual.prototype.mount = function () {
        var visuals = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            visuals[_i] = arguments[_i];
        }
        if (visuals.some(function (x) { return !!x.parentVisual; })) {
            throw "One or more visuals is already mounted somewhere else.";
        }
        for (var _a = 0, visuals_1 = visuals; _a < visuals_1.length; _a++) {
            var v = visuals_1[_a];
            this.children.push(v);
            v.parentVisual = this;
        }
        this.notify('arranged', this);
    };
    Visual.prototype.unmount = function (child) {
        var idx = this.children.indexOf(child);
        if (idx < 0) {
            return false;
        }
        this.children.splice(idx, 1);
        child.parentVisual = null;
        this.notify('arranged', this);
        return true;
    };
    Visual.prototype.mountTo = function (to) {
        to.mount(this);
    };
    Visual.prototype.unmountSelf = function () {
        if (this.parentVisual) {
            this.parentVisual.unmount(this);
        }
        else {
            throw 'Visual is not mounted.';
        }
    };
    Visual.prototype.toArray = function () {
        return this.children.slice(0);
    };
    return Visual;
}(EventEmitter_1.EventEmitterBase));
exports.Visual = Visual;
//# sourceMappingURL=Visual.js.map