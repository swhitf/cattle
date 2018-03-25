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
var ResizeObserver = require("resize-observer-polyfill");
var AbstractDestroyable_1 = require("../base/AbstractDestroyable");
var Burden_1 = require("../base/Burden");
var Observable_1 = require("../base/Observable");
var SimpleEventEmitter_1 = require("../base/SimpleEventEmitter");
var ClipboardExtension_1 = require("../extensions/clipboard/ClipboardExtension");
var EditingExtension_1 = require("../extensions/editing/EditingExtension");
var HistoryExtension_1 = require("../extensions/history/HistoryExtension");
var NetExtension_1 = require("../extensions/nets/NetExtension");
var ScrollingExtension_1 = require("../extensions/scrolling/ScrollingExtension");
var SelectorExtension_1 = require("../extensions/selector/SelectorExtension");
var Padding_1 = require("../geom/Padding");
var Point_1 = require("../geom/Point");
var Rect_1 = require("../geom/Rect");
var GridCell_1 = require("../model/GridCell");
var GridModel_1 = require("../model/GridModel");
var GoogleSheetsTheme_1 = require("../themes/GoogleSheetsTheme");
var Surface_1 = require("../vom/Surface");
var CellVisual_1 = require("./CellVisual");
var GridChangeEvent_1 = require("./events/GridChangeEvent");
var Extensibility_1 = require("./Extensibility");
var GridKernel_1 = require("./GridKernel");
var GridLayout_1 = require("./GridLayout");
var GridView_1 = require("./GridView");
var GridElement = /** @class */ (function (_super) {
    __extends(GridElement, _super);
    function GridElement(container, surface, model) {
        var _this = _super.call(this) || this;
        _this.autoBufferUpdateEnabled = true;
        _this.burden = new Burden_1.Burden();
        _this.cameraBuffers = {};
        _this.internal = {
            container: null,
            layout: null,
            surface: null,
            kernel: null,
            view: null,
        };
        _this.internal.container = container;
        _this.internal.kernel = new GridKernel_1.GridKernel(_this.emit.bind(_this));
        _this.internal.layout = GridLayout_1.GridLayout.empty;
        _this.internal.surface = surface;
        _this.internal.view = new GridView_1.GridView(_this.layout, _this.surface);
        _this.initCameras();
        _this.initSurface();
        //Do this last to kick everything in...
        _this.model = model;
        _this.burden.add(enableAutoResize(container, surface));
        _this.burden.add(function () { return surface.destroy(); });
        _this.burden.add(function () {
            _this.cameraBuffers = null;
            _this.internal = null;
            _this.model = null;
        });
        return _this;
    }
    GridElement.create = function (container, initialModel) {
        var surface = new Surface_1.Surface(container.clientWidth, container.clientHeight);
        container.appendChild(surface.view);
        var grid = new GridElement(container, surface, initialModel || GridModel_1.GridModel.dim(26, 100));
        return grid;
    };
    GridElement.createDefault = function (container, initialModel) {
        return this.create(container, initialModel)
            .extend(new NetExtension_1.NetExtension())
            .extend(new SelectorExtension_1.SelectorExtension())
            .extend(new EditingExtension_1.EditingExtension())
            .extend(new ScrollingExtension_1.ScrollerExtension())
            .extend(new ClipboardExtension_1.ClipboardExtension())
            .extend(new HistoryExtension_1.HistoryExtension())
            .useTheme(GoogleSheetsTheme_1.GoogleSheetsTheme);
    };
    Object.defineProperty(GridElement.prototype, "container", {
        get: function () {
            return this.internal.container;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "kernel", {
        get: function () {
            return this.internal.kernel;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "layout", {
        get: function () {
            return this.internal.layout;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "surface", {
        get: function () {
            return this.internal.surface;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GridElement.prototype, "view", {
        get: function () {
            return this.internal.view;
        },
        enumerable: true,
        configurable: true
    });
    GridElement.prototype.destroy = function () {
        this.burden.destroy();
    };
    GridElement.prototype.extend = function (ext) {
        this.kernel.install(ext);
        this.burden.add(ext);
        if (ext.init) {
            ext.init(this, this.kernel);
        }
        return this;
    };
    GridElement.prototype.useTheme = function (theme) {
        this.surface.theme = theme;
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
        return this.kernel.variables.get(variable);
    };
    GridElement.prototype.set = function (variable, value) {
        this.kernel.variables.set(variable, value);
    };
    GridElement.prototype.mergeInterface = function () {
        this.kernel.exportInterface(this);
        return this;
    };
    GridElement.prototype.focus = function () {
        this.surface.view.focus();
    };
    GridElement.prototype.forceUpdate = function () {
        this.updateSurface();
        this.surface.render();
    };
    GridElement.prototype.initCameras = function () {
        var _this = this;
        var surface = this.surface;
        //Setup events to auto-reflect camera changes
        surface.cameras.on('create', function (e) { return _this.allocateBuffer(e.target); });
        surface.cameras.on('destroy', function (e) { return _this.destroyBuffer(e.target); });
        surface.cameras.on('change', function (e) {
            if (_this.autoBufferUpdateEnabled) {
                _this.cameraBuffers[e.target.id].update(_this.layout);
            }
        });
        //Camera "main" already exists, so we need to allocate buffer
        this.allocateBuffer(surface.cameras.item('main'));
        var camTop = surface.cameras.create('gm-top');
        var camLeft = surface.cameras.create('gm-left');
        var camTopLeft = surface.cameras.create('gm-topleft');
    };
    GridElement.prototype.initSurface = function () {
        var _this = this;
        var surface = this.surface;
        surface.on('resize', function () { return _this.updateCameras(); });
        surface.on('resize', function () { return _this.updateSurface(); });
        surface.ticker.add('updateSurface', function () { return _this.updateSurface(); });
    };
    GridElement.prototype.updateCameras = function () {
        var _a = this, freezeMargin = _a.freezeMargin, layout = _a.layout, surface = _a.surface;
        this.autoBufferUpdateEnabled = false;
        var camMain = surface.cameras.item('main');
        var camTop = surface.cameras.item('gm-top');
        var camLeft = surface.cameras.item('gm-left');
        var camTopLeft = surface.cameras.item('gm-topleft');
        if (freezeMargin.equals(Point_1.Point.empty)) {
            var camMain_1 = surface.cameras.item('main');
            camMain_1.vector = this.scroll;
            camMain_1.bounds = new Rect_1.Rect(0, 0, this.surface.width, this.surface.height);
            //Setting bounds to nothing will disable cameras
            camTop.bounds = camLeft.bounds = camTopLeft.bounds = Rect_1.Rect.empty;
        }
        else {
            var margin = new Point_1.Point(layout.measureColumnRange(0, freezeMargin.x).width, layout.measureRowRange(0, freezeMargin.y).height);
            camMain.vector = margin.add(this.scroll);
            camMain.bounds = new Rect_1.Rect(margin.x, margin.y, surface.width - margin.x, surface.height - margin.y);
            camTop.vector = new Point_1.Point(margin.x + this.scroll.x, 0);
            camTop.bounds = new Rect_1.Rect(margin.x, 0, surface.width - margin.x, margin.y);
            camLeft.vector = new Point_1.Point(0, margin.y + this.scroll.y);
            camLeft.bounds = new Rect_1.Rect(0, margin.y, margin.x, surface.height - margin.y);
            camTopLeft.vector = new Point_1.Point(0, 0);
            camTopLeft.bounds = new Rect_1.Rect(0, 0, margin.x, margin.y);
        }
        this.autoBufferUpdateEnabled = true;
    };
    GridElement.prototype.updateSurface = function () {
        var layout = this.layout;
        var cameras = this.surface.cameras;
        for (var i = 0; i < cameras.count; i++) {
            var camera = cameras.item(i);
            var buffer = this.cameraBuffers[camera.id];
            buffer.update(layout);
        }
    };
    GridElement.prototype.allocateBuffer = function (camera) {
        return this.cameraBuffers[camera.id] = new CameraBuffer(camera, {
            create: this.doCreateVisual.bind(this),
            update: this.doUpdateVisual.bind(this),
            destroy: this.doDestroyVisual.bind(this),
        });
    };
    GridElement.prototype.destroyBuffer = function (camera) {
        var buffer = this.cameraBuffers[camera.id];
        buffer.destroy();
        delete this.cameraBuffers[camera.id];
    };
    GridElement.prototype.updateLayout = function () {
        this.internal.layout = GridLayout_1.GridLayout.compute(this.model, this.padding);
        this.internal.view = new GridView_1.GridView(this.layout, this.surface);
    };
    GridElement.prototype.doCreateVisual = function (cell, rect) {
        var visual = new CellVisual_1.CellVisual();
        visual.topLeft = new Point_1.Point(rect.left, rect.top);
        visual.width = rect.width;
        visual.height = rect.height;
        visual.update(cell);
        visual.mountTo(this.surface.root);
        return visual;
    };
    GridElement.prototype.doUpdateVisual = function (visual, cell, rect) {
        visual.topLeft = new Point_1.Point(rect.left, rect.top);
        visual.width = rect.width;
        visual.height = rect.height;
        visual.update(cell);
    };
    GridElement.prototype.doDestroyVisual = function (visual) {
        visual.unmountSelf();
    };
    GridElement.prototype.notifyChange = function (property) {
        if (this.model == null)
            return;
        switch (property) {
            case 'model':
            case 'freezeMargin':
            case 'padding':
                this.updateLayout();
                this.updateCameras();
                break;
            case 'scroll':
                this.updateCameras();
                break;
        }
        this.emit(new GridChangeEvent_1.GridChangeEvent(this, property));
    };
    __decorate([
        Observable_1.Observable(GridModel_1.GridModel.empty),
        __metadata("design:type", GridModel_1.GridModel)
    ], GridElement.prototype, "model", void 0);
    __decorate([
        Observable_1.Observable(Point_1.Point.empty),
        __metadata("design:type", Point_1.Point)
    ], GridElement.prototype, "freezeMargin", void 0);
    __decorate([
        Observable_1.Observable(Padding_1.Padding.empty),
        __metadata("design:type", Padding_1.Padding)
    ], GridElement.prototype, "padding", void 0);
    __decorate([
        Observable_1.Observable(Point_1.Point.empty),
        __metadata("design:type", Point_1.Point)
    ], GridElement.prototype, "scroll", void 0);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [GridCell_1.GridCell, Object]),
        __metadata("design:returntype", CellVisual_1.CellVisual)
    ], GridElement.prototype, "doCreateVisual", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [CellVisual_1.CellVisual, GridCell_1.GridCell, Object]),
        __metadata("design:returntype", void 0)
    ], GridElement.prototype, "doUpdateVisual", null);
    __decorate([
        Extensibility_1.Routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [CellVisual_1.CellVisual]),
        __metadata("design:returntype", void 0)
    ], GridElement.prototype, "doDestroyVisual", null);
    return GridElement;
}(SimpleEventEmitter_1.SimpleEventEmitter));
exports.GridElement = GridElement;
var CameraBuffer = /** @class */ (function (_super) {
    __extends(CameraBuffer, _super);
    function CameraBuffer(camera, visuals) {
        var _this = _super.call(this) || this;
        _this.camera = camera;
        _this.visuals = visuals;
        _this.cycle = 0;
        _this.index = {};
        _this.list = [];
        return _this;
    }
    CameraBuffer.prototype.destroy = function () {
        var visuals = this.visuals;
        _super.prototype.destroy.call(this);
        for (var _i = 0, _a = this.list; _i < _a.length; _i++) {
            var entry = _a[_i];
            visuals.destroy(entry.visual);
        }
        this.index = null;
        this.list = null;
    };
    CameraBuffer.prototype.update = function (layout) {
        var _a = this, camera = _a.camera, visuals = _a.visuals;
        var cells = layout.captureCells(camera.area);
        var newList = new Array(cells.length);
        this.cycle++;
        for (var i = 0; i < cells.length; i++) {
            var cell = cells[i];
            var entry = this.index[cell.ref];
            if (!entry) {
                var rect = layout.measureCell(cell.ref);
                var visual = visuals.create(cell, rect);
                entry = this.index[cell.ref] = new CameraBufferEntry(cell.ref, visual);
            }
            if (entry.nonce != cell.nonce) {
                var rect = layout.measureCell(cell.ref);
                visuals.update(entry.visual, cell, rect);
                entry.nonce = cell.nonce;
            }
            entry.cycle = this.cycle;
            newList[i] = entry;
        }
        for (var _i = 0, _b = this.list; _i < _b.length; _i++) {
            var entry = _b[_i];
            if (entry.cycle < this.cycle) {
                delete this.index[entry.cellId];
                visuals.destroy(entry.visual);
            }
        }
        this.list = newList;
    };
    return CameraBuffer;
}(AbstractDestroyable_1.AbstractDestroyable));
var CameraBufferEntry = /** @class */ (function () {
    function CameraBufferEntry(cellId, visual, nonce, cycle) {
        this.cellId = cellId;
        this.visual = visual;
        this.nonce = nonce;
        this.cycle = cycle;
    }
    return CameraBufferEntry;
}());
exports.CameraBufferEntry = CameraBufferEntry;
function enableAutoResize(container, surface) {
    //TypeScript not liking this for some reason...
    var RO = ResizeObserver;
    var t = { id: null };
    var roi = new RO(function (entries, observer) {
        var _a = entries[0].contentRect, left = _a.left, top = _a.top, width = _a.width, height = _a.height;
        var apply = function () {
            if (surface.width != width || surface.height != height) {
                console.log('apply-size');
                surface.width = width;
                surface.height = height;
            }
        };
        clearTimeout(t.id);
        t.id = setTimeout(apply, 100);
    });
    roi.observe(container);
    return function () { return roi.disconnect(); };
}
//# sourceMappingURL=GridElement.js.map