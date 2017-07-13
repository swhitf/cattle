var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
define(["require", "exports", "../../misc/RefGen", "../../misc/Util", "../../ui/Extensibility"], function (require, exports, RefGen_1, _, Extensibility_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Provides a by-the-book implementation of GridCell.
     */
    var DefaultGridCell = (function () {
        /**
         * Initializes a new instance of DefaultGridCell.
         *
         * @param params
         */
        function DefaultGridCell(params) {
            params.ref = params.ref || RefGen_1.RefGen.next();
            params.colSpan = params.colSpan || 1;
            params.rowSpan = params.rowSpan || 1;
            params.value = (params.value === undefined || params.value === null) ? '' : params.value;
            _.extend(this, params);
        }
        return DefaultGridCell;
    }());
    DefaultGridCell = __decorate([
        Extensibility_1.renderer(draw),
        __metadata("design:paramtypes", [Object])
    ], DefaultGridCell);
    exports.DefaultGridCell = DefaultGridCell;
    function draw(gfx, visual) {
        gfx.lineWidth = 1;
        var av = gfx.lineWidth % 2 == 0 ? 0 : 0.5;
        gfx.fillStyle = 'white';
        gfx.fillRect(-av, -av, visual.width, visual.height);
        gfx.strokeStyle = 'lightgray';
        gfx.strokeRect(-av, -av, visual.width, visual.height);
        gfx.fillStyle = 'black';
        gfx.textBaseline = 'middle';
        gfx.font = "13px Sans-Serif";
        gfx.fillText(visual.value, 3, 0 + (visual.height / 2));
    }
});
//# sourceMappingURL=DefaultGridCell.js.map