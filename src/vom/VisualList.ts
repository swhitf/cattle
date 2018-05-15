import { Visual } from './Visual';


export interface VisualIteratorCallback<R = void>
{
    (x:Visual, i:number):R;
}

export interface VisualCallback<R = void>
{
    (x:Visual):R;
}

export class VisualList 
{
    private count:number;
    private start:Node;
    private end:Node;
    private index:{[id:string]:Node} = {};

    public get size():number
    {
        return this.count;
    }

    public add(v:Visual):boolean
    {
        if (this.index[v.id]) return false;

        if (!this.end)
        {
            this.start = this.end = new Node(v);
        }
        else
        {
            const n = new Node(v);
            connect(this.end, n);
            
            this.end = n;
        }

        this.count++;
        this.index[v.id] = this.end;

        return true;
    }

    public remove(v:Visual):boolean
    {
        const n = this.index[v.id];
        if (!n) return false;

        connect(n.prev, n.next);
        if (n == this.start) this.start = n.next;
        if (n == this.end) this.end = n.prev;

        this.count--;
        delete this.index[v.id];
    }

    public contains(v:Visual):boolean
    {
        return !!this.index[v.id];
    }

    public forEach(callback:VisualIteratorCallback):void
    {
        let i = 0;
        for (let n = this.start; !!n; n = n.next)
        {
            callback(n.item, i++);
        }
    }

    public map<T>(callback:VisualIteratorCallback<T>):T[]
    {
        const arr = new Array<T>(this.count);
        this.forEach((v, i) => arr[i] = callback(v, i));
        return arr;
    }

    public filter(callback:VisualIteratorCallback<boolean>):Visual[]
    {
        const arr = new Array<Visual>();
        this.forEach((v, i) => {
            if (callback(v, i)) arr.push(v);
        });
        return arr;
    }

    public toArray():Visual[]
    {
        const arr = new Array<Visual>(this.count);
        this.forEach((v, i) => arr[i] = v);
        return arr;
    }
}

function connect(p?:Node, n?:Node)
{
    if (p) p.next = n;
    if (n) n.prev = p;
}

class Node
{
    constructor(public item:Visual, public prev?:Node, public next?:Node)
    {
    }
}