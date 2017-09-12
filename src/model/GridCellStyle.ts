import {  ObjectMap } from '../common';


const InstanceBuffer = {} as ObjectMap<GridCellStyle>;

enum Mutation { Add, Remove }

export class GridCellStyle
{
    public static get(...values:string[]):GridCellStyle
    {
        values = values.sort((a, b) => a > b ? 1 : -1);

        for (let i = 0; i < values.length; i++)
        {
            let a = values[i];
            let b = undefined as string;

            for (let j = i + 1; j < values.length; j++)
            {
                if (values[j] !== undefined)
                {
                    b = values[j];
                }
            }

            if (b !== undefined && a == b)
            {
                delete values[i];
                i = -1;
            }
        }

        let key = values.join('/');

        if (!InstanceBuffer[key])
        {
            InstanceBuffer[key] = new GridCellStyle(values);
        }

        return InstanceBuffer[key];
    }

    private constructor(private values:string[] = [])
    {
    }

    public get length():number
    {
        return this.values.length;
    }

    public item(index:number):string
    {
        return this.values[index];
    }

    public add(...input:string[]):GridCellStyle
    {
        return GridCellStyle.get(...this.values.concat(input));
    }

    public remove(...input:string[]):GridCellStyle
    {
        return GridCellStyle.get(...this.values.filter(x => input.indexOf(x) >= 0));
    }

    public toArray():string[]
    {
        return this.values.slice(0);
    }
}