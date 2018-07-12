
declare namespace cattle {

    export class ClipboardExtension implements GridExtension {
        private grid;
        private layer;
        private copyList;
        private copyRange;
        private copyNet;
        init(grid: GridElement): void;
        private readonly captureSelector;
        private readonly selection;
        private createElements(target);
        private copySelection();
        private resetCopy();
        private doCopy(cells, delimiter?);
        private doPaste(text);
        private alignNet();
        private onWindowPaste(e);
    }
    export class CopyNet extends AbsWidgetBase<HTMLDivElement> {
        static create(container: HTMLElement): CopyNet;
    }

    
    
    
    
    
    export interface GridEditEvent {
        changes: GridChange[];
    }
    export interface GridChange {
        readonly cell: GridCell;
        readonly value: string;
        readonly cascaded?: boolean;
    }
    export interface GridChangeSetVisitor {
        (ref: string, val: string, cascaded: boolean): void;
    }
    export interface GridChangeSetItem {
        readonly ref: string;
        readonly value: string;
        readonly cascaded?: boolean;
    }
    export class GridChangeSet {
        private data;
        contents(): GridChangeSetItem[];
        get(ref: string): string;
        put(ref: string, value: string, cascaded?: boolean): GridChangeSet;
        refs(): string[];
        compile(model: GridModel): GridChange[];
    }
    export interface InputWidget extends Widget {
        focus(): void;
        val(value?: string): string;
    }
    export class EditingExtension {
        private grid;
        private layer;
        private input;
        private isEditing;
        private isEditingDetailed;
        init(grid: GridElement, kernel: GridKernel): void;
        private readonly primarySelector;
        private readonly selection;
        private createElements(target);
        private beginEdit(override);
        private endEdit(commit?);
        private endEditToNeighbor(vector, commit?);
        private erase();
        private commitUniform(cells, uniformValue);
        private commit(changes);
    }

    
    
    export class ScrollerExtension {
        private scrollerWidth;
        private grid;
        private wedge;
        constructor(scrollerWidth?: number);
        init(grid: GridElement, kernel: GridKernel): void;
        private createElements(target);
        private alignElements();
        private onContainerScroll();
    }

    
    
    
    
    export interface SelectorWidget extends Widget {
    }
    export interface SelectorExtensionExports {
        canSelect: boolean;
        readonly selection: string[];
        readonly primarySelector: SelectorWidget;
        readonly captureSelector: SelectorWidget;
        select(cells: string[], autoScroll?: boolean): void;
        selectAll(): void;
        selectBorder(vector: Point, autoScroll?: boolean): void;
        selectEdge(vector: Point, autoScroll?: boolean): void;
        selectLine(gridPt: Point, autoScroll?: boolean): void;
        selectNeighbor(vector: Point, autoScroll?: boolean): void;
    }
    export class SelectorExtension {
        private grid;
        private layer;
        private selectGesture;
        private canSelect;
        private selection;
        private primarySelector;
        private captureSelector;
        init(grid: GridElement, kernel: GridKernel): void;
        private createElements(target);
        private select(cells, autoScroll?);
        private selectAll();
        private selectBorder(vector, autoScroll?);
        private selectEdge(vector, autoScroll?);
        private selectLine(gridPt, autoScroll?);
        private selectNeighbor(vector, autoScroll?);
        private reselect(autoScroll?);
        private beginSelectGesture(gridX, gridY);
        private updateSelectGesture(gridX, gridY);
        private endSelectGesture();
        private doSelect(cells?, autoScroll?);
        private alignSelectors(animate);
    }

    
    
    export interface ComputeEngine {
        getFormula(cellRef: string): string;
        clear(cellRefs?: string[]): void;
        connect(grid: GridElement): void;
        compute(cellRefs?: string[], scope?: GridChangeSet, cascade?: boolean): GridChangeSet;
        evaluate(formula: string): string;
        inspect(formula: string): string[];
        program(cellRef: string, formula: string): void;
    }

    
    
    
    
    export interface GridCellWithFormula extends GridCell {
        formula: string;
    }
    export class ComputeExtension implements GridExtension {
        protected readonly engine: ComputeEngine;
        private noCapture;
        private grid;
        constructor(engine?: ComputeEngine);
        private readonly selection;
        init?(grid: GridElement, kernel: GridKernel): void;
        private reload();
        private beginEditOverride(override, impl);
        private commitOverride(changes, impl);
    }

    
    
    
    
