import { Keys } from './Keys';


export class Modifiers 
{
    public static create(e:MouseEvent|KeyboardEvent):Modifiers 
    {
        return new Modifiers(e.altKey, e.ctrlKey, e.shiftKey);
    }

    public static parse(input:string):Modifiers
    {
        let keys = (input || '')
            .split(/[\s\-\+]+/)
            .filter(x => !!x)
            .map(x => Keys.parse(x));

        return new Modifiers(
            keys.some(x => x === Keys.ALT),
            keys.some(x => x === Keys.CTRL),
            keys.some(x => x === Keys.SHIFT)
        );
    }

    public readonly alt:boolean;
    public readonly ctrl:boolean;
    public readonly shift:boolean;

    constructor(alt:boolean, ctrl:boolean, shift:boolean)
    {
        this.alt = alt;
        this.ctrl = ctrl;
        this.shift = shift;
    }

    public get any():boolean
    {
        return this.alt || this.ctrl || this.shift;
    }
    
    public matches(other:Modifiers):boolean {
        
        if (!!this.ctrl && !other.ctrl)
            return false;
        
        if (!!this.alt && !other.alt)
            return false;
        
        if (!!this.shift && !other.shift)
            return false;

        return true;
    }
    
    public matchesExact(other:Modifiers):boolean {
        
        if (this.ctrl != other.ctrl)
            return false;
        
        if (this.alt != other.alt)
            return false;
        
        if (this.shift != other.shift)
            return false;

        return true;
    }
}