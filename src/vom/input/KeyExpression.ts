import { Keys } from './Keys';
import { KeySet } from './KeySet';


export class KeyExpression
{
    public static parse(input:string):KeyExpression
    {
        let exclusive = input[0] === '!';
        if (exclusive)
        {
            input = input.substr(1);
        }

        let keys = input
            .split(/[\s\-\+]+/)
            .map(x => Keys.parse(x));

        return new KeyExpression(keys, exclusive);
    }

    public readonly ctrl:boolean;
    public readonly alt:boolean;
    public readonly shift:boolean;
    public readonly key:number;
    public readonly exclusive:boolean;

    private constructor(keys:number[], exclusive:boolean)
    {
        this.exclusive = exclusive;

        this.ctrl = keys.some(x => x === Keys.CTRL);
        this.alt = keys.some(x => x === Keys.ALT);
        this.shift = keys.some(x => x === Keys.SHIFT);
        this.key = keys.filter(x => x !== Keys.CTRL && x !== Keys.ALT && x !== Keys.SHIFT)[0] || null;
    }

    public matches(keyData:KeyExpression|KeyboardEvent|KeySet):boolean
    {
        if (keyData instanceof KeyExpression)
        {
            return (
                this.ctrl == keyData.ctrl &&
                this.alt == keyData.alt &&
                this.shift == keyData.shift &&
                this.key == keyData.key
            );
        }
        else if (keyData instanceof KeyboardEvent)
        {
            return (
                this.ctrl == keyData.ctrlKey &&
                this.alt == keyData.altKey &&
                this.shift == keyData.shiftKey &&
                this.key == keyData.keyCode
            );
        }
        else if (!!keyData.contains)
        {
            return (
                this.ctrl == keyData.contains(Keys.CTRL) &&
                this.alt == keyData.contains(Keys.ALT) &&
                this.shift == keyData.contains(Keys.SHIFT) &&
                keyData.contains(this.key)
            );
        }

        throw 'KeyExpression.matches: Invalid input';
    }
}