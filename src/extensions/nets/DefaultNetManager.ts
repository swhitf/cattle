import { AbstractDestroyable } from '../../base/AbstractDestroyable';
import { Observable } from '../../base/Observable';
import { ObjectMap, Predicate } from '../../common';
import { GridElement } from '../../core/GridElement';
import { Rect, RectLike } from '../../geom/Rect';
import { index } from '../../misc/Util';
import { NetHandle } from './NetHandle';
import { NetManager } from './NetManager';
import { NetVisual } from './NetVisual';


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
        this.lookup[id] = nh;

        return nh;
    }
    
    public destroy(id:string):void 
    {
        let { list, lookup } = this;

        let net = lookup[id];
        
        if (net)
        {
            net.destroy();
            list.splice(list.indexOf(net), 1);
            delete lookup[id];
        }
        else
        {
            throw `Invalid id: ${id}`;
        }
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

    public toArray(filter?:Predicate<NetHandle>):NetHandle[]
    {
        return this.list.filter(filter || (x => true));
    }

    protected indexOf(id:string):number
    {
        for (let i = 0; i < this.list.length; i++) 
        {
            if (this.list[i].id === id)
            {
                return i;
            }
        }

        return -1;
    }
}

class NetHandleImpl extends AbstractDestroyable implements NetHandle
{
    public static create(grid:GridElement, id:string, type:string, from:string, to?:string):NetHandleImpl
    {
        let visual = new NetVisual();
        visual.classes.add(type);
        visual.mountTo(grid.surface.root);
 
        let handle = new NetHandleImpl();   
        handle.id = id;
        handle.grid = grid;
        handle.visual = visual;
        handle.type = type;
        handle.move(from, to);
        
        return handle;
    }
    
    public grid:GridElement;

    public id:string;
    
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
    
    public destroy():void
    {
        super.destroy();
        this.visual.unmountSelf();
        this.visual = null;
    }

    public move(from:string, to?:string):void
    {
        to = to || from;

        const { grid, visual } = this;

        const fromRect = grid.layout.measureCell(from);
        const toRect = grid.layout.measureCell(to || from);

        const bounds = Rect.fromMany([fromRect, toRect]);
        visual.topLeft = bounds.topLeft();
        visual.size = bounds.size();

        this.fromRef = from;
        this.toRef = to;
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