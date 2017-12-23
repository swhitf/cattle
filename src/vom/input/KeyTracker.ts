import { Keys } from './Keys';
import { Modifiers } from './Modifiers';


export class KeyTracker
{
    private state:{ [key:string]:boolean } = {};

    private blurHandle:any;
    private downHandle:any;
    private upHandle:any;

    constructor(private source:EventTarget)
    {
        this.blurHandle = () =>
        {
            this.state = {};
        };

        this.downHandle = (ke:KeyboardEvent) =>
        {
            this.state[ke.keyCode] = true;
        };

        this.upHandle = (ke:KeyboardEvent) =>
        {
            delete this.state[ke.keyCode];
        };

        this.source.addEventListener('keydown', this.downHandle);
        this.source.addEventListener('keyup', this.upHandle);
        this.source.addEventListener('blur', this.blurHandle);
    }
    
    public snapshotModifiers():Modifiers
    {
        return {
            alt: !!this.state[Keys.ALT],
            ctrl: !!this.state[Keys.CTRL],
            shift: !!this.state[Keys.SHIFT],
        };
    }
}