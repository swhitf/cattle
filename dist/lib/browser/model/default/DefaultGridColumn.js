define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Provides a by-the-book implementation of GridColumn.
     */
    var DefaultGridColumn = (function () {
        /**
         * Initializes a new instance of DefaultGridColumn.
         *
         * @param ref
         * @param width
         */
        function DefaultGridColumn(ref, width) {
            if (width === void 0) { width = 100; }
            this.ref = ref;
            this.width = width;
        }
        return DefaultGridColumn;
    }());
    exports.DefaultGridColumn = DefaultGridColumn;
});
//# sourceMappingURL=DefaultGridColumn.js.map