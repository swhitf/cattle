import { GridCell } from '../../model/GridCell';
import { GridModel } from '../../model/GridModel';


export interface GridChangeSetEntry
{
    readonly ref:string;
    readonly value:string;
    readonly cascaded?:boolean;
}

export interface GridChangeSetCallback<R = void>
{
    (entry:GridChangeSetEntry):R;
}

export class GridChangeSet
{
    private readonly index = {} as { [ref:string]:GridChangeSetEntry };
    private readonly list = [] as GridChangeSetEntry[];

    public get length():number
    {
        return this.list.length;
    }

    public has(ref:string):boolean
    {
        return !!this.index[ref];
    }

    public get(ref:string):GridChangeSetEntry
    {
        return this.index[ref];
    }

    public set(ref:string, value:string, cascaded?:boolean):void
    {
        this.delete(ref);

        let entry = { ref, value, cascaded: !!cascaded };

        this.index[ref] = entry;
        this.list.push(entry);
    }

    public delete(ref:string):boolean
    {
        if (this.has(ref))
        {
            let entry = this.index[ref];
            let idx = this.list.indexOf(entry);            

            delete this.index[ref];
            this.list.splice(idx, 1);

            return true;
        }

        return false;
    }

    public value(ref:string):string
    {
        let entry = this.index[ref];
        return !!entry ? entry.value : undefined;
    }

    public refs():string[]
    {
        return Object.keys(this.index);
    }

    public apply(model:GridModel):void
    {   
        let updStarted = false;

        for (let ref in this.index)
        {
            let tm = this.index[ref];
            let cell = model.findCell(ref);

            //Do not apply a non-cascaded readonly cell
            if (is_readonly(cell) && !tm.cascaded)
                continue;

            if (!updStarted) 
            {
                model.beginUpdate();
                updStarted = true;
            }

            cell.value = tm.value;
        }

        if (updStarted) 
        {
            model.endUpdate();
        }
    }

    public forEach(callback:GridChangeSetCallback):void
    {
        this.list.forEach(callback);
    }

    public filter(callback:GridChangeSetCallback<boolean>):GridChangeSetEntry[]
    {
        return this.list.filter(x => callback(x));
    }

    public map<T>(callback:GridChangeSetCallback<T>):T[]
    {
        return this.list.map(callback);
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['editable'] === false;
}