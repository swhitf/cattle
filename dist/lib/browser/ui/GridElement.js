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
define(["require", "exports", "../misc/Polyfill", "../geom/Padding", "../model/default/DefaultGridModel", "./internal/EventEmitter", "./GridKernel", "../model/GridRange", "./internal/GridLayout", "../geom/Rect", "../geom/Point", "../misc/Property", "../misc/Util"], function (require, exports, Polyfill_1, Padding_1, DefaultGridModel_1, EventEmitter_1, GridKernel_1, GridRange_1, GridLayout_1, Rect_1, Point_1, Property_1, _) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var GridElement = (function (_super) {
        __extends(GridElement, _super);
        function GridElement(canvas) {
            var _this = _super.call(this) || this;
            _this.canvas = canvas;
            _this.dirty = false;
            _this.buffers = {};
            _this.visuals = {};
            _this.root = canvas;
            _this.container = canvas.parentElement;
            var kernel = _this.kernel = new GridKernel_1.GridKernel(_this.emit.bind(_this));
            ['mousedown', 'mousemove', 'mouseup', 'mouseenter', 'mouseleave', 'mousewheel', 'click', 'dblclick', 'dragbegin', 'drag', 'dragend']
                .forEach(function (x) { return _this.forwardMouseEvent(x); });
            ['keydown', 'keypress', 'keyup']
                .forEach(function (x) { return _this.forwardKeyEvent(x); });
            _this.enableEnterExitEvents();
            return _this;
        }
        GridElement.create = function (target, initialModel) {
            var parent = target.parentElement;
            var canvas = target.ownerDocument.createElement('canvas');
            canvas.id = target.id;
            canvas.className = target.className;
            canvas.tabIndex = target.tabIndex || 0;
            target.id = null;
            parent.insertBefore(canvas, target);
            parent.removeChild(target);
            if (!parent.style.position || parent.style.position === 'static') {
                parent.style.position = 'relative';
            }
            var grid = new GridElement(canvas);
            grid.model = initialModel || DefaultGridModel_1.DefaultGridModel.dim(26, 100);
            grid.bash();
            return grid;
        };
        Object.defineProperty(GridElement.prototype, "width", {
            get: function () {
                return this.root.clientWidth;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "height", {
            get: function () {
                return this.root.clientHeight;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "modelWidth", {
            get: function () {
                return this.layout.columns.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "modelHeight", {
            get: function () {
                return this.layout.rows.length;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "virtualWidth", {
            get: function () {
                return this.layout.width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "virtualHeight", {
            get: function () {
                return this.layout.height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "scrollLeft", {
            get: function () {
                return this.scroll.x;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(GridElement.prototype, "scrollTop", {
            get: function () {
                return this.scroll.y;
            },
            enumerable: true,
            configurable: true
        });
        GridElement.prototype.extend = function (ext) {
            if (typeof (ext) === 'function') {
                ext(this, this.kernel);
            }
            else {
                this.kernel.install(ext);
                if (ext.init) {
                    ext.init(this, this.kernel);
                }
            }
            return this;
        };
        GridElement.prototype.exec = function (command) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            (_a = this.kernel.commands).exec.apply(_a, [command].concat(args));
            var _a;
        };
        GridElement.prototype.get = function (variable) {
            this.kernel.variables.get(variable);
        };
        GridElement.prototype.set = function (variable, value) {
            this.kernel.variables.set(variable, value);
        };
        GridElement.prototype.mergeInterface = function () {
            this.kernel.exportInterface(this);
            return this;
        };
        GridElement.prototype.focus = function () {
            this.root.focus();
        };
        GridElement.prototype.getCellAtGridPoint = function (pt) {
            var refs = this.layout.captureCells(new Rect_1.Rect(pt.x, pt.y, 1, 1));
            if (refs.length) {
                return this.model.findCell(refs[0]);
            }
            return null;
        };
        GridElement.prototype.getCellAtViewPoint = function (pt) {
            var viewport = this.computeViewport();
            var gpt = Point_1.Point.create(pt).add(viewport.topLeft());
            return this.getCellAtGridPoint(gpt);
        };
        GridElement.prototype.getCellsInGridRect = function (rect) {
            var _this = this;
            var refs = this.layout.captureCells(rect);
            return refs.map(function (x) { return _this.model.findCell(x); });
        };
        GridElement.prototype.getCellsInViewRect = function (rect) {
            var viewport = this.computeViewport();
            var grt = Rect_1.Rect.fromLike(rect).offset(viewport.topLeft());
            return this.getCellsInGridRect(grt);
        };
        GridElement.prototype.getCellGridRect = function (ref) {
            var region = this.layout.queryCell(ref);
            return !!region ? Rect_1.Rect.fromLike(region) : null;
        };
        GridElement.prototype.getCellViewRect = function (ref) {
            var rect = this.getCellGridRect(ref);
            if (rect) {
                rect = rect.offset(this.scroll.inverse());
            }
            return rect;
        };
        GridElement.prototype.scrollTo = function (ptOrRect) {
            var dest;
            if (ptOrRect['width'] === undefined && ptOrRect['height'] === undefined) {
                dest = new Rect_1.Rect(ptOrRect['x'], ptOrRect['y'], 1, 1);
            }
            else {
                dest = Rect_1.Rect.fromLike(ptOrRect);
            }
            var newScroll = {
                x: this.scroll.x,
                y: this.scroll.y,
            };
            if (dest.left < 0) {
                newScroll.x += dest.left;
            }
            if (dest.right > this.width) {
                newScroll.x += dest.right - this.width;
            }
            if (dest.top < 0) {
                newScroll.y += dest.top;
            }
            if (dest.bottom > this.height) {
                newScroll.y += dest.bottom - this.height;
            }
            if (!this.scroll.equals(newScroll)) {
                this.scroll = Point_1.Point.create(newScroll);
            }
        };
        GridElement.prototype.bash = function () {
            this.root.width = this.root.parentElement.clientWidth;
            this.root.height = this.root.parentElement.clientHeight;
            this.emit('bash');
            this.invalidate();
        };
        GridElement.prototype.invalidate = function (query) {
            if (query === void 0) { query = null; }
            console.time('GridElement.invalidate');
            this.layout = GridLayout_1.GridLayout.compute(this.model, this.padding);
            if (!!query) {
                var range = GridRange_1.GridRange.select(this.model, query);
                for (var _i = 0, _a = range.ltr; _i < _a.length; _i++) {
                    var cell = _a[_i];
                    delete cell['__dirty'];
                    delete this.buffers[cell.ref];
                }
            }
            else {
                this.buffers = {};
                this.model.cells.forEach(function (x) { return delete x['__dirty']; });
            }
            console.timeEnd('GridElement.invalidate');
            this.redraw();
            this.emit('invalidate');
        };
        GridElement.prototype.redraw = function (forceImmediate) {
            if (forceImmediate === void 0) { forceImmediate = false; }
            if (!this.dirty) {
                this.dirty = true;
                console.time("GridElement.redraw(force=" + forceImmediate + ")");
                if (forceImmediate) {
                    this.draw(forceImmediate);
                }
                else {
                    requestAnimationFrame(this.draw.bind(this, forceImmediate));
                }
            }
        };
        GridElement.prototype.draw = function (forced) {
            if (!this.dirty)
                return;
            this.updateVisuals();
            this.drawVisuals();
            this.dirty = false;
            console.timeEnd("GridElement.redraw(force=" + forced + ")");
            this.emit('draw');
        };
        GridElement.prototype.computeViewFragments = function () {
            var _a = this, freezeMargin = _a.freezeMargin, layout = _a.layout;
            var make = function (l, t, w, h, ol, ot) { return ({
                left: l,
                top: t,
                width: w,
                height: h,
                offsetLeft: ol,
                offsetTop: ot,
            }); };
            var viewport = this.computeViewport();
            if (freezeMargin.equals(Point_1.Point.empty)) {
                return [make(viewport.left, viewport.top, viewport.width, viewport.height, 0, 0)];
            }
            else {
                var marginLeft = layout.queryColumnRange(0, freezeMargin.x).width;
                var marginTop = layout.queryRowRange(0, freezeMargin.y).height;
                var margin = new Point_1.Point(marginLeft, marginTop);
                //Aliases to prevent massive lines;
                var vp = viewport;
                var mg = margin;
                return [
                    make(vp.left + mg.x, vp.top + mg.y, vp.width - mg.x, vp.height - mg.y, mg.x, mg.y),
                    make(0, vp.top + mg.y, mg.x, vp.height - mg.y, 0, mg.y),
                    make(vp.left + mg.x, 0, vp.width - mg.x, mg.y, mg.x, 0),
                    make(0, 0, mg.x, mg.y, 0, 0),
                ];
            }
        };
        GridElement.prototype.computeViewport = function () {
            return new Rect_1.Rect(Math.floor(this.scrollLeft), Math.floor(this.scrollTop), this.canvas.width, this.canvas.height);
        };
        GridElement.prototype.updateVisuals = function () {
            console.time('GridElement.updateVisuals');
            var _a = this, model = _a.model, layout = _a.layout;
            var fragments = this.computeViewFragments();
            var prevFrame = this.frame;
            var nextFrame = [];
            //If the fragments have changed, nerf the prevFrame since we don't want to recycle anything.
            if (!prevFrame || prevFrame.length != fragments.length) {
                prevFrame = [];
            }
            for (var i = 0; i < fragments.length; i++) {
                var prevAspect = prevFrame[i];
                var aspect = {
                    view: fragments[i],
                    visuals: {},
                };
                var viewCells = layout.captureCells(aspect.view)
                    .map(function (ref) { return model.findCell(ref); });
                for (var _i = 0, viewCells_1 = viewCells; _i < viewCells_1.length; _i++) {
                    var cell = viewCells_1[_i];
                    var region = layout.queryCell(cell.ref);
                    var visual = !!prevAspect ? prevAspect.visuals[cell.ref] : null;
                    // If we didn't have a previous visual or if the cell was dirty, create new visual
                    if (!visual || cell.value !== visual.value || cell['__dirty'] !== false) {
                        aspect.visuals[cell.ref] = this.createVisual(cell, region);
                        delete this.buffers[cell.ref];
                        cell['__dirty'] = false;
                    }
                    else {
                        aspect.visuals[cell.ref] = visual;
                    }
                }
                nextFrame.push(aspect);
            }
            this.frame = nextFrame;
            console.timeEnd('GridElement.updateVisuals');
        };
        GridElement.prototype.drawVisuals = function () {
            var _a = this, canvas = _a.canvas, model = _a.model, frame = _a.frame;
            console.time('GridElement.drawVisuals');
            var gfx = canvas.getContext('2d', { alpha: true });
            gfx.clearRect(0, 0, canvas.width, canvas.height);
            for (var _i = 0, frame_1 = frame; _i < frame_1.length; _i++) {
                var aspect = frame_1[_i];
                var view = Rect_1.Rect.fromLike(aspect.view);
                gfx.save();
                gfx.translate(aspect.view.offsetLeft, aspect.view.offsetTop);
                gfx.translate(aspect.view.left * -1, aspect.view.top * -1);
                for (var cr in aspect.visuals) {
                    var cell = model.findCell(cr);
                    var visual = aspect.visuals[cr];
                    if (visual.width == 0 || visual.height == 0) {
                        continue;
                    }
                    if (!view.intersects(visual)) {
                        continue;
                    }
                    var buffer = this.buffers[cell.ref];
                    if (!buffer) {
                        buffer = this.buffers[cell.ref] = this.createBuffer(visual.width, visual.height);
                        //noinspection TypeScriptUnresolvedFunction
                        var renderer = Reflect.getMetadata('custom:renderer', cell.constructor);
                        renderer(buffer.gfx, visual, cell);
                    }
                    gfx.drawImage(buffer.canvas, visual.left - buffer.inflation, visual.top - buffer.inflation);
                }
                gfx.restore();
            }
            console.timeEnd('GridElement.drawVisuals');
        };
        GridElement.prototype.createBuffer = function (width, height) {
            return new Buffer(width, height, 0);
        };
        GridElement.prototype.createVisual = function (cell, region) {
            var visual = new Visual(cell.ref, cell.value, region.left, region.top, region.width, region.height);
            var props = (Reflect.getMetadata('grid:visualize', cell.constructor.prototype) || []);
            for (var _i = 0, props_1 = props; _i < props_1.length; _i++) {
                var p = props_1[_i];
                if (visual[p] === undefined) {
                    visual[p] = clone(cell[p]);
                }
                else {
                    console.error("Illegal visualized property name " + p + " on type " + cell.constructor.name + ".");
                }
            }
            return visual;
        };
        GridElement.prototype.forwardMouseEvent = function (event) {
            var _this = this;
            this.canvas.addEventListener(event, function (ne) {
                var pt = new Point_1.Point(ne.offsetX, ne.offsetY);
                var cell = _this.getCellAtViewPoint(pt);
                var ge = ne;
                ge.cell = cell || null;
                ge.gridX = pt.x;
                ge.gridY = pt.y;
                _this.emit(event, ge);
            });
        };
        GridElement.prototype.forwardKeyEvent = function (event) {
            var _this = this;
            this.canvas.addEventListener(event, function (ne) {
                _this.emit(event, ne);
            });
        };
        GridElement.prototype.enableEnterExitEvents = function () {
            var _this = this;
            this.on('mousemove', function (e) {
                if (e.cell != _this.hotCell) {
                    if (_this.hotCell) {
                        var newEvt = _this.createGridMouseEvent('cellexit', e);
                        newEvt.cell = _this.hotCell;
                        _this.emit('cellexit', newEvt);
                    }
                    _this.hotCell = e.cell;
                    if (_this.hotCell) {
                        var newEvt = _this.createGridMouseEvent('cellenter', e);
                        newEvt.cell = _this.hotCell;
                        _this.emit('cellenter', newEvt);
                    }
                }
            });
        };
        GridElement.prototype.createGridMouseEvent = function (type, source) {
            var event = (Polyfill_1.ie_safe_create_mouse_event(type, source));
            event.cell = source.cell;
            event.gridX = source.gridX;
            event.gridY = source.gridY;
            return event;
        };
        return GridElement;
    }(EventEmitter_1.EventEmitterBase));
    __decorate([
        Property_1.property(DefaultGridModel_1.DefaultGridModel.empty(), function (t) { t.emit('load', t.model); t.invalidate(); }),
        __metadata("design:type", Object)
    ], GridElement.prototype, "model", void 0);
    __decorate([
        Property_1.property(new Point_1.Point(0, 0), function (t) { return t.invalidate(); }),
        __metadata("design:type", Point_1.Point)
    ], GridElement.prototype, "freezeMargin", void 0);
    __decorate([
        Property_1.property(Padding_1.Padding.empty, function (t) { return t.invalidate(); }),
        __metadata("design:type", Padding_1.Padding)
    ], GridElement.prototype, "padding", void 0);
    __decorate([
        Property_1.property(Point_1.Point.empty, function (t) { t.redraw(); t.emit('scroll'); }),
        __metadata("design:type", Point_1.Point)
    ], GridElement.prototype, "scroll", void 0);
    exports.GridElement = GridElement;
    function clone(x) {
        if (Array.isArray(x)) {
            return x.map(clone);
        }
        else {
            return _.shadowClone(x);
        }
    }
    var Buffer = (function () {
        function Buffer(width, height, inflation) {
            this.width = width;
            this.height = height;
            this.inflation = inflation;
            this.canvas = document.createElement('canvas');
            this.canvas.width = width + (inflation * 2);
            this.canvas.height = height + (inflation * 2);
            this.gfx = this.canvas.getContext('2d', { alpha: false });
            this.gfx.translate(inflation, inflation);
        }
        return Buffer;
    }());
    var Visual = (function () {
        function Visual(ref, value, left, top, width, height) {
            this.ref = ref;
            this.value = value;
            this.left = left;
            this.top = top;
            this.width = width;
            this.height = height;
        }
        Visual.prototype.equals = function (another) {
            for (var prop in this) {
                if (this[prop] !== another[prop]) {
                    return false;
                }
            }
            return true;
        };
        return Visual;
    }());
});
//# sourceMappingURL=GridElement.js.map