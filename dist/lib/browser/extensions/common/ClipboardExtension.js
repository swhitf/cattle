var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", "./EditingExtension", "../../model/GridRange", "../../input/KeyInput", "../../geom/Rect", "../../geom/Point", "../../ui/Widget", "../../ui/Extensibility", "../../vendor/clipboard", "../../misc/Util", "../../misc/Dom", "papaparse", "tether"], function (require, exports, EditingExtension_1, GridRange_1, KeyInput_1, Rect_1, Point_1, Widget_1, Extensibility_1, clipboard_1, _, Dom, Papa, Tether) {
    "use strict";
    //I know... :(
    var NewLine = !!window.navigator.platform.match(/.*[Ww][Ii][Nn].*/) ? '\r\n' : '\n';
    var ClipboardExtension = (function () {
        function ClipboardExtension() {
            this.copyList = [];
            this.copyRange = GridRange_1.GridRange.empty();
        }
        ClipboardExtension.prototype.init = function (grid) {
            var _this = this;
            this.grid = grid;
            this.createElements(grid.root);
            KeyInput_1.KeyInput.for(grid.root)
                .on('!CTRL+KEY_C', function (e) { return _this.copySelection(); });
            window.addEventListener('paste', this.onWindowPaste.bind(this));
            grid.on('scroll', function () { return _this.alignNet(); });
            grid.kernel.routines.hook('before:beginEdit', function () { return _this.resetCopy(); });
            grid.kernel.routines.hook('before:commit', function () { return _this.resetCopy(); });
        };
        Object.defineProperty(ClipboardExtension.prototype, "captureSelector", {
            get: function () {
                return this.grid.kernel.variables.get('captureSelector');
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ClipboardExtension.prototype, "selection", {
            get: function () {
                return this.grid.kernel.variables.get('selection');
            },
            enumerable: true,
            configurable: true
        });
        ClipboardExtension.prototype.createElements = function (target) {
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
            this.copyNet = CopyNet.create(layer);
        };
        ClipboardExtension.prototype.copySelection = function () {
            this.doCopy(this.selection);
            this.alignNet();
        };
        ClipboardExtension.prototype.resetCopy = function () {
            this.doCopy([]);
            this.alignNet();
        };
        ClipboardExtension.prototype.doCopy = function (cells, delimiter) {
            if (delimiter === void 0) { delimiter = '\t'; }
            this.copyList = cells;
            var range = this.copyRange = GridRange_1.GridRange.create(this.grid.model, cells);
            var text = '';
            if (!cells.length)
                return;
            var rr = range.ltr[0].rowRef;
            for (var i = 0; i < range.ltr.length; i++) {
                var c = range.ltr[i];
                if (rr !== c.rowRef) {
                    text += NewLine;
                    rr = c.rowRef;
                }
                text += c.value;
                if (i < (range.ltr.length - 1) && range.ltr[i + 1].rowRef === rr) {
                    text += delimiter;
                }
            }
            clipboard_1.Clipboard.copy(text);
        };
        ClipboardExtension.prototype.doPaste = function (text) {
            var _a = this, grid = _a.grid, selection = _a.selection;
            if (!selection.length)
                return;
            var focusedCell = grid.model.findCell(selection[0]);
            var parsed = Papa.parse(text, {
                delimiter: text.indexOf('\t') >= 0 ? '\t' : undefined,
            });
            var data = parsed.data.filter(function (x) { return x.length > 1 || (x.length == 1 && !!x[0]); });
            if (!data.length)
                return;
            var width = _.max(data, function (x) { return x.length; }).length;
            var height = data.length;
            var startVector = new Point_1.Point(focusedCell.colRef, focusedCell.rowRef);
            var endVector = startVector.add(new Point_1.Point(width, height));
            var pasteRange = GridRange_1.GridRange.capture(grid.model, startVector, endVector);
            var changes = new EditingExtension_1.GridChangeSet();
            for (var _i = 0, _b = pasteRange.ltr; _i < _b.length; _i++) {
                var cell = _b[_i];
                var xy = new Point_1.Point(cell.colRef, cell.rowRef).subtract(startVector);
                var value = data[xy.y][xy.x] || '';
                changes.put(cell.ref, value);
            }
            this.grid.kernel.commands.exec('commit', changes);
            this.grid.kernel.commands.exec('select', pasteRange.ltr.map(function (x) { return x.ref; }));
        };
        ClipboardExtension.prototype.alignNet = function () {
            var _a = this, grid = _a.grid, copyList = _a.copyList, copyNet = _a.copyNet;
            if (copyList.length) {
                //TODO: Improve the shit out of this:
                var netRect = Rect_1.Rect.fromMany(copyList.map(function (x) { return grid.getCellViewRect(x); }));
                copyNet.goto(netRect);
            }
            else {
                copyNet.hide();
            }
        };
        ClipboardExtension.prototype.onWindowPaste = function (e) {
            var ae = document.activeElement;
            while (!!ae) {
                if (ae == this.grid.root)
                    break;
                ae = ae.parentElement;
            }
            if (!ae)
                return;
            var text = e.clipboardData.getData('text/plain');
            if (text !== null && text !== undefined) {
                this.doPaste(text);
            }
        };
        return ClipboardExtension;
    }());
    __decorate([
        Extensibility_1.variable(),
        __metadata("design:type", CopyNet)
    ], ClipboardExtension.prototype, "copyNet", void 0);
    __decorate([
        Extensibility_1.command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "copySelection", null);
    __decorate([
        Extensibility_1.command(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", []),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "resetCopy", null);
    __decorate([
        Extensibility_1.routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Array, String]),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "doCopy", null);
    __decorate([
        Extensibility_1.routine(),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [String]),
        __metadata("design:returntype", void 0)
    ], ClipboardExtension.prototype, "doPaste", null);
    exports.ClipboardExtension = ClipboardExtension;
    var CopyNet = (function (_super) {
        __extends(CopyNet, _super);
        function CopyNet() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        CopyNet.create = function (container) {
            var root = document.createElement('div');
            root.className = 'grid-net grid-net-copy';
            container.appendChild(root);
            Dom.css(root, {
                position: 'absolute',
                left: '0px',
                top: '0px',
                display: 'none',
            });
            return new CopyNet(root);
        };
        return CopyNet;
    }(Widget_1.AbsWidgetBase));
    exports.CopyNet = CopyNet;
});
//# sourceMappingURL=ClipboardExtension.js.map