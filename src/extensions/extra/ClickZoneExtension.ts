import { GridCell } from '../../model/GridCell';
import { GridKernel } from '../../ui/GridKernel'
import { GridElement, GridExtension, GridMouseEvent } from '../../ui/GridElement'
import { MouseInput } from '../../input/MouseInput';
import { Rect, RectLike } from '../../geom/Rect';
import { Point, PointLike } from '../../geom/Point';
import * as Dom from '../../misc/Dom';
import * as Tether from 'tether';


export type ClickZoneMode = 'abs'|'abs-alt'|'rel';

export interface ClickZone extends RectLike
{
    mode:ClickZoneMode;
    type:string;
}

interface ClickZoneSelection
{
    cell:GridCell;
    zone:ClickZone;
}

export interface ClickZoneMouseEvent extends GridMouseEvent
{
    zone:ClickZone;
}

export class ClickZoneExtension implements GridExtension
{
    private grid:GridElement;
    private layer:HTMLElement;
    private current:ClickZoneSelection;
    private lastGridPt:Point;

    private get isSelecting():boolean
    {
        return this.grid.kernel.variables.get('isSelecting');
    }

    public init(grid:GridElement, kernel:GridKernel):void
    {
        this.grid = grid;
        this.createElements(grid.root);

        this.layer.addEventListener('click', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('dblclick', this.forwardLayerEvent.bind(this));
        this.layer.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousemove', this.onGlobalMouseMove.bind(this));
        grid.on('mousemove', this.onMouseMove.bind(this));
    }

    private createElements(target:HTMLElement):void
    {
        let layer = document.createElement('div');
        layer.className = 'grid-layer';
        Dom.css(layer, { pointerEvents: 'none', overflow: 'hidden', });
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center',
        });

        let onBash = () => {
            Dom.fit(layer, target);
            t.position();
        };

        this.grid.on('bash', onBash);
        onBash();

        this.layer = layer;
    }

    private switchZone(czs:ClickZoneSelection, sourceEvent:MouseEvent):void
    {
        let { grid, layer } = this;

        if (hash(this.current) === hash(czs))
            return;

        if (this.current)
        {
            grid.emit('zoneexit', create_event('zoneexit', this.current, sourceEvent));
        }

        this.current = czs;

        if (czs)
        {
            layer.style.pointerEvents = 'all';
            grid.emit('zoneenter', create_event('zoneenter', this.current, sourceEvent));
        }
        else
        {
            layer.style.pointerEvents = 'none';
        }
    }

    private forwardLayerEvent(e:MouseEvent):void
    {
        let { grid, lastGridPt } = this;
        e['gridX'] = lastGridPt.x;
        e['gridY'] = lastGridPt.y;

        let type = 'zone' + e.type;

        grid.focus();
        grid.emit(type, create_event(type, this.current, e as GridMouseEvent));
    }

    private onMouseMove(e:MouseEvent):void
    {
        let { grid } = this;

        let mousePt = this.lastGridPt = new Point(e.offsetX, e.offsetY);
        let cell = grid.getCellAtViewPoint(mousePt);
        if (cell)
        {
            let viewRect = grid.getCellViewRect(cell.ref);
            let zones = (cell['zones'] || []) as ClickZone[];

            let target = zones
                .filter(x => this.test(cell, x, mousePt))
                [0] || null;

            if (!!target)
            {
                this.switchZone({cell: cell, zone: target}, e);
            }
            else
            {
                this.switchZone(null, e);
            }
        }
        else
        {
            this.switchZone(null, e);
        }
    }

    private onGlobalMouseMove(e:MouseEvent):void 
    {
        let { grid } = this;

        if (!!this.current)
        {
            let gridRect = Rect.fromLike(grid.root.getBoundingClientRect())
            let mousePt = new Point(e.clientX, e.clientY);
        
            if (!gridRect.contains(mousePt))
            {
                this.switchZone(null, e);
            }
        }
    }
    
    private test(cell:GridCell, zone:ClickZone, pt:Point):boolean
    {
        let viewRect = this.grid.getCellViewRect(cell.ref);
        let zoneRect = Rect.fromLike(zone);

        if (zone.mode === 'rel')
        {
            zoneRect = new Rect(
                viewRect.width * (zoneRect.left / 100),
                viewRect.height * (zoneRect.top / 100),
                viewRect.width * (zoneRect.width / 100),
                viewRect.height * (zoneRect.height / 100),
            );
        }
        if (zone.mode === 'abs-alt') 
        {
            zoneRect = new Rect(
                viewRect.width - zoneRect.left - zoneRect.height,
                viewRect.height - zoneRect.top - zoneRect.height,
                zoneRect.width,
                zoneRect.height,
            );
        }

        return zoneRect.offset(viewRect.topLeft()).contains(pt);
    }
}

function create_event(type:string, czs:ClickZoneSelection, source:MouseEvent):ClickZoneMouseEvent
{
    let event = <any>(new MouseEvent(type, source));
    // event.gridX = source.gridX;
    // event.gridY = source.gridY;
    event.cell = czs.cell;
    event.zone = czs.zone;
    return event;
}

function hash(czs:ClickZoneSelection):string
{
    if (!czs) return '';
    return [czs.cell.ref, czs.zone.left, czs.zone.top, czs.zone.width, czs.zone.height]
        .join(':');
}