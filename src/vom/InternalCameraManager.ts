//@no-export
import { SimpleEventEmitter } from '../base/SimpleEventEmitter';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';
import { Camera } from './Camera';
import { CameraManager } from './CameraManager';
import { CameraEvent } from './events/CameraEvent';
import { InternalCamera } from './InternalCamera';


export class InternalCameraManager extends SimpleEventEmitter implements CameraManager
{
    protected array:InternalCamera[] = [];

    public get count():number
    {
        return this.array.length;
    }
    
    public create(id:string, order?:number, bounds?:Rect, vector?:Point):Camera
    {
        order = order === undefined ?this.array.length + 1 : order;

        if (!!this.item(id))
        {
            throw `Camera ${id} already exists.`
        }

        let camera = new InternalCamera(id, order, bounds || Rect.empty, vector || Point.empty, this);
        
        this.array.push(camera);
        this.array.sort((a, b) => a.order - b.order);
        this.array = this.array.reverse();

        this.emit(new CameraEvent('create', camera));

        return camera;
    }
    
    public destroy(id:string):void 
    {
        const idx = this.indexOf(id);
        if (idx >= 0)
        {
            let camera = this.array[idx];

            this.array.splice(idx, 1);
            this.emit(new CameraEvent('destroy', camera));
        }
        else
        {
            throw `Invalid id: ${id}`;
        }
    }
    
    public item(idOrIndex:string|number):Camera 
    {
        return (
            this.array[idOrIndex] || 
            this.array.filter(x => x.id == idOrIndex.toString())[0]
        );
    }

    public test(viewPt:Point):Camera
    {
        for (let i = this.array.length - 1; i >= 0; i--) 
        {
            let camera = this.array[i];

            if (camera.bounds.contains(viewPt))
            {
                return camera;
            }
        }

        return null;
    }

    public toArray():Camera[]
    {
        return this.array.slice(0);
    }
    
    protected indexOf(id:string):number
    {
        for (let i = 0; i < this.array.length; i++) 
        {
            if (this.array[i].id === id)
            {
                return i;
            }
        }

        return -1;
    }
}