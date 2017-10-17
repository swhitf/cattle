import { KeySequence } from './KeySequence';


export class KeyTracker
{
    private iks:InternalKeySequence;
    private blurHandle:any;
    private downHandle:any;
    private upHandle:any;

    constructor(private source:EventTarget)
    {
        let iks = this.iks = new InternalKeySequence();

        this.blurHandle = () =>
        {
            iks.clear();
        };

        this.downHandle = (ke:KeyboardEvent) =>
        {
            if (!iks.contains(ke.keyCode))
            {
                iks.add(ke.keyCode);
            }
        };

        this.upHandle = (ke:KeyboardEvent) =>
        {
            if (iks.contains(ke.keyCode))
            {
                iks.remove(ke.keyCode);
            }
        };

        this.source.addEventListener('keydown', this.downHandle);
        this.source.addEventListener('keyup', this.upHandle);
        this.source.addEventListener('blur', this.blurHandle);
    }
    
    // public get length():number
    // { 
    //     return this.iks.length;
    // }

    public capture():KeySequence
    {
        return this.iks.clone();
    }

    // public contains(key:number):boolean
    // {
    //     return this.iks.contains(key);
// }
    
    // public destroy():void
    // {
    //     this.source.removeEventListener('keydown', this.downHandle);
    //     this.source.removeEventListener('keyup', this.upHandle);
    // }       
    
    // public item(index:number):number 
    // {
    //     return this.iks.item(index);
    // }
}

class InternalKeySequence implements KeySequence
{
    public readonly keys:number[] = [];

    constructor(keys:number[] = [])
    {
        this.keys = keys;
    }

    public get length():number
    {
        return this.keys.length;
    }
    
    public clear():void
    {
        this.keys.splice(0, this.keys.length);
    }   

    public clone():InternalKeySequence
    {
        return new InternalKeySequence(this.keys.slice(0));
    }     
    
    public contains(key:number):boolean 
    {
        return this.keys.indexOf(key) >= 0;
    }  
    
    public item(index:number):number 
    {
        return this.keys[index];
    } 
    
    public add(key:number):void 
    {
        this.keys.push(key);
    } 
    
    public remove(key:number):void 
    {
        let idx = this.keys.indexOf(key);
        if (idx >= 0)
        {
            this.keys.splice(idx, 1);
        }
    }

    public toArray():number[]
    {
        return this.keys.slice(0);
    }
}