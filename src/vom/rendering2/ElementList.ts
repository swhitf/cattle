//@no-export
import { Element } from './Element';
import { Key } from './Key';


export interface ElementListCallback<R = void>
{
    (elmt:Element, index:number):R
}

export class ElementList
{
    private array = [] as Element[];
    private index = {} as { [id:string]:Element };

    public add(elmt:Element):void
    {
        const { array, index } = this;

        if (index[elmt.key.id]) 
        {
            throw new Error(`Element ${elmt.key.id} already added to list.`);
        }

        index[elmt.key.id] = elmt;

        for (let i = 0; i < array.length; i++)
        {
            if (array[i].key.sort <= elmt.key.sort)
            {
                continue;
            }
            else
            {
                array.splice(i, 0, elmt);
                return;
            }
        }

        array.push(elmt);
    }

    public remove(elmt:Element):void
    {
        this.delete(elmt.key);
    }

    public removeWhere(predicate:ElementListCallback<boolean>):Element[]
    {
        let output = [];

        this.array = this.array.filter((elmt, i) => 
        {
            if (predicate(elmt, i))
            {
                output.push(elmt);
                delete this.index[elmt.key.id];
                return false;
            }

            return true;
        });

        return output;
    }

    public get(key:Key):Element
    {
        return this.index[key.id] || null;
    }

    public delete(key:Key):Element
    {
        const { array, index } = this;
        const elmt = index[key.id];
        
        if (elmt)
        {
            array.splice(array.indexOf(elmt), 1);
            delete index[key.id];
        }

        return elmt;
    }

    public forEach(callback:ElementListCallback):void
    {
        this.array.forEach(callback);
    }
}