import { Rect } from '../../geom/Rect';
import { Buffer } from './Buffer';
import { CompositionElement } from './Composition2';
import { Key } from './Key';


export type ElementInvalidateCallback = (rect:Rect) => void;

export class Element implements CompositionElement {
        
    public readonly key:Key;

    public area:Rect = Rect.empty;
    public invalid:boolean = true;
    public retain:boolean = true;

    public readonly buffer = new Buffer();

    constructor(key:Key, private invalidate:ElementInvalidateCallback) 
    {
        this.key = key;
    }

    public get id():string 
    {
        return this.key.id;
    }
    
    public arrange(rect:Rect):void 
    {
        if (rect.equals(this.area)) return;
        
        this.invalidate(this.area);
        this.area = rect;
        this.invalidate(this.area);
    }
    
    public draw(callback:(gfx:CanvasRenderingContext2D) => void) 
    {
        const { area, buffer } = this;

        buffer.prepare(area.width, area.height);
        buffer.update(callback);
        
        this.invalid = false;
        this.invalidate(area);

        return this;
    }
}