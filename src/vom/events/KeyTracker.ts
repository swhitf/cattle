import { KeySet } from './KeySet';


export class KeyTracker implements KeySet
{
    private lookup:{ [key:string]:boolean };
    private downHandle:any;
    private upHandle:any;

    constructor(private source:EventTarget)
    {
        this.lookup = {};

        this.downHandle = (ke:KeyboardEvent) =>
        {
            this.lookup[ke.keyCode] = true;
        };

        this.upHandle = (ke:KeyboardEvent) =>
        {
            delete this.lookup[ke.keyCode];
        };

        this.source.addEventListener('keydown', this.downHandle);
        this.source.addEventListener('keyup', this.upHandle);
    }

    public capture():KeySet
    {
        let snapshot =
        {
            lookup: {} as { [key:string]:boolean },
            contains: function(key:number):boolean 
            {
                return !!this.lookup[key];
            }
        };

        for (let key in this.lookup)
        {
            snapshot.lookup[key] = this.lookup[key];
        }

        return snapshot;
    }

    public destroy():void
    {
        this.source.removeEventListener('keydown', this.downHandle);
        this.source.removeEventListener('keyup', this.upHandle);
    }

    public contains(key:number):boolean
    {
        return !!this.lookup[key];
    }
}

