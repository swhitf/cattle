import { VisualMouseEvent, VisualMouseEventTypes } from '../events/VisualMouseEvent';
import { Keys } from './Keys';
import * as u from '../../misc/Util';



export class MouseExpression
{
    public static parse(input:string):MouseExpression
    {
        let cfg = <any>{
            keys: [],
        };

        cfg.exclusive = input[0] === '!';
        if (cfg.exclusive)
        {
            input = input.substr(1);
        }

        let [left, right] = divide_expression(input);

        cfg.event = parse_event(left);

        for (let x of right.split(/[\s\-\+]+/))
        {
            let key = Keys.parse(x, false);
            if (key !== null)
            {
                cfg.keys.push(key);
            }
            else
            {
                cfg.button = parse_button(x);
            }
        }

        return new MouseExpression(cfg);
    }

    public readonly event:VisualMouseEventTypes = null;
    public readonly button:number = null;
    public readonly keys:number[] = [];
    public readonly exclusive:boolean = false;

    private constructor(cfg:any)
    {
        u.extend(this, cfg);
    }

    public matches(mouseData:VisualMouseEvent):boolean
    {
        if (this.event !== mouseData.type)
            return false;

        if (this.button !== null && this.button !== mouseData.button)
            return false;

        for (let k of this.keys)
        {
            if (!mouseData.keys.contains(k))
            {
                return false;
            }
        }

        return true;
    }
}

function parse_event(value:string):VisualMouseEventTypes
{
    value = (value || '').trim().toLowerCase();
    switch (value)
    {
        case 'down':
        case 'move':
        case 'up':
        case 'enter':
        case 'leave':
            return ('mouse' + value) as VisualMouseEventTypes;
        case 'mousedown':
        case 'mousemove':
        case 'mouseup':
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
    value = (value || '').trim().toLowerCase();
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
    let parts = value.split(':');

    if (parts.length == 1)
    {
        parts.splice(0, 0, 'down');
    }

    return parts.slice(0, 2);
}