    export interface CompiledFormula {
        (changeScope?: GridChangeSet): number;
    }
    export class JavaScriptComputeEngine implements ComputeEngine {
        private grid;
        private formulas;
        private cache;
        private watches;
        getFormula(cellRef: string): string;
        clear(cellRefs?: string[]): void;
        connect(grid: GridElement): void;
        evaluate(formula: string, changeScope?: GridChangeSet): string;
        compute(cellRefs?: string[], scope?: GridChangeSet, cascade?: boolean): GridChangeSet;
        inspect(formula: string): string[];
        program(cellRef: string, formula: string): void;
        protected compile(formula: string): CompiledFormula;
        protected cascadeTargets(cells: GridCell[]): GridCell[];
        protected resolve(expr: string, changeScope: GridChangeSet): number | number[];
        private coalesceFloat(...values);
    }

    export class WatchManager {
        private observing;
        private observed;
        constructor();
        clear(): void;
        getObserversOf(cellRef: string): string[];
        getObservedBy(cellRef: string): string[];
        watch(observer: string, subjects: string[]): void;
        unwatch(observer: string): void;
    }

    
    
    
    export type ClickZoneMode = 'abs' | 'abs-alt' | 'rel';
    export interface ClickZone extends RectLike {
        mode: ClickZoneMode;
        type: string;
    }
    export interface ClickZoneMouseEvent extends GridMouseEvent {
        zone: ClickZone;
    }
    export class ClickZoneExtension implements GridExtension {
        private grid;
        private layer;
        private current;
        private lastGridPt;
        private readonly isSelecting;
        init(grid: GridElement, kernel: GridKernel): void;
        private createElements(target);
        private switchZone(czs, sourceEvent);
        private forwardLayerEvent(e);
        private onMouseMove(e);
        private onGlobalMouseMove(e);
        private test(cell, zone, pt);
    }

    
    
    
    export class HistoryExtension implements GridExtension {
        private grid;
        private manager;
        private noCapture;
        private suspended;
        private capture;
        constructor(manager?: HistoryManager);
        init(grid: GridElement, kernel: GridKernel): void;
        private undo();
        private redo();
        private push(action);
        private clear();
        private suspend(flag?);
        private beforeCommit(changes);
        private afterCommit(changes);
        private createSnapshots(capture, changes);
        private createEditAction(snapshots);
        private invokeSilentCommit(changes);
    }

    export interface HistoryAction {
        apply(): void;
        rollback(): void;
    }
    export interface HistoryManager {
        readonly futureCount: number;
        readonly pastCount: number;
        clear(): void;
        push(action: HistoryAction): void;
        redo(): boolean;
        undo(): boolean;
    }
    export class DefaultHistoryManager implements HistoryManager {
        private future;
        private past;
        readonly futureCount: number;
        readonly pastCount: number;
        clear(): void;
        push(action: HistoryAction): void;
        redo(): boolean;
        undo(): boolean;
    }

    export class Padding {
        static empty: Padding;
        readonly top: number;
        readonly right: number;
        readonly bottom: number;
        readonly left: number;
        constructor(top?: number, right?: number, bottom?: number, left?: number);
        readonly horizontal: number;
        readonly vertical: number;
        inflate(by: number): Padding;
    }

