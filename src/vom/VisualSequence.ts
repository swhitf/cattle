import { Visual } from './Visual';


export interface VisualSequenceCallback
{
    (v:Visual):boolean;
}

export class VisualSequence
{
    private lookup:{[key:number]:Node};
    private head:Node;
    private tail:Node;
    private list:Visual[];

    constructor(private root:Visual)
    {
        this.lookup = {};
        this.head = this.create(root, 0);
        this.update();
    }

    public get all():Visual[]
    {
        return this.list || (this.list = this.head.visual.toArray(true));
    }

    public dive(callback:VisualSequenceCallback):void
    {
        let node = this.tail;
        
        while (node && callback(node.visual))
        {
            node = node.prev;
        }
    }

    public climb(callback:VisualSequenceCallback):void
    {
        let node = this.head;
        
        while (node && callback(node.visual))
        {
            node = node.next;
        }
    }

    public invalidate(visual:Visual)
    {
        delete this.list;

        let node = this.lookup[visual.id];
        if (node)
        {
            this.truncate(node);
        }
    }

    public update():void
    {
        let node = this.head;

        while (true)
        {
            //If the node is dirty, it represents a visual who's composition has changed, so we to (re)expand the
            //node.  This will almost always alter the `next` property of the node.
            if (node.dirty)
            {
                node = this.expand(node);
            }

            if (node.next)
            {
                node = node.next;
            }
            else
            {
                this.tail = node;
                break;
            }
        }
    }

    private create(visual:Visual, depth:number):Node
    {
        let node = new Node(visual, depth);
        this.lookup[visual.id] = node;

        return node;
    }

    private expand(node:Node):Node
    {
        node.dirty = false;

        let visuals = node.visual.toArray();
        let subSeq = visuals
            .sort(create_z_sorter(visuals))
            .map(x => this.create(x, node.depth + 1));

        let p = node;
        let pn = p.next;

        for (let n of subSeq)
        {
            p.next = n;
            n.prev = p;
            p = this.expand(n);
        }

        p.next = pn;

        if (pn)
        {
            pn.prev = p;
        }

        return p;
    }

    private truncate(node:Node):void
    {
        node.dirty = true;

        let n = node.next;
        while (!!n && n.depth > node.depth)
        {
            delete this.lookup[n.visual.id];
            n = n.next;
        }

        if (n)
        {
            node.next = n;
            n.prev = node;
        }
        else
        {
            node.next = null;
            this.tail = node;
        }
    }
}

class Node
{
    constructor(public visual:Visual,
                public depth:number,
                public next:Node = null,
                public prev:Node = null,
                public dirty:boolean = true)
    {
    }
}

interface Sorter<T>
{
    (a:T, b:T):number;
}

function create_z_sorter(array:Visual[]):Sorter<Visual>
{
    //Create an index of the implicit orders
    let ii = {} as {[i:number]:number};
    array.forEach((v, i) => ii[v.id] = i);

    return (a, b) =>
    {
        let r = a.zIndex - b.zIndex;

        if (r === 0)
        {
            r = ii[a.id] - ii[b.id];
        }

        return r;
    };
}