import { Visual } from './Visual';
import { EventEmitterBase } from '../..';
import { LinkedList } from 'typescript-collections';
import * as ResizeObserver from 'resize-observer-polyfill';

const observe = (entries?:any, observer?:any) => 
{
    let ro = ResizeObserver as any;
    return new ro(entries, observer)
}

export class Surface extends EventEmitterBase
{
    public static create(container:HTMLElement)
    {
        let canvas = container.ownerDocument.createElement('canvas');
        container.appendChild(canvas);
        
        return new Surface(container, canvas);
    }

    public readonly container:HTMLElement;
    public readonly canvas:HTMLCanvasElement;
    public readonly root:Visual;

    private sequence:LinkedList<Handle>;

    private dirty:boolean;
    private origin:Node;
    private top:Node;

    private constructor(container:HTMLElement, canvas:HTMLCanvasElement)
    {
        super();

        this.container = container;
        this.canvas = canvas;

        observe(this.onContainerResize.bind(this));
    }

    public get width():number
    {
        return this.canvas.width;
    }

    public get height():number
    {
        return this.canvas.height;
    }

    public render():void
    {
        this.performSequencing();
        this.performRender();
        this.dirty = false;

        this.emit('render', true);
    }

    private onContainerResize(entries:ResizeObserverEntry[]):void
    {
        for (const entry of entries) {
            const {left, top, width, height} = entry.contentRect;
    
            console.log('Element:', entry.target);
            console.log(`Element's size: ${ width }px x ${ height }px`);
            console.log(`Element's paddings: ${ top }px ; ${ left }px`);
        }
    }

    private performSequencing():void
    {
        //Begin at the origin node and loop over each node
        let node = this.origin;
        while (!!node)
        {
            //If the node is dirty, it represents a visual who's arrangement has changed, so we (re)expand the
            //node.  This will almost always alter the `next` property of the node.
            if (node.dirty)
            {
                node = this.expandNode(node);
            }

            node = node.next;
        }

        //TODO: Optimize this whole process
        //For now, ensure the list is doubly linked correctly by relinking the prev values
        node = this.origin;
        node.prev = null;
        while (!!node.next)
        {
            node.next.prev = node;
            this.top = node = node.next;
        } 

    }

    private expandNode(node:Node):Node
    {
        node.dirty = false;

        let visuals = node.visual.toArray();
        let sequence = visuals
            .sort(this.createVisualOrderSort(visuals))
            //.sort((a, b) => a.z - b.z)
            .map(x => this.createNode(x, node.depth + 1));

        let p = node;
        let pn = p.next;

        sequence.forEach(n =>
        {
            p.next = n;
            p = this.expandNode(n);
        });

        p.next = pn;
        return p;
    }

    private truncateNode(node:Node):void
    {
        node.dirty = true;

        let n = node.next;
        while (!!n && n.depth > node.depth)
        {
            this.nodeLookup.delete(n.visual);
            n = node.next = n.next;
        }
    }

    private performRender():void
    {
        
    }
}

class Root extends Visual
{
    
}

class Handle
{
    constructor(public visual:Visual,
                public depth:number,
                public next:Node = null,
                public prev:Node = null,
                public dirty:boolean = true)
    {
    }
}