    export interface PointLike {
        x: number;
        y: number;
    }
    export type BrowserPoint = {
        left: number;
        top: number;
    };
    export type PointInput = number[] | Point | PointLike | BrowserPoint;
    export class Point implements PointLike {
        readonly x: number;
        readonly y: number;
        static rad2deg: number;
        static deg2rad: number;
        static empty: Point;
        static max: Point;
        static min: Point;
        static up: Point;
        static average(points: PointLike[]): Point;
        static direction(from: PointInput, to: PointInput): Point;
        static create(source: PointInput): Point;
        static fromBuffer(buffer: number[], index?: number): Point;
        constructor(x: number | number[], y?: number);
        angle(): number;
        angleAbout(val: PointInput): number;
        cross(val: PointInput): number;
        distance(to: PointInput): number;
        dot(val: PointInput): number;
        length(): number;
        normalize(): Point;
        perp(): Point;
        rperp(): Point;
        inverse(): Point;
        reverse(): Point;
        rotate(radians: number): Point;
        add(val: number | PointInput): Point;
        divide(divisor: number): Point;
        multiply(multipler: number): Point;
        round(): Point;
        subtract(val: number | PointInput): Point;
        clamp(lower: Point, upper: Point): Point;
        clone(): Point;
        equals(another: PointLike): boolean;
        toArray(): number[];
        toString(): string;
    }

    
    export interface RectLike {
        left: number;
        top: number;
        width: number;
        height: number;
    }
    export class Rect {
        static empty: Rect;
        static fromEdges(left: number, top: number, right: number, bottom: number): Rect;
        static fromLike(like: RectLike): Rect;
        static fromMany(rects: Rect[]): Rect;
        static fromPoints(...points: Point[]): Rect;
        static fromPointBuffer(points: Point[], index?: number, length?: number): Rect;
        readonly left: number;
        readonly top: number;
        readonly width: number;
        readonly height: number;
        constructor(left: number, top: number, width: number, height: number);
        readonly right: number;
        readonly bottom: number;
        center(): Point;
        topLeft(): Point;
        points(): Point[];
        size(): Point;
        contains(input: PointLike | RectLike): boolean;
        extend(size: PointInput): Rect;
        inflate(size: PointInput): Rect;
        offset(by: PointInput): Rect;
        intersects(rect: RectLike): boolean;
        normalize(): Rect;
        toString(): string;
    }

    
    export class EventTargetEventEmitterAdapter implements EventEmitter {
        private target;
        static wrap(target: EventTarget | EventEmitter): EventEmitter;
        constructor(target: EventTarget);
        on(event: string, callback: EventCallback): EventSubscription;
        off(event: string, callback: EventCallback): void;
        emit(event: string, ...args: any[]): void;
    }

    export class KeyCheck {
        static init(): void;
        static down(key: number): boolean;
    }

    export class KeyExpression {
        static parse(input: string): KeyExpression;
        readonly ctrl: boolean;
        readonly alt: boolean;
        readonly shift: boolean;
        readonly key: number;
        readonly exclusive: boolean;
        private constructor();
        matches(keyData: KeyExpression | KeyboardEvent): boolean;
    }

    
    export type KeyMappable = EventTarget | EventEmitterBase;
    export interface KeyMapCallback {
        (e?: KeyboardEvent): void;
    }
    export class KeyInput {
        private emitters;
        static for(...elmts: KeyMappable[]): KeyInput;
        private subs;
        private constructor();
        on(exprs: string | string[], callback: KeyMapCallback): KeyInput;
        private createListener(ee, ke, callback);
    }

    export class Keys {
        static BACKSPACE: number;
        static TAB: number;
        static ENTER: number;
        static SHIFT: number;
        static CTRL: number;
        static ALT: number;
        static PAUSE: number;
        static CAPS_LOCK: number;
        static ESCAPE: number;
        static SPACE: number;
        static PAGE_UP: number;
        static PAGE_DOWN: number;
        static END: number;
        static HOME: number;
        static LEFT_ARROW: number;
        static UP_ARROW: number;
        static RIGHT_ARROW: number;
        static DOWN_ARROW: number;
        static INSERT: number;
        static DELETE: number;
        static KEY_0: number;
        static KEY_1: number;
        static KEY_2: number;
        static KEY_3: number;
        static KEY_4: number;
        static KEY_5: number;
        static KEY_6: number;
        static KEY_7: number;
        static KEY_8: number;
        static KEY_9: number;
        static KEY_A: number;
        static KEY_B: number;
        static KEY_C: number;
        static KEY_D: number;
        static KEY_E: number;
        static KEY_F: number;
        static KEY_G: number;
        static KEY_H: number;
        static KEY_I: number;
        static KEY_J: number;
        static KEY_K: number;
        static KEY_L: number;
        static KEY_M: number;
        static KEY_N: number;
        static KEY_O: number;
        static KEY_P: number;
        static KEY_Q: number;
        static KEY_R: number;
        static KEY_S: number;
        static KEY_T: number;
        static KEY_U: number;
        static KEY_V: number;
        static KEY_W: number;
        static KEY_X: number;
        static KEY_Y: number;
        static KEY_Z: number;
        static LEFT_META: number;
        static RIGHT_META: number;
        static SELECT: number;
        static NUMPAD_0: number;
        static NUMPAD_1: number;
        static NUMPAD_2: number;
        static NUMPAD_3: number;
        static NUMPAD_4: number;
        static NUMPAD_5: number;
        static NUMPAD_6: number;
        static NUMPAD_7: number;
        static NUMPAD_8: number;
        static NUMPAD_9: number;
        static MULTIPLY: number;
        static ADD: number;
        static SUBTRACT: number;
        static DECIMAL: number;
        static DIVIDE: number;
        static F1: number;
        static F2: number;
        static F3: number;
        static F4: number;
        static F5: number;
        static F6: number;
        static F7: number;
        static F8: number;
        static F9: number;
        static F10: number;
        static F11: number;
        static F12: number;
        static NUM_LOCK: number;
        static SCROLL_LOCK: number;
        static SEMICOLON: number;
        static EQUALS: number;
        static COMMA: number;
        static DASH: number;
        static PERIOD: number;
        static FORWARD_SLASH: number;
        static GRAVE_ACCENT: number;
        static OPEN_BRACKET: number;
        static BACK_SLASH: number;
        static CLOSE_BRACKET: number;
        static SINGLE_QUOTE: number;
        static parse(input: string, thrownOnFail?: boolean): number;
    }

