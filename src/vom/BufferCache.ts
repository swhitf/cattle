import { ObjectMap } from '../common';
import { Point } from '../geom/Point';
import { Camera } from './Camera';
import { Visual } from './Visual';


interface BufferableObjectInfo
{
    type:string;
    id:string;
}

export type Bufferable = Camera|Visual;

export class BufferCache
{
    private buffers:ObjectMap<HTMLCanvasElement> = {};

    public get(object:Bufferable):HTMLCanvasElement
    {
        const info = this.inspect(object);
        const key = `${info.type}/${info.id}`;

        return this.buffers[key] || null;
    }

    public put(object:Bufferable, buf:HTMLCanvasElement):void
    {
        const info = this.inspect(object);
        const key = `${info.type}/${info.id}`;

        this.buffers[key] = buf;        
    }

    public delete(object:Bufferable):void
    {
        const { buffers } = this;
        
        const info = this.inspect(object);
        const key = `${info.type}/${info.id}`;

        delete buffers[key];     
    }

    private inspect(object:Bufferable):BufferableObjectInfo
    {
        if (object instanceof Visual) {
            return { 
                type: 'visual',
                id: object.id.toString(),
            };
        }
        else {
            return { 
                type: 'camera',
                id: object.id,
            };
        }
    }
}