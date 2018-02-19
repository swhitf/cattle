import { VisualKeyboardEvent, VisualKeyboardEventTypes } from '../events/VisualKeyboardEvent';
import { Keys } from './Keys';
import { Modifiers } from './Modifiers';


export class KeyExpression
{
    public static create(e:KeyboardEvent|VisualKeyboardEvent):KeyExpression 
    {
        if (e instanceof KeyboardEvent) 
        {
            let keys = [ e.keyCode ];
            if (e.ctrlKey) keys.push(Keys.CTRL);
            if (e.altKey) keys.push(Keys.ALT);
            if (e.shiftKey) keys.push(Keys.SHIFT);
            return new KeyExpression(e.type, keys);
        }
        else 
        {
            let keys = [ e.key ];
            if (e.modifiers.ctrl) keys.push(Keys.CTRL);
            if (e.modifiers.alt) keys.push(Keys.ALT);
            if (e.modifiers.shift) keys.push(Keys.SHIFT);
            return new KeyExpression(e.type, keys);
        }
    }

    public static parse(input:string):KeyExpression
    {   
        let [expr, ...tags] = input.split('/');
        let [keys, event] = extract_event(expr);        

        let sequence = keys
            .split(/[\s\-\+]+/)
            .filter(x => !!x)
            .map(x =>  Keys.parse(x));

        return new KeyExpression(event, sequence, tags);
    }

    public readonly event:string;
    public readonly key:number;
    public readonly modifiers:Modifiers;
    public readonly exact:boolean;
    public readonly exclusive:boolean;

    private constructor(event:string, keys:number[], tags:string[] = [])
    {
        this.event = event;
        this.key = keys.filter(x => x !== Keys.CTRL && x !== Keys.ALT && x !== Keys.SHIFT)[0] || null;
        this.exact = !!~tags.indexOf('e');
        this.exclusive = !!~tags.indexOf('x');
        this.modifiers = new Modifiers(
            keys.some(x => x === Keys.ALT),
            keys.some(x => x === Keys.CTRL),
            keys.some(x => x === Keys.SHIFT)
        );
    }
    
    public matches(input:KeyExpression|KeyboardEvent|VisualKeyboardEvent):boolean 
    {
        const expr = norm(input);

        if (this.key != Keys.WILDCARD && this.key != expr.key)
            return false;

        if (this.exact && !this.modifiers.matchesExact(expr.modifiers))
            return false;
    
        if (!this.modifiers.matches(expr.modifiers))
            return false;
        
        return true;
    }

    public toString():string
    {
        const keys = [ String.fromCharCode(this.key) ];
        if (this.modifiers.ctrl) keys.push('CTRL');
        if (this.modifiers.alt) keys.push('ALT');
        if (this.modifiers.shift) keys.push('SHIFT');
        return keys.join('+');
    }
}

function norm(x:KeyExpression|KeyboardEvent|VisualKeyboardEvent):KeyExpression 
{
    return (x instanceof KeyboardEvent || x instanceof VisualKeyboardEvent)
        ? KeyExpression.create(x)
        : x;
}

function extract_event(expr:string):string[]
{
    let event = 'keydown';

    if (expr.indexOf('.') >= 0)
    {
        event = expr.match(/\.([\w*]+)\+?/)[1];
        expr = expr.replace(`.${event}`, '');
        event = event.toLowerCase();

        switch (event)
        {
            case 'down':
            case 'press':
            case 'up':
                event = 'key' + event;
                break;
            case 'keydown':
            case 'keypress':
            case 'keyup':
                break;
            default:
                throw 'Invalid KeyEventType: ' + event;
        }
    }

    return [expr, event];
}