    export interface MouseDragEvent extends MouseEvent {
        startX: number;
        startY: number;
        distX?: number;
        distY?: number;
    }

    
    export class MouseDragEventSupport {
        protected elmt: HTMLElement;
        static check(elmt: HTMLElement): boolean;
        static enable(elmt: HTMLElement): MouseDragEventSupport;
        protected shouldDrag: boolean;
        protected isDragging: boolean;
        protected startPoint: Point;
        protected lastPoint: Point;
        protected cancel: () => void;
        protected listener: any;
        protected constructor(elmt: HTMLElement);
        destroy(): void;
        protected onTargetMouseDown(e: MouseEvent): void;
        protected onWindowMouseMove(e: MouseEvent): void;
        protected onWindowMouseUp(e: MouseEvent): void;
        private createEvent(type, source, dist?);
    }

    export type MouseEventType = 'click' | 'dblclick' | 'mousedown' | 'mousemove' | 'mouseup' | 'dragbegin' | 'drag' | 'dragend';
    export class MouseExpression {
        static parse(input: string): MouseExpression;
        readonly event: MouseEventType;
        readonly button: number;
        readonly keys: number[];
        readonly exclusive: boolean;
        private constructor();
        matches(mouseData: MouseEvent): boolean;
    }

    
    export type Mappable = EventTarget | EventEmitterBase;
    export interface MouseCallback {
        (e: Event): void;
    }
    export class MouseInput {
        private emitters;
        static for(...elmts: Mappable[]): MouseInput;
        private subs;
        private constructor();
        on(expr: string, callback: MouseCallback): MouseInput;
        private createListener(target, expr, callback);
    }

    export class Base26 {
        static num(num: number): Base26;
        static str(str: string): Base26;
        readonly num: number;
        readonly str: string;
        private constructor();
    }

    
    export function parse(html: string): HTMLElement;
    export function css(e: HTMLElement, styles: ObjectMap<string>): HTMLElement;
    export function fit(e: HTMLElement, target: HTMLElement): HTMLElement;
    export function hide(e: HTMLElement): HTMLElement;
    export function show(e: HTMLElement): HTMLElement;
    export function toggle(e: HTMLElement, visible: boolean): HTMLElement;
    export function singleTransition(e: HTMLElement, prop: string, millis: number, ease?: string): void;

    export interface ObjectIndex<T> {
        [index: number]: T;
    }
    export interface ObjectMap<T> {
        [index: string]: T;
    }

    export function ie_safe_create_mouse_event(type: string, source: MouseEvent): MouseEvent;

    export interface PropertyChangedCallback {
        (obj: any, val: any): void;
    }
    export function property(defaultValue: any, filter: PropertyChangedCallback): (ctor: any, propName: string) => void;

