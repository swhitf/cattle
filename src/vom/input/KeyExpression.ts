import { VisualKeyboardEvent } from '../events/VisualKeyboardEvent';
import { Keys } from './Keys';
import { KeySequence } from './KeySequence';


export class KeyExpression
{
    public static parse(input:string):KeyExpression
    {
        let exclusive = input[0] === '!';
        if (exclusive)
        {
            input = input.substr(1);
        }

        let sequence = input
            .split(/[\s\-\+]+/)
            .map(x => Keys.parse(x));

        return new KeyExpression(sequence, exclusive);
    }

    public readonly sequence:number[];
    public readonly exclusive:boolean;

    private constructor(sequence:number[], exclusive:boolean)
    {
        this.sequence = sequence;
        this.exclusive = exclusive;

        // this.ctrl = keys.some(x => x === Keys.CTRL);
        // this.alt = keys.some(x => x === Keys.ALT);
        // this.shift = keys.some(x => x === Keys.SHIFT);
        // this.key = keys.filter(x => x !== Keys.CTRL && x !== Keys.ALT && x !== Keys.SHIFT)[0] || null;
    }
    
        public matches(input:KeyExpression|VisualKeyboardEvent|KeySequence):boolean
        {
            if (input instanceof KeyExpression)
            {
                return array_contains(input.sequence, this.sequence);
            }
            else if (input instanceof VisualKeyboardEvent)
            {
                let sequence = input.modifiers.toArray();
                sequence.push(input.key);
    
                return array_contains(sequence, this.sequence);
            }
            else
            {
                return array_contains(input.toArray(), this.sequence);
            }        
        }
        
        public matchesExact(input:KeyExpression|VisualKeyboardEvent|KeySequence):boolean
        {
            if (input instanceof KeyExpression)
            {
                return array_equals(input.sequence, this.sequence);
            }
            else if (input instanceof VisualKeyboardEvent)
            {
                let sequence = input.modifiers.toArray();
                sequence.push(input.key);
    
                return array_equals(sequence, this.sequence);
            }
            else
            {
                return array_equals(input.toArray(), this.sequence);
            }        
        }
}

export function array_equals<T>(a:T[], b:T[]):boolean
{
    if (a.length !== b.length)
    {
        return false;
    }

    for (let i = 0; i < a.length; i++)
    {
        if (a[i] !== b[i])
        {
            return false;
        }
    }

    return true;
}

export function array_contains<T>(arr:T[], x:T[]):boolean
{
    for (let i = 0, j = 0; i < arr.length; i++)
    {
        if (arr[i] == x[j]) 
        {
            if (++j >= x.length)
            {
                return true;
            }
        }
    }

    return false;
}