define(["require", "exports", "./geom/Point", "./geom/Rect", "./model/default/DefaultGridCell", "./model/default/DefaultGridColumn", "./model/default/DefaultGridModel", "./model/default/DefaultGridRow", "./model/styled/Style", "./model/styled/StyledGridCell", "./model/GridRange", "./ui/GridElement", "./ui/GridKernel", "./ui/Widget", "./ui/internal/EventEmitter", "./ui/Extensibility", "./extensions/common/ClipboardExtension", "./extensions/common/EditingExtension", "./extensions/common/ScrollerExtension", "./extensions/common/SelectorExtension", "./extensions/history/HistoryExtension", "./extensions/history/HistoryManager", "./extensions/compute/ComputeExtension", "./extensions/compute/JavaScriptComputeEngine", "./extensions/compute/WatchManager", "./extensions/extra/ClickZoneExtension", "./misc/Base26"], function (require, exports, Point_1, Rect_1, DefaultGridCell_1, DefaultGridColumn_1, DefaultGridModel_1, DefaultGridRow_1, Style_1, StyledGridCell_1, GridRange_1, GridElement_1, GridKernel_1, Widget_1, EventEmitter_1, Extensibility_1, ClipboardExtension_1, EditingExtension_1, ScrollerExtension_1, SelectorExtension_1, HistoryExtension_1, HistoryManager_1, ComputeExtension_1, JavaScriptComputeEngine_1, WatchManager_1, ClickZoneExtension_1, Base26_1) {
    "use strict";
    (function (ext) {
        ext.ClipboardExtension = ClipboardExtension_1.ClipboardExtension;
        ext.EditingExtension = EditingExtension_1.EditingExtension;
        ext.ScrollerExtension = ScrollerExtension_1.ScrollerExtension;
        ext.SelectorExtension = SelectorExtension_1.SelectorExtension;
        ext.HistoryExtension = HistoryExtension_1.HistoryExtension;
        ext.DefaultHistoryManager = HistoryManager_1.DefaultHistoryManager;
        ext.ComputeExtension = ComputeExtension_1.ComputeExtension;
        ext.JavaScriptComputeEngine = JavaScriptComputeEngine_1.JavaScriptComputeEngine;
        ext.WatchManager = WatchManager_1.WatchManager;
        ext.ClickZoneExtension = ClickZoneExtension_1.ClickZoneExtension;
        ext.Point = Point_1.Point;
        ext.Rect = Rect_1.Rect;
        ext.Base26 = Base26_1.Base26;
        ext.DefaultGridCell = DefaultGridCell_1.DefaultGridCell;
        ext.DefaultGridColumn = DefaultGridColumn_1.DefaultGridColumn;
        ext.DefaultGridModel = DefaultGridModel_1.DefaultGridModel;
        ext.DefaultGridRow = DefaultGridRow_1.DefaultGridRow;
        ext.Style = Style_1.Style;
        ext.StyledGridCell = StyledGridCell_1.StyledGridCell;
        ext.GridChangeSet = EditingExtension_1.GridChangeSet;
        ext.GridRange = GridRange_1.GridRange;
        ext.GridElement = GridElement_1.GridElement;
        ext.GridKernel = GridKernel_1.GridKernel;
        ext.AbsWidgetBase = Widget_1.AbsWidgetBase;
        ext.EventEmitterBase = EventEmitter_1.EventEmitterBase;
        ext.command = Extensibility_1.command;
        ext.variable = Extensibility_1.variable;
        ext.routine = Extensibility_1.routine;
        ext.renderer = Extensibility_1.renderer;
        ext.visualize = Extensibility_1.visualize;
    })(window['cattle'] || (window['cattle'] = {}));
});
//# sourceMappingURL=browser.js.map