    export class RefGen {
        static next(prefix?: string): string;
    }

    
    export function coalesce<T>(...inputs: T[]): T;
    export function extend(target: any, data: any): any;
    export function index<T>(arr: T[], indexer: (tm: T) => number | string): ObjectMap<T>;
    export function flatten<T>(aa: any): T[];
    export function keys<T>(ix: ObjectIndex<T> | ObjectMap<T>): string[];
    export function values<T>(ix: ObjectIndex<T> | ObjectMap<T>): T[];
    export function zipPairs(pairs: any[][]): any;
    export function unzipPairs(pairs: any): any[][];
    export function max<T>(arr: T[], selector: (t: T) => number): T;
    export function shadowClone(target: any): any;

    
    /**
     * Defines the parameters that can/should be passed to a new DefaultGridCell instance.
     */
    export interface DefaultGridCellParams {
        colRef: number;
        rowRef: number;
        value: string;
        ref?: string;
        colSpan?: number;
        rowSpan?: number;
    }
    /**
     * Provides a by-the-book implementation of GridCell.
     */
    export class DefaultGridCell implements GridCell {
        /**
         * The cell reference, must be unique per GridModel instance.
         */
        readonly ref: string;
        /**
         * The column reference that describes the horizontal position of the cell.
         */
        readonly colRef: number;
        /**
         * The number of columns that this cell spans.
         */
        readonly colSpan: number;
        /**
         * The row reference that describes the vertical position of the cell.
         */
        readonly rowRef: number;
        /**
         * The number of rows that this cell spans.
         */
        readonly rowSpan: number;
        /**
         * The value of the cell.
         */
        value: string;
        /**
         * Initializes a new instance of DefaultGridCell.
         *
         * @param params
         */
        constructor(params: DefaultGridCellParams);
    }

    
    /**
     * Provides a by-the-book implementation of GridColumn.
     */
    export class DefaultGridColumn implements GridColumn {
        /**
         * The column reference, must be unique per GridModel instance.  Used to indicate the position of the
         * column within the grid based on a zero-index.
         */
        readonly ref: number;
        /**
         * The width of the column.
         */
        width: number;
        /**
         * Initializes a new instance of DefaultGridColumn.
         *
         * @param ref
         * @param width
         */
        constructor(ref: number, width?: number);
    }

    
    
    
    
    
    /**
     * Provides a by-the-book implementation of GridModel.  All inspection methods use O(1) implementations.
     */
    export class DefaultGridModel implements GridModel {
        /**
         * Creates an grid model with the specified number of columns and rows populated with default cells.
         *
         * @param cols
         * @param rows
         */
        static dim(cols: number, rows: number): DefaultGridModel;
        /**
         * Creates an empty grid model.
         *
         * @returns {DefaultGridModel}
         */
        static empty(): DefaultGridModel;
        /**
         * The grid cell definitions.  The order is arbitrary.
         */
        readonly cells: GridCell[];
        /**
         * The grid column definitions.  The order is arbitrary.
         */
        readonly columns: GridColumn[];
        /**
         * The grid row definitions.  The order is arbitrary.
         */
        readonly rows: GridRow[];
        private refs;
        private coords;
        /**
         * Initializes a new instance of DefaultGridModel.
         *
         * @param cells
         * @param columns
         * @param rows
         */
        constructor(cells: GridCell[], columns: GridColumn[], rows: GridRow[]);
        /**
         * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
         * within the model.
         * @param ref
         */
        findCell(ref: string): GridCell;
        /**
         * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
         * vector (direction) object, or null if no neighbor could be found.
         * @param ref
         * @param vector
         */
        findCellNeighbor(ref: string, vector: Point): GridCell;
        /**
         * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
         * or null if no cell could be found.
         * @param colRef
         * @param rowRef
         */
        locateCell(col: number, row: number): GridCell;
        /**
         * Refreshes internal caches used to optimize lookups and should be invoked after the model has been changed (structurally).
         */
        refresh(): void;
    }

    
    /**
     * Provides a by-the-book implementation of GridRow.
     */
    export class DefaultGridRow implements GridRow {
        /**
         * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
         * row within the grid based on a zero-index.
         */
        readonly ref: number;
        /**
         * The height of the column.
         */
        height: number;
        /**
         * Initializes a new instance of DefaultGridRow.
         *
         * @param ref
         * @param height
         */
        constructor(ref: number, height?: number);
    }

    /**
     * Defines the interface of an object that represents a GridCell.
     */
    export interface GridCell {
        /**
         * The cell reference, must be unique per GridModel instance.
         */
        readonly ref: string;
        /**
         * The column reference that describes the horizontal position of the cell.
         */
        readonly colRef: number;
        /**
         * The number of columns that this cell spans.
         */
        readonly colSpan: number;
        /**
         * The row reference that describes the vertical position of the cell.
         */
        readonly rowRef: number;
        /**
         * The number of rows that this cell spans.
         */
        readonly rowSpan: number;
        /**
         * The value of the cell.
         */
        value: string;
    }

    /**
     * Defines the interface of an object that describes a GridColumn.
     */
    export interface GridColumn {
        /**
         * The column reference, must be unique per GridModel instance.  Used to indicate the position of the
         * column within the grid based on a zero-index.
         */
        readonly ref: number;
        /**
         * The width of the column.
         */
        width: number;
    }

    
    
    
    
