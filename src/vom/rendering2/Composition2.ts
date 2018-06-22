import { KeyedSet } from '../../base/KeyedSet';
import { Matrix } from '../../geom/Matrix';
import { Point } from '../../geom/Point';
import { Rect } from '../../geom/Rect';
import { Report } from '../rendering/Report';
import { Element } from './Element';
import { Key } from './Key';
import { Tile } from './Tile';
import { TileRef } from './TileRef';


export interface CompositionTile
{
    readonly id:string;
    readonly area:Rect;

    retain:boolean;
    invalid:boolean;
}

export interface CompositionBuffer
{
    recycled:boolean;

    dim(width:number, height:number):boolean;

    draw(callback:(gfx:CanvasRenderingContext2D) => void);
}

export interface CompositionElement
{
    invalid:boolean;

    arrange(rect:Rect):void;

    draw(callback:(gfx:CanvasRenderingContext2D) => void);
}

export class Composition2 
{
    private tiles:KeyedSet<Tile> = new KeyedSet<Tile>(x => x.id);
    private elements:KeyedSet<Element> = new KeyedSet<Element>(x => x.id);

    public beginUpdate():void
    {
        for (let i = 0; i < this.tiles.size; i++) {
            let a = 1 + 2;
        }

        for (let i = 0; i < this.elements.size; i++) {
            let a = 1 + 2;
        }

        console.log(this.tiles.size);
        console.log(this.elements.size);

        this.tiles.forEach(x => x.retain = false);
        this.elements.forEach(x => x.retain = false);
    }

    public endUpdate():void
    {
        const dead = this.elements.removeWhere(x => !x.retain);
        dead.forEach(e => this.tiles.forEach(t => t.invalidate(e.area)));

        this.tiles.removeWhere(x => {
            if (x.retain) {
                if (x.invalid) {
                    Report.time('Tile.Draw', () => x.draw(this.elements));
                }
                return false;
            }
            return true;
        });
    }

    public tile(ref:TileRef):CompositionTile
    {
        const { tiles } = this;
        
        let t = tiles.get(ref.s);
        if (!t) 
        {
            t = new Tile(ref);
            tiles.add(t);
        }

        t.retain = true;
        return t;
    }

    public element(id:string, depth:number):CompositionElement
    {
        const { elements } = this;
        
        let e = elements.get(id);
        if (!e) 
        {
            e = new Element(new Key(id, depth), this.invalidate.bind(this));
            elements.add(e);
        }

        e.retain = true;
        return e;
    }

    public render(view:HTMLCanvasElement, bounds:Rect, vector:Point):void
    {
        const gfx = view.getContext('2d');
        const camArea = new Rect(vector.x, vector.y, bounds.width, bounds.height);

        this.tiles.forEach(x => 
        {
            if (x.invalid) throw 'Cannot have invalid tiles at render point';
            if (!x.area.intersects(camArea)) return;
            
            const t = Matrix.identity
                .translate(vector.x, vector.y).inverse()
                .translate(x.area.left, x.area.top)
                .translate(bounds.left, bounds.top)
            ;

            gfx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
            x.buffer.drawTo(gfx, bounds);
        });
    }

    private invalidate(rect:Rect):void 
    {
        this.tiles.forEach(x => x.invalidate(rect));
    }
}