import { ObjectIndex } from '../misc/Interfaces';


let Tracker:ObjectIndex<boolean>;

export class KeyCheck
{
    public static init():void
    {
        if (!Tracker)
        {
            Tracker = {};

            window.addEventListener('keydown', (e: KeyboardEvent) => Tracker[e.keyCode] = true);
            window.addEventListener('keyup', (e: KeyboardEvent) => Tracker[e.keyCode] = false);
        }
    }

    public static down(key:number):boolean
    {
        return !!Tracker && !!Tracker[key];
    }
}