import { Keys } from './Keys';
import * as _ from '../misc/Util';
import { KeyCheck } from './KeyCheck';


export type MouseEventType = 'click'|'dblclick'|'mousedown'|'mousemove'|'mouseup'|'dragbegin'|'drag'|'dragend'

function parse_event(value:string):MouseEventType
{
    value = (value || '').trim().toLowerCase();
    switch (value)
    {
        case 'down':
        case 'move':
        case 'up':
            return <MouseEventType>('mouse' + value);
        case 'click':
        case 'dblclick':
        case 'down':
        case 'move':
        case 'up':
        case 'dragbegin':
        case 'drag':
        case 'dragend':
            return <MouseEventType>value;
        default:
            throw 'Invalid MouseEventType: ' + value;
    }
}

function parse_button(value:string):number
{
    value = (value || '').trim().toLowerCase();
    switch (value)
    {
        case 'primary':
        case 'button1':
            return 0;
        case 'secondary':
        case 'button2':
            return 1;
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

        right.split(/[\s\-\+]+/)
            .forEach(x =>
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
            });

        return new MouseExpression(cfg);
    }

    public readonly event:MouseEventType = null;
    public readonly button:number = null;
    public readonly keys:number[] = [];
    public readonly exclusive:boolean = false;

    private constructor(cfg:any)
    {
        _.extend(this, cfg);
    }

    public matches(mouseData:MouseEvent):boolean
    {
        if (this.event !== mouseData.type)
            return false;

        if (this.button !== null && this.button !== mouseData.button)
            return false;

        for (let k of this.keys)
        {
            if (!KeyCheck.down(k))
                return false;
        }

        return true;
    }
}