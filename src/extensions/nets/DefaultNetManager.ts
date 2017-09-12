import { NetVisual } from './NetVisual';
import { GridElement } from '../../core/GridElement';
import { Surface } from '../../vom/Surface';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { ObjectMap } from '../../common';
import { Rect, RectLike } from '../../geom/Rect';
import { Observable } from '../../eventing/Observable';
import { NetHandle } from './NetHandle';
import { NetManager } from './NetManager';


export class DefaultNetManager implements NetManager 
{
    private list:NetHandleImpl[] = [];
    private lookup:ObjectMap<NetHandleImpl> = {};

    constructor(private grid:GridElement)
    {
    }

    public get count():number
    {
        return this.list.length;
    }

    public create(id:string, type:string, from:string, to?:string):NetHandle
    {
        let nh = NetHandleImpl.create(this.grid, id, type, from, to);
        this.list.push(nh);

        return nh;
    }

    public createPrivate(id:string, type:string, from:string, to?:string):NetHandle
    {
        if (!!this.lookup[id])
        {
            throw `Net already exists with id of ${id}.`;
        }

        let nh = NetHandleImpl.create(this.grid, id, type, from, to);
        this.lookup[id] = nh;

        return nh;
    }
    
    public get(id:string):NetHandle
    {
        return this.lookup[id] || null;
    }

    public item(index:number):NetHandle
    {
        return this.list[index] || null;
    }
}

interface DestroyCallback
{
    
}

class NetHandleImpl extends AbstractDestroyable implements NetHandle
{
    public static create(grid:GridElement, id:string, type:string, from:string, to?:string):NetHandleImpl
    {
        let visual = new NetVisual();
        visual.classes.add(type);
        visual.mountTo(grid.surface.root);

        let handle = new NetHandleImpl();   
        handle.grid = grid;
        handle.visual = visual;
        handle.type = type;
        handle.move(from, to);
        
        return handle;
    }

    public grid:GridElement;
    
    public visual:NetVisual;

    public type:string;

    public fromRef:string;

    public toRef:string;

    @Observable(true)
    public visible:boolean;

    public get bounds():RectLike
    {
        return this.visual.absoluteBounds;
    }

    public move(from:string, to?:string):void
    {
        let { grid, visual } = this;

        let fromRect = grid.layout.measureCell(from);
        let toRect = grid.layout.measureCell((to || from));

        let bounds = Rect.fromMany([fromRect, toRect]);
        visual.topLeft = bounds.topLeft();
        visual.size = bounds.size();
    }

    private notifyChange(property:string):void 
    {
        let { grid, visual } = this;

        if (property == 'visible')
        {
            if (this.visible)
            {
                visual.mountTo(grid.surface.root);
            }
            else
            {
                visual.unmountSelf();
            }
        }
    }
}