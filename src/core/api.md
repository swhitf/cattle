View = the view
Viewlet = a fragment of the view


/* === Draw logic:

@ticker

select visible cells
loop over cells
    if has visual
        if visual nonce neq cell nonce
            update
            set nonce
    else
        create visual
        set nonce
end

*/ ===


export class GridElement extends EventEmitterBase
{
    public static create(target:HTMLElement, initialModel?:GridModel):GridElement

    public model:GridModel;
    public freezeMargin:Point;
    public padding:Padding;
    public scroll:Point;

    public readonly container:HTMLElement;
    public readonly layout:GridLayout;
    public readonly surface:Surface;
    public readonly kernel:GridKernel;

    public get width():number
    public get height():number
    public get scrollLeft():number
    public get scrollTop():number

    /*
    public extend(ext:GridExtension|GridExtender):GridElement
    public exec(command:string, ...args:any[]):void
    public get(variable:string):any
    public set(variable:string, value:any):void
    public mergeInterface():GridElement
    */

    public focus():void
    public scrollTo(ptOrRect:PointLike|RectLike):void

    public bash():void
    public invalidate(query:string = null):void
    public redraw(forceImmediate:boolean = false):void
}

export class GridLayout
{
    public readonly width:number;
    public readonly height:number;
    public readonly columns:GridLayoutRegion<GridColumn>[];
    public readonly rows:GridLayoutRegion<GridRow>[];
    public readonly cells:GridLayoutRegion<GridCell>[];

    public captureColumns(region:RectLike):GridColumn[];
    public captureRows(region:RectLike):GridRow[];
    public captureCells(region:RectLike):GridCell[];

    public measureColumn(ref:number):RectLike;
    public measureColumnRange(fromRef:number, toRefEx:number):RectLike;
    public measureRow(ref:number):RectLike;
    public measureRowRange(fromRef:number, toRefEx:number):RectLike;
    public measureCell(ref:string):RectLike;

    public pickColumn(at:PointLike):GridColumn;
    public pickRow(at:PointLike):GridRow;
    public pickCell(at:PointLike):GridCell;
}

export class GridView
{
    public captureColumns(region:RectLike):GridColumn[];
    public captureRows(region:RectLike):GridRow[];
    public captureCells(region:RectLike):GridCell[];

    public pickColumn(at:PointLike):GridColumn;
    public pickRow(at:PointLike):GridRow;
    public pickCell(at:PointLike):GridCell;
}