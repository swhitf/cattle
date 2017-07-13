define(["require", "exports", "./JavaScriptComputeEngine", "../common/EditingExtension"], function (require, exports, JavaScriptComputeEngine_1, EditingExtension_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ComputeExtension = (function () {
        function ComputeExtension(engine) {
            this.noCapture = false;
            this.engine = engine || new JavaScriptComputeEngine_1.JavaScriptComputeEngine();
        }
        Object.defineProperty(ComputeExtension.prototype, "selection", {
            get: function () {
                return this.grid.kernel.variables.get('selection');
            },
            enumerable: true,
            configurable: true
        });
        ComputeExtension.prototype.init = function (grid, kernel) {
            this.grid = grid;
            this.engine.connect(grid);
            kernel.routines.override('commit', this.commitOverride.bind(this));
            kernel.routines.override('beginEdit', this.beginEditOverride.bind(this));
            grid.on('invalidate', this.reload.bind(this));
        };
        ComputeExtension.prototype.reload = function () {
            var _a = this, engine = _a.engine, grid = _a.grid;
            var program = {};
            engine.clear();
            for (var _i = 0, _b = grid.model.cells; _i < _b.length; _i++) {
                var cell = _b[_i];
                var formula = cell['formula'];
                if (!!formula) {
                    engine.program(cell.ref, formula);
                }
            }
            this.noCapture = true;
            grid.exec('commit', engine.compute());
            this.noCapture = false;
        };
        ComputeExtension.prototype.beginEditOverride = function (override, impl) {
            var _a = this, engine = _a.engine, selection = _a.selection;
            if (!selection[0]) {
                return false;
            }
            if (!override && override !== '') {
                override = engine.getFormula(selection[0]) || null;
            }
            return impl(override);
        };
        ComputeExtension.prototype.commitOverride = function (changes, impl) {
            var _a = this, engine = _a.engine, grid = _a.grid;
            if (!this.noCapture) {
                var scope = new EditingExtension_1.GridChangeSet();
                var computeList = [];
                for (var _i = 0, _b = changes.contents(); _i < _b.length; _i++) {
                    var tm = _b[_i];
                    var cell = grid.model.findCell(tm.ref);
                    if (cell['readonly'] !== true && cell['mutable'] !== false) {
                        if (tm.value.length > 0 && tm.value[0] === '=') {
                            engine.program(tm.ref, tm.value);
                        }
                        else {
                            engine.clear([tm.ref]);
                            scope.put(tm.ref, tm.value, tm.cascaded);
                        }
                    }
                    computeList.push(tm.ref);
                }
                if (computeList.length) {
                    changes = engine.compute(computeList, scope);
                }
            }
            impl(changes);
        };
        return ComputeExtension;
    }());
    exports.ComputeExtension = ComputeExtension;
});
//# sourceMappingURL=ComputeExtension.js.map