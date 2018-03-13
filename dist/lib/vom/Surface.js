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
var DragHelper_1 = require("./input/DragHelper");
var Event_1 = require("../base/Event");
var Observable_1 = require("../base/Observable");
var SimpleEventEmitter_1 = require("../base/SimpleEventEmitter");
var Matrix_1 = require("../geom/Matrix");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var BufferManager_1 = require("./BufferManager");
var VisualKeyboardEvent_1 = require("./events/VisualKeyboardEvent");
var VisualMouseDragEvent_1 = require("./events/VisualMouseDragEvent");
var VisualMouseEvent_1 = require("./events/VisualMouseEvent");
var InternalCameraManager_1 = require("./InternalCameraManager");
var RefreshLoop_1 = require("./RefreshLoop");
var RootVisual_1 = require("./RootVisual");
var DefaultTheme_1 = require("./styling/DefaultTheme");
var Theme_1 = require("./styling/Theme");
var VisualSequence_1 = require("./VisualSequence");
var VisualTracker_1 = require("./VisualTracker");
var u = require("../misc/Util");
var vq = require("./VisualQuery");
var Modifiers_1 = require("./input/Modifiers");
/**
 * Event List:
 *
 * keydown
 * keymove
 * keyup
 * mousedown
 * mousemove
 * mouseup
 * change
 * compose
 * scroll
 * render
 *
 */
