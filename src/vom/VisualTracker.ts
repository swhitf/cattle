//@no-export
import { Visual } from './Visual';


export class VisualTracker
{
    private values = {} as { [key:string]:Visual; };

    public get(key:string):Visual
    {
        return this.values[key] || null;
    }

    public set(key:string, visual:Visual)
    {
        if (this.values[key])
        {
            this.values[key].traits.remove(key);
        }

        this.values[key] = visual;

        if (this.values[key])
        {
            this.values[key].traits.add(key);
        }
    }
}