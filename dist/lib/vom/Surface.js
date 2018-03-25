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
var Event_1 = require("../base/Event");
var KeyedSet_1 = require("../base/KeyedSet");
var Observable_1 = require("../base/Observable");
var SimpleEventEmitter_1 = require("../base/SimpleEventEmitter");
var Matrix_1 = require("../geom/Matrix");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var Dom_1 = require("../misc/Dom");
var VisualKeyboardEvent_1 = require("./events/VisualKeyboardEvent");
var VisualMouseDragEvent_1 = require("./events/VisualMouseDragEvent");
var VisualMouseEvent_1 = require("./events/VisualMouseEvent");
var DragHelper_1 = require("./input/DragHelper");
var Keys_1 = require("./input/Keys");
var Modifiers_1 = require("./input/Modifiers");
var InternalCameraManager_1 = require("./InternalCameraManager");
var RefreshLoop_1 = require("./RefreshLoop");
var Composition_1 = require("./rendering/Composition");
var Report_1 = require("./rendering/Report");
var RootVisual_1 = require("./RootVisual");
var Theme_1 = require("./styling/Theme");
var vq = require("./VisualQuery");
var VisualSequence_1 = require("./VisualSequence");
var VisualTracker_1 = require("./VisualTracker");
var PreventKeyList = [
    Keys_1.Keys.LEFT_ARROW,
    Keys_1.Keys.RIGHT_ARROW,
    Keys_1.Keys.UP_ARROW,
    Keys_1.Keys.DOWN_ARROW,
    Keys_1.Keys.TAB,
];
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
        _this.composition = new Composition_1.Composition();
        _this.sequence = new VisualSequence_1.VisualSequence(_this.root);
        _this.dirtyStates = new KeyedSet_1.KeyedSet(function (x) { return x.object.id; });
        _this.tracker = new VisualTracker_1.VisualTracker();
        _this.ticker = new RefreshLoop_1.RefreshLoop(60);
        _this.ticker.add('render', function () { return _this.render(); });
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
        Report_1.Report.begin();
        if (this.dirtyTheming) {
            //this.performThemeUpdates();
        }
        var didRender = false;
        if (this.dirtySequence) {
            this.sequence.update();
            this.dirtyRender = true;
        }
        if (this.dirtyRender) {
            this.performCompositionUpdates();
            didRender = true;
        }
        this.dirtyRender = this.dirtySequence = false;
        this.dirtyStates.clear();
        if (didRender) {
            Report_1.Report.complete();
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
    Surface.prototype.performThemeUpdates = function () {
        var _a = this, composition = _a.composition, sequence = _a.sequence, view = _a.view, dirtyStates = _a.dirtyStates;
        var visuals = new KeyedSet_1.KeyedSet(function (x) { return x.id; });
        dirtyStates.forEach(function (st) {
            if (st.theme) {
                visuals.addAll(st.object.toArray());
            }
        });
        this.applyTheme(this.theme, visuals.array);
    };
    Surface.prototype.performCompositionUpdates = function () {
        var cpt = Report_1.Report.time('Composition.Prepare');
        var _a = this, composition = _a.composition, sequence = _a.sequence, view = _a.view, dirtyStates = _a.dirtyStates;
        //Only render to cameras with valid bounds
        var cameras = this.cameras.toArray()
            .filter(function (x) { return !!x.bounds.width && !!x.bounds.height; });
        Report_1.Report.time('composition.beginUpdate()', function () { return composition.beginUpdate(); });
        var rootRegion = composition.root;
        rootRegion.arrange(new Rect_1.Rect(0, 0, this.width, this.height));
        var _loop_1 = function (cam) {
            var camMat = Matrix_1.Matrix.identity.translate(cam.vector.x, cam.vector.y).inverse();
            var camState = dirtyStates.get(cam.id);
            var camRegion = rootRegion.getRegion(cam.id, 0);
            camRegion.arrange(cam.bounds);
            //Rely on the knowledge that visuals will be in zIndex order, so we can get once and
            //keep until the id does not match
            var zLayer = null;
            sequence.climb(function (visual) {
                //If visual is not visible to the camera, clip out
                if (!cam.area.intersects(visual.absoluteBounds)) {
                    return true;
                }
                // if (visual.zIndex < 1) return true;
                // if (visual.classes.has('input')) return true;
                var visualState = dirtyStates.get(visual.id);
                //If no zLayer or id does not match zIndex, obtain layer
                if (!zLayer || zLayer.id != visual.zIndex.toString()) {
                    zLayer = camRegion.getRegion(visual.zIndex.toString(), visual.zIndex);
                    //If new, arrange...
                    if (zLayer.age == 0) {
                        zLayer.arrange(new Rect_1.Rect(0, 0, cam.bounds.width, cam.bounds.height));
                    }
                }
                //Obtain element for visual
                var elmt = zLayer.getElement(visual.id, visual.zIndex);
                //Update element transform if new, camera has moved or visual has moved
                if (elmt.age == 0 || (!!visualState && visualState.transform) || (!!camState && camState.transform)) {
                    var camVisMat = visual.transform.translate(-5, -5).multiply(camMat); //camera+visual transform
                    var xy = camVisMat.apply(Point_1.Point.empty);
                    elmt.arrange(new Rect_1.Rect(xy.left, xy.top, visual.width + 10, visual.height + 10));
                }
                //Update element size if new or visual has resized
                // if (elmt.age == 0 || (!!camState && camState.transform) || (!!visualState && visualState.transform))
                // {
                //     elmt.dim(visual.width + 10, visual.height + 10);
                // }
                //Finally, if our element is dirty or the visual needs redrawing, redraw
                if (elmt.dirty || (!!visualState && visualState.render)) {
                    Report_1.Report.time('Element.Draw', function () {
                        elmt.draw(function (gfx) {
                            gfx.translate(5, 5);
                            visual.render(gfx);
                        });
                    });
                }
                return true;
            });
        };
        for (var _i = 0, cameras_1 = cameras; _i < cameras_1.length; _i++) {
            var cam = cameras_1[_i];
            _loop_1(cam);
        }
        Report_1.Report.time('composition.endUpdate()', function () { return composition.endUpdate(); });
        cpt();
        var cdt = Report_1.Report.time('Composition.Draw');
        composition.render(view);
        cdt();
    };
    Surface.prototype.createCameraManager = function () {
        var _this = this;
        var cm = new InternalCameraManager_1.InternalCameraManager();
        cm.create('main', 1, new Rect_1.Rect(0, 0, this.width, this.height), Point_1.Point.empty);
        cm.on('create', function () { return _this.dirtyRender; });
        cm.on('destroy', function () { return _this.dirtyRender; });
        cm.on('change', function (e) {
            var ds = { object: e.target };
            if (e.property == 'vector' || e.property == 'bounds') {
                ds.transform = true;
            }
            // else if (e.property == 'bounds')
            // {
            //     ds.size = true;
            // }
            _this.dirtyStates.merge(ds);
            _this.dirtyRender = true;
        });
        return cm;
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
        view.style.display = 'block';
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
            }
        }
        for (var _d = 0, visuals_2 = visuals; _d < visuals_2.length; _d++) {
            var v = visuals_2[_d];
            v['visualStyleDidChange']();
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
                this.composition.invalidate();
                break;
        }
    };
    Surface.prototype.onViewMouseEvent = function (type, me) {
        var viewPt = new Point_1.Point(me.clientX, me.clientY).subtract(Dom_1.cumulativeOffset(this.view));
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
        var viewPt = new Point_1.Point(me.clientX, me.clientY).subtract(Dom_1.cumulativeOffset(this.view));
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
        if (!!~PreventKeyList.indexOf(ke.keyCode)) {
            ke.preventDefault();
        }
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
        this.dirtyTheming = true;
        this.dirtyStates.merge({ object: e.target, render: true, theme: true });
        this.sequence.invalidate(e.target);
    };
    Surface.prototype.onVisualChange = function (e) {
        var ds = { object: e.target };
        if (e.property == 'topLeft' || e.property == 'size') {
            ds.transform = true;
        }
        else if (e.property == 'classes' || e.property == 'traits') {
            ds.render = true;
            ds.theme = true;
            this.dirtyTheming = true;
        }
        else {
            ds.render = true;
        }
        this.dirtyStates.merge(ds);
        this.dirtyRender = true;
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
        Observable_1.Observable(new Theme_1.Theme('Default')),
        __metadata("design:type", Theme_1.Theme)
    ], Surface.prototype, "theme", void 0);
    return Surface;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.Surface = Surface;
function clamp(value) {
    return Math.round(value * 100) / 100;
}
function setTransform(gfx, mt) {
    gfx.setTransform(mt.a, mt.b, mt.c, mt.d, mt.e, mt.f);
}
//# sourceMappingURL=Surface.js.map