var Surface = /** @class */ (function (_super) {
    __extends(Surface, _super);
    function Surface(width, height) {
        if (width === void 0) { width = 800; }
        if (height === void 0) { height = 800; }
        var _this = _super.call(this) || this;
        _this.width = width;
        _this.height = height;
        _this.root = _this.createRoot();
        _this.view = _this.createView();
        _this.cameras = _this.createCameraManager();
        _this.buffers = _this.createBufferManager();
        _this.sequence = new VisualSequence_1.VisualSequence(_this.root);
        _this.tracker = new VisualTracker_1.VisualTracker();
        _this.theme = new DefaultTheme_1.DefaultTheme();
        _this.ticker = new RefreshLoop_1.RefreshLoop(60);
        _this.ticker.add(function () { return _this.render(); });
        _this.ticker.start();
        return _this;
    }
    Object.defineProperty(Surface.prototype, "renderRequired", {
        get: function () {
            return this.dirtyRender || this.dirtySequence;
        },
        enumerable: true,
        configurable: true
    });
    Surface.prototype.render = function () {
        var didRender = false;
        if (this.dirtySequence) {
            this.sequence.update();
            this.dirtyRender = true;
        }
        if (this.dirtyRender) {
            this.performRender();
            didRender = true;
        }
        this.dirtyRender = this.dirtySequence = false;
        if (didRender) {
            this.propagateEvent(new Event_1.Event('render'), []);
        }
    };
    Surface.prototype.query = function (selector) {
        return vq.select(this.sequence.all, selector);
    };
    Surface.prototype.test = function (surfacePt, filter) {
        filter = filter || (function (x) { return true; });
        var collected = [];
        this.sequence.dive(function (visual) {
            if (visual.absoluteBounds.contains(surfacePt)) {
                if (filter(visual)) {
                    collected.push(visual);
                }
            }
            return true;
        });
        return collected;
    };
    Surface.prototype.performRender = function () {
        var _a = this, buffers = _a.buffers, sequence = _a.sequence, view = _a.view;
        //Only render to cameras with valid bounds
        var cameras = this.cameras.toArray()
            .filter(function (x) { return !!x.bounds.width && !!x.bounds.height; });
        buffers.beginRender();
        sequence.climb(function (visual) {
            var visBuf = buffers.getFor('visual', visual);
            var visGfx = visBuf.getContext('2d');
            visGfx.clearRect(0, 0, visBuf.width, visBuf.height);
            set_transform(visGfx, Matrix_1.Matrix.identity.translate(5, 5));
            visual.render(visGfx);
            for (var _i = 0, cameras_1 = cameras; _i < cameras_1.length; _i++) {
                var cam = cameras_1[_i];
                if (!cam.bounds.width || !cam.bounds.height)
                    continue;
                var camBuf = buffers.getFor('camera', cam);
                var camGfx = camBuf.getContext('2d');
                var camMat = Matrix_1.Matrix.identity.translate(cam.vector.x, cam.vector.y).inverse();
                var cvt = visual.transform.translate(-5, -5).multiply(camMat); //camera+visual transform
                camGfx.setTransform(cvt.a, cvt.b, cvt.c, cvt.d, cvt.e, cvt.f);
                camGfx.drawImage(visBuf, 0, 0, visBuf.width, visBuf.height, 0, 0, visBuf.width, visBuf.height);
            }
            return true;
        });
        var viewGfx = view.getContext('2d');
        set_transform(viewGfx, Matrix_1.Matrix.identity);
        viewGfx.clearRect(0, 0, view.width, view.height);
        for (var _i = 0, cameras_2 = cameras; _i < cameras_2.length; _i++) {
            var cam = cameras_2[_i];
            var camBuf = buffers.getFor('camera', cam);
            var camGfx = camBuf.getContext('2d');
            set_transform(camGfx, Matrix_1.Matrix.identity);
            camGfx.fillStyle = 'red';
            camGfx.fillText('Cam ' + cam.id, 3, 12);
            set_transform(viewGfx, Matrix_1.Matrix.identity.translate(cam.bounds.left, cam.bounds.top));
            viewGfx.drawImage(camBuf, 0, 0, camBuf.width, camBuf.height, 0, 0, camBuf.width, camBuf.height);
        }
        buffers.endRender();
    };
    Surface.prototype.createCameraManager = function () {
        var _this = this;
        var cm = new InternalCameraManager_1.InternalCameraManager();
        cm.create('main', 1, new Rect_1.Rect(0, 0, this.width, this.height), Point_1.Point.empty);
        // cm.create('main2', 2, new Rect(this.width / 2, 0, this.width / 2, this.height / 2), Point.empty);
        // cm.create('main3', 3, new Rect(0, this.height / 2, this.width / 2, this.height / 2), Point.empty);
        // cm.create('main4', 4, new Rect(this.width / 2, this.height / 2, this.width / 2, this.height / 2), Point.empty);
        var callback = function () { return _this.dirtyRender = true; };
        cm.on('create', callback);
        cm.on('destroy', callback);
        cm.on('change', callback);
        return cm;
    };
    Surface.prototype.createBufferManager = function () {
        var bm = new BufferManager_1.BufferManager();
        bm.configure('visual', {
            identify: function (v) { return v.id; },
            measure: function (v) { return v.size.add(10); },
        });
        bm.configure('camera', {
            identify: function (c) { return c.id; },
            measure: function (c) { return new Point_1.Point(c.bounds.width, c.bounds.height); },
        });
        return bm;
    };
    Surface.prototype.createRoot = function () {
        var root = new RootVisual_1.RootVisual(this);
        root.on('compose', this.onVisualCompose.bind(this));
        root.on('change', this.onVisualChange.bind(this));
        return root;
    };
    Surface.prototype.createView = function () {
        var _this = this;
        var view = document.createElement('canvas');
        view.width = this.width;
        view.height = this.height;
        view.tabIndex = -1;
        view.addEventListener('mousedown', this.onViewMouseEvent.bind(this, 'mousedown'));
        view.addEventListener('mousemove', this.onViewMouseEvent.bind(this, 'mousemove'));
        view.addEventListener('mouseup', this.onViewMouseEvent.bind(this, 'mouseup'));
        view.addEventListener('click', this.onViewMouseEvent.bind(this, 'click'));
        view.addEventListener('dblclick', this.onViewMouseEvent.bind(this, 'dblclick'));
        view.addEventListener('keydown', this.onViewKeyEvent.bind(this, 'keydown'));
        view.addEventListener('keypress', this.onViewKeyEvent.bind(this, 'keypress'));
        view.addEventListener('keyup', this.onViewKeyEvent.bind(this, 'keyup'));
        var dragSupport = new DragHelper_1.DragHelper(view, function (me, distance) { return _this.onViewMouseDragEvent(me, distance); });
        return view;
    };
    Surface.prototype.applyTheme = function (theme, visuals) {
        if (visuals === void 0) { visuals = null; }
        visuals = visuals || this.sequence.all;
        for (var _i = 0, visuals_1 = visuals; _i < visuals_1.length; _i++) {
            var v = visuals_1[_i];
            delete v['__style'];
        }
        for (var _a = 0, _b = theme.styles; _a < _b.length; _a++) {
            var style = _b[_a];
            var results = vq.select(visuals, style.selector);
            for (var _c = 0, results_1 = results; _c < results_1.length; _c++) {
                var v = results_1[_c];
                var visualStyle = v['__style'] || (v['__style'] = {});
                for (var key in style.props) {
                    if (!Reflect.getMetadata("cattle:styleable:" + key, v)) {
                        throw key + " is not styleable on visual type " + v.type + ".";
                    }
                    visualStyle[key] = style.props[key];
                }
                visualStyle = u.extend(visualStyle, style.props);
            }
        }
    };
    Surface.prototype.notifyChange = function (property) {
        switch (property) {
            case 'width':
            case 'height':
                if (this.view) {
                    this.view.width = this.width;
                    this.view.height = this.height;
                    this.dirtyRender = true;
                    this.propagateEvent(new Event_1.Event('resize'), []);
                }
                break;
            case 'theme':
                this.applyTheme(this.theme);
                this.dirtyRender = true;
                break;
        }
    };
    Surface.prototype.onViewMouseEvent = function (type, me) {
        var viewPt = new Point_1.Point(me.clientX, me.clientY).subtract(cumulative_offset(this.view));
        var camera = this.cameras.test(viewPt);
        if (!camera)
            return;
        var modifiers = Modifiers_1.Modifiers.create(me);
        var surfacePt = camera.toSurfacePoint('view', viewPt);
        var stack = this.test(surfacePt);
        var hoverVisual = this.tracker.get('hover');
        if (stack[0] != hoverVisual) {
            if (hoverVisual) {
                var evt_1 = new VisualMouseEvent_1.VisualMouseEvent('mouseleave', hoverVisual, camera, surfacePt, me.button, modifiers);
                this.propagateEvent(evt_1, [hoverVisual]);
            }
            this.tracker.set('hover', hoverVisual = stack[0] || null);
            if (hoverVisual) {
                var evt_2 = new VisualMouseEvent_1.VisualMouseEvent('mouseenter', hoverVisual, camera, surfacePt, me.button, modifiers);
                this.propagateEvent(evt_2, [hoverVisual]);
            }
        }
        var evt = new VisualMouseEvent_1.VisualMouseEvent(type, stack[0] || null, camera, surfacePt, me.button, modifiers);
        this.propagateEvent(evt, stack);
    };
    Surface.prototype.onViewMouseDragEvent = function (me, distance) {
        var viewPt = new Point_1.Point(me.clientX, me.clientY).subtract(cumulative_offset(this.view));
        var camera = this.cameras.test(viewPt);
        if (!camera)
            return;
        var modifiers = Modifiers_1.Modifiers.create(me);
        var surfacePt = camera.toSurfacePoint('view', viewPt);
        var stack = this.test(surfacePt);
        var evt = new VisualMouseDragEvent_1.VisualMouseDragEvent(stack[0] || null, camera, surfacePt, me.button, modifiers, distance);
        this.propagateEvent(evt, stack);
    };
    Surface.prototype.onViewKeyEvent = function (type, ke) {
        //ke.preventDefault();
        var key = ke.keyCode;
        var char = !!ke.which ? String.fromCharCode(ke.which) : null;
        var modifiers = Modifiers_1.Modifiers.create(ke);
        var stack = [];
        var hoverVisual = this.tracker.get('hover');
        var x = hoverVisual;
        while (!!x) {
            stack.push(x);
            x = x.parent;
        }
        var evt = new VisualKeyboardEvent_1.VisualKeyboardEvent(type, hoverVisual || null, key, char, modifiers);
        this.propagateEvent(evt, stack);
    };
    Surface.prototype.onVisualCompose = function (e) {
        this.dirtyRender = true;
        this.dirtySequence = true;
        this.sequence.invalidate(e.target);
        var visuals = [e.target].concat(e.target.toArray(true));
        this.applyTheme(this.theme, visuals);
    };
    Surface.prototype.onVisualChange = function (e) {
        this.dirtyRender = true;
        if (e.property == 'classes' || e.property == 'traits') {
            var visuals = [e.target].concat(e.target.toArray(true));
            this.applyTheme(this.theme, visuals);
        }
    };
    Surface.prototype.propagateEvent = function (se, stack) {
        this.emit(se);
        for (var i = 0; i < stack.length; i++) {
            if (se.canceled)
                break;
            var visual = stack[i];
            if (se.canceled)
                break;
            visual.emit(se);
        }
    };
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Number)
    ], Surface.prototype, "width", void 0);
    __decorate([
        Observable_1.Observable(),
        __metadata("design:type", Number)
    ], Surface.prototype, "height", void 0);
    __decorate([
        Observable_1.Observable(new DefaultTheme_1.DefaultTheme()),
        __metadata("design:type", Theme_1.Theme)
    ], Surface.prototype, "theme", void 0);
    return Surface;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.Surface = Surface;
function clamp(value) {
    return Math.round(value * 100) / 100;
}
function cumulative_offset(element) {
    var top = 0, left = 0;
    do {
        left += element.offsetLeft || 0;
        top += element.offsetTop || 0;
        element = element.offsetParent;
    } while (element);
    return new Point_1.Point(left, top);
}
;
function set_transform(gfx, mt) {
    gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
}
//# sourceMappingURL=Surface.js.map