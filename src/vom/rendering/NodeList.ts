//@no-export
import { Key } from './Key';
import { Node } from './Node';


export interface NodeListCallback<R = void>
{
    (node:Node, index:number):R
}

export class NodeList
{
    private array = [] as Node[];
    private index = {} as { [id:string]:Node };

    public add(node:Node):void
    {
        const { array, index } = this;

        if (index[node.key.id]) 
        {
            throw new Error(`Node ${node.key.id} already added to list.`);
        }

        index[node.key.id] = node;

        for (let i = 0; i < array.length; i++)
        {
            if (array[i].key.sort <= node.key.sort)
            {
                continue;
            }
            else
            {
                array.splice(i, 0, node);
                return;
            }
        }

        array.push(node);
    }

    public remove(node:Node):void
    {
        this.delete(node.key);
    }

    public removeWhere(predicate:NodeListCallback<boolean>):Node[]
    {
        let output = [];

        this.array = this.array.filter((node, i) => 
        {
            if (predicate(node, i))
            {
                output.push(node);
                delete this.index[node.key.id];
                return false;
            }

            return true;
        });

        return output;
    }

    public get(key:Key):Node
    {
        return this.index[key.id] || null;
    }

    public delete(key:Key):Node
    {
        const { array, index } = this;
        const node = index[key.id];
        
        if (node)
        {
            array.splice(array.indexOf(node), 1);
            delete index[key.id];
        }

        return node;
    }

    public forEach(callback:NodeListCallback):void
    {
        this.array.forEach(callback);
    }
}