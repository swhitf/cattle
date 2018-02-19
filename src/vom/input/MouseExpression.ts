import { VisualMouseEvent, VisualMouseEventTypes } from '../events/VisualMouseEvent';
import { Keys } from './Keys';
import * as u from '../../misc/Util';
import { Modifiers } from './Modifiers';



export class MouseExpression
{
    public static create(e:MouseEvent|VisualMouseEvent):MouseExpression 
    {
        const cfg = { exact: false, exclusive: false, } as any;

        if (e instanceof MouseEvent) 
        {
            cfg.event = e.type;
            cfg.button = e.button;
            cfg.modifiers = new Modifiers(e.altKey, e.ctrlKey, e.shiftKey);
        }
        else 
        {
            cfg.event = e.type;
            cfg.button = e.button;
            cfg.modifiers = e.modifiers;
        }

        return new MouseExpression(cfg);
    }

    public static parse(input:string):MouseExpression
    {
        let cfg = <any>{
            keys: [],
        };

        let [expr, ...tags] = input.split('/');
        let [left, right] = divide_expression(expr);

        cfg.event = parse_event(left);
        cfg.button = parse_button(left);
        cfg.modifiers = Modifiers.parse(right);
        cfg.exact = !!~tags.indexOf('e');
        cfg.exclusive = !!~tags.indexOf('x');

        return new MouseExpression(cfg);
    }

    public readonly event:VisualMouseEventTypes = null;
    public readonly button:number = null;
    public readonly modifiers:Modifiers;
    public readonly exact:boolean;
    public readonly exclusive:boolean;

    private constructor(cfg:any)
    {
        u.extend(this, cfg);
    }

    public matches(input:MouseExpression|MouseEvent|VisualMouseEvent):boolean 
    {
        const expr = norm(input);

        if (this.event !== expr.event)
            return false;

        if (this.button !== null && this.button !== expr.button)
            return false;

        if (this.exact && !this.modifiers.matchesExact(expr.modifiers))
            return false;
    
        if (!this.modifiers.matches(expr.modifiers))
            return false;

        return true;
    }

    public toString():string
    {
        const keys = [];
        if (this.modifiers.ctrl) keys.push('CTRL');
        if (this.modifiers.alt) keys.push('ALT');
        if (this.modifiers.shift) keys.push('SHIFT');
        return [this.button, this.event].join('_') + '+' + keys.join('+');
    }
}

function norm(x:MouseExpression|MouseEvent|VisualMouseEvent):MouseExpression 
{
    return (x instanceof MouseEvent || x instanceof VisualMouseEvent)
        ? MouseExpression.create(x)
        : x;
}

function parse_event(value:string):VisualMouseEventTypes
{
    value = ((value || '').trim().toLowerCase()).split('.')[1] || 'down';

    switch (value)
    {
        case 'down':
        case 'move':
        case 'up':
        case 'drag':
        case 'enter':
        case 'leave':
            return ('mouse' + value) as VisualMouseEventTypes;
        case 'mousedown':
        case 'mousemove':
        case 'mouseup':
        case 'mousedrag':
        case 'mouseenter':
        case 'mouseleave':
        case 'click':
        case 'dblclick':
        // case 'dragbegin':
        // case 'drag':
        // case 'dragend':
             return value as VisualMouseEventTypes;
        default:
            throw 'Invalid MouseEventType: ' + value;
    }
}

function parse_button(value:string):number
{
    value = ((value || '').trim().toLowerCase()).split('.')[0];

    switch (value)
    {
        case 'left':
        case 'primary':
        case 'button1':
            return 0;
        case 'middle':
        case 'button2':
            return 1;
        case 'right':
        case 'secondary':
        case 'button3':
            return 2;
        default:
            throw 'Invalid MouseButton: ' + value;
    }
}

function divide_expression(value:string):string[]
{
    let parts = value.split('+');

    if (parts.length > 1)
    {
        parts = [ parts[0], parts.slice(1).join('+') ];
    }

    return parts;
}