    /**
     * Defines the interface of an object that represents the logical composition of a data grid.  It hosts the
     * collections of the various entity model objects as well as methods for access and inspection.
     */
    export interface GridModel {
        /**
         * The grid cell definitions.  The order is arbitrary.
         */
        readonly cells: GridCell[];
        /**
         * The grid column definitions.  The order is arbitrary.
         */
        readonly columns: GridColumn[];
        /**
         * The grid row definitions.  The order is arbitrary.
         */
        readonly rows: GridRow[];
        /**
         * Given a cell ref, returns the GridCell object that represents the cell, or null if the cell did not exist
         * within the model.
         * @param ref
         */
        findCell(ref: string): GridCell;
        /**
         * Given a cell ref, returns the GridCell object that represents the neighboring cell as per the specified
         * vector (direction) object, or null if no neighbor could be found.
         * @param ref
         * @param vector
         */
        findCellNeighbor(ref: string, vector: Point): GridCell;
        /**
         * Given a cell column ref and row ref, returns the GridCell object that represents the cell at the location,
         * or null if no cell could be found.
         * @param colRef
         * @param rowRef
         */
        locateCell(colRef: number, rowRef: number): GridCell;
    }

    
    
    
    /**
     * Describes a resolveExpr of grid cells.
     */
    export class GridRange {
        /**
         * Creates a new GridRange object that contains the cells with the specified refs from the
         * specified model.
         *
         * @param model
         * @param cellRefs
         * @returns {Range}
         */
        static create(model: GridModel, cellRefs: string[]): GridRange;
        /**
         * Captures a range of cells from the specified model based on the specified vectors.  The vectors should be
         * two points in grid coordinates (e.g. col and row references) that draw a logical line across the grid.
         * Any cells falling into the rectangle created from these two points will be included in the selected resolveExpr.
         *
         * @param model
         * @param from
         * @param to
         * @param toInclusive
         * @returns {Range}
         */
        static capture(model: GridModel, from: Point, to: Point, toInclusive?: boolean): GridRange;
        /**
         * Selects a range of cells using an Excel-like range expression. For example:
         * - A1 selects a 1x1 range of the first cell
         * - A1:A5 selects a 1x5 range from the first cell horizontally.
         * - A1:E5 selects a 5x5 range from the first cell evenly.
         *
         * @param model
         * @param query
         */
        static select(model: GridModel, query: string): GridRange;
        /**
         * Creates an empty GridRange object.
         *
         * @returns {Range}
         */
        static empty(): GridRange;
        private static createInternal(model, cells);
        /**
         * The cells in the resolveExpr ordered from left to right.
         */
        readonly ltr: GridCell[];
        /**
         * The cells in the resolveExpr ordered from top to bottom.
         */
        readonly ttb: GridCell[];
        /**
         * With width of the resolveExpr in columns.
         */
        readonly width: number;
        /**
         * With height of the resolveExpr in rows.
         */
        readonly height: number;
        /**
         * The number of cells in the resolveExpr (will be different to length if some cell slots contain no cells).
         */
        readonly count: number;
        /**
         * The length of the resolveExpr (number of rows * number of columns).
         */
        readonly length: number;
        private index;
        private constructor();
        /**
         * Indicates whether or not a cell is included in the range.
         */
        contains(cellRef: string): boolean;
        /**
         * Returns an array of the references for all the cells in the range.
         */
        refs(): string[];
    }

    /**
     * Defines the interface of an object that describes a GridRow.
     */
    export interface GridRow {
        /**
         * The row reference, must be unique per GridModel instance.  Used to indicate the position of the
         * row within the grid based on a zero-index.
         */
        readonly ref: number;
        /**
         * The height of the column.
         */
        height: number;
    }

    export function cascade(): PropertyDecorator;
    export class Cascading<T> {
        readonly parent: T;
        constructor(parent?: T, values?: any);
    }
    export type TextAlignment = 'left' | 'center' | 'right';
    export interface ValueFormatter {
        (value: string, visual: any): string;
    }
    export class Style extends Cascading<Style> {
        borderColor: string;
        fillColor: string;
        formatter: ValueFormatter;
        text: TextStyle;
    }
    export class TextStyle extends Cascading<TextStyle> {
        static Default: TextStyle;
        alignment: TextAlignment;
        color: string;
        font: string;
        size: number;
        style: string;
        variant: string;
        weight: string;
    }
    export const BaseStyle: Style;

    
    
    /**
     * Defines the parameters that can/should be passed to a new StyledGridCell instance.
     */
    export interface StyledGridCellParams extends DefaultGridCellParams {
        placeholder?: string;
        style?: Style;
    }
    export class StyledGridCell extends DefaultGridCell {
        style: Style;
        placeholder: string;
        /**
         * Initializes a new instance of StyledGridCell.
         *
         * @param params
         */
        constructor(params: StyledGridCellParams);
    }

