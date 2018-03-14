import { ObjectMap } from '../common';
import { Buffer } from './Buffer';


export class BufferCache
{
    private buffers:ObjectMap<Buffer> = {};

    public get(key:string):Buffer
    {
        return this.buffers[key] || null;
    }

    public put(key:string, buf:Buffer):void
    {
        this.buffers[key] = buf;        
    }

    public delete(key:string):void
    {
        const { buffers } = this;

        delete buffers[key];     
    }

    public invalidate(key:string):boolean
    {
        const item = this.get(key);
        if (item) {
            item.invalidate();
            return true;
        }
        return false;
    }
}