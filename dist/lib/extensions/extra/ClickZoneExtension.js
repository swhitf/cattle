"use strict";
var Rect_1 = require("../../geom/Rect");
var Point_1 = require("../../geom/Point");
var Dom = require("../../misc/Dom");
var Tether = require("tether");
var ClickZoneExtension = (function () {
    function ClickZoneExtension() {
    }
    Object.defineProperty(ClickZoneExtension.prototype, "isSelecting", {
        get: function () {
            return this.grid.kernel.variables.get('isSelecting');
        },
        enumerable: true,
        configurable: true
    });
    ClickZoneExtension.prototype.init = function (grid, kernel) {
        this.grid = grid;
        this.createElements(grid.root);
        this.layer.addEventListener('click', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('dblclick', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousemove', this.onGlobalMouseMove.bind(this));
        grid.on('mousemove', this.onMouseMove.bind(this));
    };
    ClickZoneExtension.prototype.createElements = function (target) {
        var layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);
        var t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });
        var onBash = function () {
            Dom.fit(layer, target);
            t.position();
        };
        this.grid.on('bash', onBash);
        onBash();
        this.layer = layer;
    };
    ClickZoneExtension.prototype.switchZone = function (czs, sourceEvent) {
        var _a = this, grid = _a.grid, layer = _a.layer;
        if (hash(this.current) === hash(czs))
            return;
        if (this.current) {
            grid.emit('zoneexit', create_event('zoneexit', this.current, sourceEvent));
        }
        this.current = czs;
        if (czs) {
            layer.style.pointerEvents = 'all';
            grid.emit('zoneenter', create_event('zoneenter', this.current, sourceEvent));
        }
        else {
            layer.style.pointerEvents = 'none';
        }
    };
    ClickZoneExtension.prototype.forwardLayerEvent = function (e) {
        var _a = this, grid = _a.grid, lastGridPt = _a.lastGridPt;
        e['gridX'] = lastGridPt.x;
        e['gridY'] = lastGridPt.y;
        var type = 'zone' + e.type;
        grid.focus();
        grid.emit(type, create_event(type, this.current, e));
    };
    ClickZoneExtension.prototype.onMouseMove = function (e) {
        var _this = this;
        var grid = this.grid;
        var mousePt = this.lastGridPt = new Point_1.Point(e.offsetX, e.offsetY);
        var cell = grid.getCellAtViewPoint(mousePt);
        if (cell) {
            var viewRect = grid.getCellViewRect(cell.ref);
            var zones = (cell['zones'] || []);
            var target = zones
                .filter(function (x) { return _this.test(cell, x, mousePt); })[0] || null;
            if (!!target) {
                this.switchZone({ cell: cell, zone: target }, e);
            }
            else {
                this.switchZone(null, e);
            }
        }
        else {
            this.switchZone(null, e);
        }
    };
    ClickZoneExtension.prototype.onGlobalMouseMove = function (e) {
        var grid = this.grid;
        if (!!this.current) {
            var gridRect = Rect_1.Rect.fromLike(grid.root.getBoundingClientRect());
            var mousePt = new Point_1.Point(e.clientX, e.clientY);
            if (!gridRect.contains(mousePt)) {
                this.switchZone(null, e);
            }
        }
    };
    ClickZoneExtension.prototype.test = function (cell, zone, pt) {
        var viewRect = this.grid.getCellViewRect(cell.ref);
        var zoneRect = Rect_1.Rect.fromLike(zone);
        if (zone.mode === 'rel') {
            zoneRect = new Rect_1.Rect(viewRect.width * (zoneRect.left / 100), viewRect.height * (zoneRect.top / 100), viewRect.width * (zoneRect.width / 100), viewRect.height * (zoneRect.height / 100));
        }
        if (zone.mode === 'abs-alt') {
            zoneRect = new Rect_1.Rect(viewRect.width - zoneRect.left - zoneRect.height, viewRect.height - zoneRect.top - zoneRect.height, zoneRect.width, zoneRect.height);
        }
        return zoneRect.offset(viewRect.topLeft()).contains(pt);
    };
    return ClickZoneExtension;
}());
exports.ClickZoneExtension = ClickZoneExtension;
function create_event(type, czs, source) {
    var event = (new MouseEvent(type, source));
    // event.gridX = source.gridX;
    // event.gridY = source.gridY;
    event.cell = czs.cell;
    event.zone = czs.zone;
    return event;
}
function hash(czs) {
    if (!czs)
        return '';
    return [czs.cell.ref, czs.zone.left, czs.zone.top, czs.zone.width, czs.zone.height]
        .join(':');
}
//# sourceMappingURL=ClickZoneExtension.js.map