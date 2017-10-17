import { ObjectMap } from '../common';
import { Point } from '../geom/Point';


export interface BufferTypeConfiguration
{
    identify(object:any):string;

    measure(object:any):Point;
}

export class BufferManager
{
    private configs:ObjectMap<BufferTypeConfiguration> = {};
    private backMap:ObjectMap<HTMLCanvasElement> = {};
    private frontMap:ObjectMap<HTMLCanvasElement> = {};

    public configure(type:string, config:BufferTypeConfiguration):BufferManager
    {
        this.configs[type] = config;
        return this;
    }

    public getFor(type:string, object:any):HTMLCanvasElement
    {
        let cfg = this.configs[type];
        if (!cfg) throw `Unsupported buffer type: ${type}`;

        let id = `${type}:${cfg.identify(object)}`;
        let buffer = this.resolve(id);
        let size = cfg.measure(object);

        if (buffer.width != size.x) buffer.width = size.x;
        if (buffer.height != size.y) buffer.height = size.y;

        return buffer;
    }

    public retainFor(type:string, object:any):void
    {
        let cfg = this.configs[type];
        if (!cfg) throw `Unsupported buffer type: ${type}`;

        let id = `${type}:${cfg.identify(object)}`;

        if (this.backMap[id])
        {
            this.frontMap[id] = this.backMap[id];
        }
    }

    public beginRender():void
    {
        for (let key in this.backMap)
        {
            let buffer = this.backMap[key];
            let gfx = buffer.getContext('2d');
            gfx.setTransform(1, 0, 0, 1, 0, 0);
            gfx.clearRect(0, 0, buffer.width, buffer.height);
        }
    }

    public endRender():void
    {
        this.backMap = this.frontMap;
        this.frontMap = {};
    }

    private resolve(id:string):HTMLCanvasElement
    {
        if (this.frontMap[id])
        {
            return this.frontMap[id];
        }

        if (this.backMap[id])
        {
            return (this.frontMap[id] = this.backMap[id]);
        }

        return (this.frontMap[id] = document.createElement('canvas'));
    }
}