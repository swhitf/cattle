import { Surface } from './Surface';
import { Visual } from './Visual';


export class RootVisual extends Visual
{
    public readonly canHost:boolean = true;
    public readonly type:string = 'root';

    constructor(private owner:Surface)
    {
        super();
    }

    public get surface():Surface
    {
        return this.owner;
    }

    public isMounted():boolean 
    {
        //Root is always mounted!
        return true;
    }
    
    public render(gfx:CanvasRenderingContext2D):void 
    {
        //Root never renders anything!
    }
}