    /**
     * Do not use directly.
     */
    export interface ClassDef<T> {
    }
    /**
     * Function definition for a cell renderer function.
     */
    export interface Renderer {
        (gfx: CanvasRenderingContext2D, visual: any): void;
    }
    /**
     * A decorator that marks a method as a _command_; an externally callable logic block that performs some task.  A name
     * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
     * used.
     * @param name The optional command name
     * @returns decorator
     */
    export function command(name?: string): any;
    /**
     * A decorator that defines the render function for a GridCell implementation, allowing custom cell types
     * to control their drawing behavior.
     *
     * @param func
     * A decorator that marks a method
     */
    export function renderer(func: Renderer): any;
    /**
     * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
     * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
     * as the routine will be used.
     * @param name The optional routine name
     * @returns decorator
     */
    export function routine(name?: string): any;
    /**
     * A decorator that marks a field as a _variable_; a readable and optionally writable value that can be consumed by
     * modules.  A name for the variable can be optionally specified, otherwise the name of the field being exported
     * as the variable will be used.
     * @param name The optional variable name
     * @returns decorator
     */
    export function variable(mutable: boolean): any;
    export function variable(name?: string, mutable?: boolean): any;
    /**
     * A decorator for use within implementations of GridCell that marks a field as one that affects the visual
     * appearance of the cell.  This will cause the value of the field to be mapped to the _Visual_ object
     * created before the cell is drawn.
     *
     * @returns decorator
     */
    export function visualize(): any;

    
    
    
    
    
    
    
    
    export interface GridExtension {
        init?(grid: GridElement, kernel: GridKernel): void;
    }
    export interface GridExtender {
        (grid: GridElement, kernel: GridKernel): void;
    }
    export interface GridMouseEvent extends MouseEvent {
        readonly cell: GridCell;
        readonly gridX: number;
        readonly gridY: number;
    }
    export interface GridMouseDragEvent extends MouseDragEvent {
        readonly cell: GridCell;
        readonly gridX: number;
        readonly gridY: number;
    }
    export interface GridKeyboardEvent extends KeyboardEvent {
    }
    export class GridElement extends EventEmitterBase {
        private canvas;
        static create(target: HTMLElement, initialModel?: GridModel): GridElement;
        model: GridModel;
        freezeMargin: Point;
        padding: Padding;
        scroll: Point;
        readonly root: HTMLCanvasElement;
        readonly container: HTMLElement;
        readonly kernel: GridKernel;
        private hotCell;
        private dirty;
        private layout;
        private buffers;
        private visuals;
        private frame;
        private constructor();
        readonly width: number;
        readonly height: number;
        readonly modelWidth: number;
        readonly modelHeight: number;
        readonly virtualWidth: number;
        readonly virtualHeight: number;
        readonly scrollLeft: number;
        readonly scrollTop: number;
        extend(ext: GridExtension | GridExtender): GridElement;
        exec(command: string, ...args: any[]): void;
        get(variable: string): any;
        set(variable: string, value: any): void;
        mergeInterface(): GridElement;
        focus(): void;
        getCellAtGridPoint(pt: PointLike): GridCell;
        getCellAtViewPoint(pt: PointLike): GridCell;
        getCellsInGridRect(rect: RectLike): GridCell[];
        getCellsInViewRect(rect: RectLike): GridCell[];
        getCellGridRect(ref: string): Rect;
        getCellViewRect(ref: string): Rect;
        scrollTo(ptOrRect: PointLike | RectLike): void;
        bash(): void;
        invalidate(query?: string): void;
        redraw(forceImmediate?: boolean): void;
        private draw(forced);
        private computeViewFragments();
        private computeViewport();
        private updateVisuals();
        private drawVisuals();
        private createBuffer(width, height);
        private createVisual(cell, region);
        private forwardMouseEvent(event);
        private forwardKeyEvent(event);
        private enableEnterExitEvents();
        private createGridMouseEvent(type, source);
    }

