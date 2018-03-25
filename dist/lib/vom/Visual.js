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
var SimpleEventEmitter_1 = require("../base/SimpleEventEmitter");
var Matrix_1 = require("../geom/Matrix");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var VisualChangeEvent_1 = require("./events/VisualChangeEvent");
var VisualEvent_1 = require("./events/VisualEvent");
var Animate_1 = require("./styling/Animate");
var Styleable_1 = require("./styling/Styleable");
var IdSeed = Math.floor(Math.random() * (new Date().getTime() / 1000));
var Visual = /** @class */ (function (_super) {
    __extends(Visual, _super);
    function Visual(bounds, children) {
        if (bounds === void 0) { bounds = Rect_1.Rect.empty; }
        if (children === void 0) { children = []; }
        var _this = _super.call(this) || this;
        _this.id = 'v' + (IdSeed++);
        _this.children = [];
        _this.cacheData = {};
        _this.storeData = {};
        _this.classes = new VisualTagSetImpl(_this, 'classes');
        _this.traits = new VisualTagSetImpl(_this, 'traits');
        _this.topLeft = bounds.topLeft();
        _this.size = bounds.size();
        if (children && children.length) {
            _this.mount.apply(_this, children);
        }
        return _this;
    }
    Object.defineProperty(Visual.prototype, "left", {
        get: function () {
            return this.topLeft.x;
        },
        set: function (value) {
            this.topLeft = new Point_1.Point(value, this.top);
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
            return this.topLeft.y;
        },
        set: function (value) {
            this.topLeft = new Point_1.Point(this.left, value);
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
    Object.defineProperty(Visual.prototype, "width", {
        get: function () {
            return this.size.x;
        },
        set: function (value) {
            this.size = new Point_1.Point(value, this.height);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "height", {
        get: function () {
            return this.size.y;
        },
        set: function (value) {
            this.size = new Point_1.Point(this.width, value);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "center", {
        get: function () {
            return this.topLeft.add([this.width / 2, this.height / 2]);
        },
        set: function (value) {
            this.topLeft = new Point_1.Point(value.x - this.width / 2, value.y - this.width / 2);
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
    Object.defineProperty(Visual.prototype, "absoluteBounds", {
        get: function () {
            var _this = this;
            return this.cache('absolute', function () {
                var tl = _this.transform.apply(Point_1.Point.empty);
                return new Rect_1.Rect(tl.x, tl.y, _this.width, _this.height);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "transform", {
        get: function () {
            var _this = this;
            return this.cache('transform', function () {
                var t = !!_this.parent ? _this.parent.transform : Matrix_1.Matrix.identity;
                return t.translate(_this.left, _this.top);
            });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "transformLocal", {
        get: function () {
            var _this = this;
            return this.cache('transformLocal', function () { return Matrix_1.Matrix.identity.translate(_this.left, _this.top); });
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "childCount", {
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
    Object.defineProperty(Visual.prototype, "root", {
        get: function () {
            return !!this.surface ? this.surface.root : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Visual.prototype, "surface", {
        get: function () {
            return !!this.parentVisual ? this.parentVisual.surface : null;
        },
        enumerable: true,
        configurable: true
    });
    Visual.prototype.animate = function () {
        return Animate_1.Animate.visual(this);
    };
    Visual.prototype.data = function (key, value) {
        var was = this.storeData[key];
        if (arguments.length > 1) {
            if (value === undefined) {
                delete this.storeData[key];
            }
            else {
                this.storeData[key] = value;
            }
        }
        return was;
    };
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
            v.visualWillMount();
            this.children.push(v);
            v.parentVisual = this;
            v.visualDidMount();
        }
        this.notifyCompose();
    };
    Visual.prototype.unmount = function (child) {
        var idx = this.children.indexOf(child);
        if (idx < 0) {
            return false;
        }
        child.visualWillUnmount();
        this.children.splice(idx, 1);
        child.parentVisual = null;
        this.notifyCompose();
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
    Visual.prototype.toArray = function (recursive) {
        if (recursive === void 0) { recursive = false; }
        var arr = this.children.slice(0);
        if (recursive) {
            for (var _i = 0, _a = this.children; _i < _a.length; _i++) {
                var c = _a[_i];
                arr = arr.concat(c.toArray(true));
            }
        }
        return arr;
    };
    Visual.prototype.toString = function () {
        return this.constructor['name'] + " " + this.left + "x" + this.top + " " + this.width + ":" + this.height;
    };
    Visual.prototype.cache = function (key, getter) {
        if (this.cacheData[key] !== undefined) {
            return this.cacheData[key];
        }
        return (this.cacheData[key] = getter());
    };
    Visual.prototype.clearCache = function () {
        this.cacheData = {};
    };
    Visual.prototype.visualWillMount = function () {
    };
    Visual.prototype.visualDidMount = function () {
    };
    Visual.prototype.visualWillUnmount = function () {
    };
    Visual.prototype.visualStyleDidChange = function () {
    };
    Visual.prototype.notify = function (evt, bubble) {
        if (bubble === void 0) { bubble = true; }
        if (!this.isMounted())
            return;
        if (!evt.canceled) {
            this.emit(evt);
            if (bubble && this.parentVisual && !evt.canceled) {
                this.parentVisual.notify(evt, bubble);
            }
        }
    };
    Visual.prototype.notifyChange = function (property) {
        this.clearCache();
        if (property === 'zIndex' && !!this.parentVisual) {
            this.parentVisual.notifyCompose();
        }
        this.notify(new VisualChangeEvent_1.VisualChangeEvent(this, property));
    };
    Visual.prototype.notifyCompose = function () {
        this.notify(new VisualEvent_1.VisualEvent('compose', this));
    };
    __decorate([
        Styleable_1.Styleable(Point_1.Point.empty),
        __metadata("design:type", Point_1.Point)
    ], Visual.prototype, "topLeft", void 0);
    __decorate([
        Styleable_1.Styleable(Point_1.Point.empty),
        __metadata("design:type", Point_1.Point)
    ], Visual.prototype, "size", void 0);
    __decorate([
        Styleable_1.Styleable(0),
        __metadata("design:type", Number)
    ], Visual.prototype, "zIndex", void 0);
    return Visual;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.Visual = Visual;
var VisualTagSetImpl = /** @class */ (function () {
    function VisualTagSetImpl(owner, property) {
        this.owner = owner;
        this.property = property;
        this.count = 0;
        this.values = {};
    }
    Object.defineProperty(VisualTagSetImpl.prototype, "length", {
        get: function () {
            return this.values;
        },
        enumerable: true,
        configurable: true
    });
    VisualTagSetImpl.prototype.item = function (index) {
        return this.values[index];
    };
    VisualTagSetImpl.prototype.add = function (trait) {
        this.count++;
        this.values[trait] = true;
        this.owner['notifyChange'](this.property);
        return this;
    };
    VisualTagSetImpl.prototype.remove = function (trait) {
        if (this.has(trait)) {
            this.count--;
            delete this.values[trait];
            this.owner['notifyChange'](this.property);
        }
        return this;
    };
    VisualTagSetImpl.prototype.toggle = function (trait) {
        return this.set(trait, !this.has(trait));
    };
    VisualTagSetImpl.prototype.has = function (trait) {
        return !!this.values[trait];
    };
    VisualTagSetImpl.prototype.set = function (trait, value) {
        if (value) {
            return this.add(trait);
        }
        else {
            return this.remove(trait);
        }
    };
    VisualTagSetImpl.prototype.toArray = function () {
        var arr = [];
        for (var key in this.values) {
            if (this.values[key]) {
                arr.push(key);
            }
        }
        return arr;
    };
    VisualTagSetImpl.prototype.toString = function () {
        return this.toArray().join(' ');
    };
    return VisualTagSetImpl;
}());
//# sourceMappingURL=Visual.js.map