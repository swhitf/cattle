import {GridCell} from '../../model/GridCell';
import { GridModel } from "../../model/GridModel";


export interface GridChangeSetEntry
{
    readonly ref:string;
    readonly value:string;
    readonly cascaded?:boolean;
}

export class GridChangeSet
{
    private readonly map = {} as { [ref:string]:GridChangeSetEntry };
    private readonly list = [] as GridChangeSetEntry[];

    public get length():number
    {
        return this.list.length;
    }

    public has(ref:string):boolean
    {
        return !!this.map[ref];
    }

    public get(ref:string):GridChangeSetEntry
    {
        return this.map[ref];
    }

    public set(ref:string, value:string, cascaded?:boolean):void
    {
        this.delete(ref);

        let entry = { ref, value, cascaded: !!cascaded };

        this.map[ref] = entry;
        this.list.push(entry);
    }

    public delete(ref:string):boolean
    {
        if (this.has(ref))
        {
            let entry = this.map[ref];
            let idx = this.list.indexOf(entry);            

            delete this.map[ref];
            this.list.splice(idx, 1);

            return true;
        }

        return false;
    }

    public value(ref:string):string
    {
        let entry = this.map[ref];
        return !!entry ? entry.value : undefined;
    }

    public refs():string[]
    {
        return Object.keys(this.map);
    }

    public apply(model:GridModel):void
    {
        for (let ref in this.map)
        {
            let tm = this.map[ref];
            let cell = model.findCell(ref);

            //Do not apply a non-cascaded readonly cell
            if (is_readonly(cell) && !tm.cascaded)
                continue;

            cell.value = tm.value;
        }
    }
}

function is_readonly(cell:GridCell):boolean
{
    return cell['readonly'] === true || cell['editable'] === false;
}