    export interface GridCommand {
        (...args: any[]): void;
    }
    export interface GridCommandHub {
        /**
         * Defines the specified command for extensions or consumers to use.
         */
        define(command: string, impl: GridCommand): void;
        /**
         * Executes the specified grid command.
         */
        exec(command: string, ...args: any[]): void;
    }
    export interface GridVariable {
        get(): any;
        set?(value: any): void;
    }
    export interface GridVariableHub {
        /**
         * Defines the specified variable for extensions or consumers to use.
         */
        define(variable: string, impl: GridVariable): void;
        /**
         * Gets the value of the specified variable.
         */
        get(variable: string): any;
        /**
         * Sets the value of the specified variable.
         */
        set(variable: string, value: any): void;
    }
    export interface GridRoutineHook {
        (...args: any[]): void;
    }
    export interface GridRoutineOverride {
        (...args: any[]): any;
    }
    export interface GridRoutineHub {
        /**
         * Adds a hook to the specified signal that enables extensions to override grid behavior
         * defined in the core or other extensions.
         */
        hook(routine: string, callback: any): void;
        override(routine: string, callback: any): any;
        /**
         * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
         * should be supporting data or relevant objects to the routine.  The value returned will be `true`
         * if the routine has been overridden by an extension.
         */
        signal(routine: string, ...args: any[]): boolean;
    }
    /**
     * Implements the core of the Grid extensibility system.
     */
    export class GridKernel {
        private emitter;
        readonly commands: GridCommandHub;
        readonly routines: GridRoutineHub;
        readonly variables: GridVariableHub;
        constructor(emitter: (event: string, ...args: any[]) => void);
        exportInterface(target?: any): any;
        install(ext: any): void;
    }

    export interface EventSubscription {
        cancel(): void;
    }
    export interface EventCallback {
        (...args: any[]): void;
    }
    export interface EventEmitter {
        on(event: string, callback: EventCallback): EventSubscription;
        off(event: string, callback: EventCallback): void;
        emit(event: string, ...args: any[]): void;
    }
    export class EventEmitterBase {
        private buckets;
        on(event: string, callback: EventCallback): EventSubscription;
        off(event: string, callback: EventCallback): void;
        emit(event: string, ...args: any[]): void;
        private getCallbackList(event);
    }

    
    
    
    export interface GridLayoutRegion<T> extends RectLike {
        readonly ref: T;
    }
    export class GridLayout {
        static compute(model: GridModel, padding: Padding): GridLayout;
        readonly width: number;
        readonly height: number;
        readonly columns: GridLayoutRegion<number>[];
        readonly rows: GridLayoutRegion<number>[];
        readonly cells: GridLayoutRegion<string>[];
        private cellLookup;
        private columnIndex;
        private rowIndex;
        private cellIndex;
        private constructor();
        queryColumn(ref: number): RectLike;
        queryColumnRange(fromRef: number, toRefEx: number): RectLike;
        queryRow(ref: number): RectLike;
        queryRowRange(fromRef: number, toRefEx: number): RectLike;
        queryCell(ref: string): RectLike;
        captureColumns(region: RectLike): number[];
        captureRows(region: RectLike): number[];
        captureCells(region: RectLike): string[];
    }

    
    /**
     * Defines the base interface of a widget.  A widget is an object that represents a UI element within the context of
     * a grid.  It can be composed of one or more DOM elements and be interactable or static.  The Widget interfaces
     * provides a common interface through which modules or consumers can access the underlying DOM elements of a widget
     * and basic methods that ease the manipulation of widgets.
     */
    export interface Widget {
        /**
         * The root HTMLElement of the widget.
         */
        readonly root: HTMLElement;
        /**
         * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
         */
        readonly viewRect: Rect;
        /**
         * Hides the whole widget.
         */
        hide(): void;
        /**
         * Shows the whole widget.
         */
        show(): void;
        /**
         * Toggles the visibility of the whole widget.
         *
         * @param visible
         */
        toggle(visible: boolean): void;
    }
    /**
     * Provides an abstract base class for Widget implementations that are expected to represent Widgets with
     * absolutely positioned root elements.
     */
    export class AbsWidgetBase<T extends HTMLElement> implements Widget {
        root: T;
        constructor(root: T);
        /**
         * Gets a Rect object that describes the dimensions of the Widget relative to the viewport of the grid.
         */
        readonly viewRect: Rect;
        /**
         * Moves the Widget to the specified position relative to the viewport of the grid.
         *
         * @param viewRect
         * @param animate
         */
        goto(viewRect: RectLike, autoShow?: boolean): void;
        /**
         * Hides the whole widget.
         */
        hide(): void;
        /**
         * Shows the whole widget.
         */
        show(): void;
        /**
         * Toggles the visibility of the whole widget.
         *
         * @param visible
         */
        toggle(visible: boolean): void;
    }


}
