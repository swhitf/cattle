import { Point, PointLike } from './Point';


export interface RectLike
{
    left:number;
    top:number;
    width:number;
    height:number;
}

export class Rect
{
    public static empty:Rect = new Rect(0, 0, 0, 0);

    public static fromEdges(left:number, top:number, right:number, bottom:number)
    {
        return new Rect(
            left,
            top,
            right - left,
            bottom - top
        );
    }

    public static fromLike(like:RectLike):Rect
    {
        return new Rect(like.left, like.top, like.width, like.height);
    }

    public static fromMany(rects:Rect[]):Rect
    {
        let points = [].concat.apply([], rects.map(x => x.points()));
        return Rect.fromPointBuffer(points);
    }
    
    public static fromPoints(...points:Point[])
    {
        return Rect.fromPointBuffer(points);
    }

    public static fromPointBuffer(points:Point[], index?:number, length?:number)
    {
        if (index !== undefined)
        {
            points = points.slice(index);
        }
        if (length !== undefined)
        {
            points = points.slice(0, length);
        }

        return Rect.fromEdges(
            Math.min(...points.map(p => p.x)),
            Math.min(...points.map(p => p.y)),
            Math.max(...points.map(p => p.x)),
            Math.max(...points.map(p => p.y))
        );
    }

    public readonly left:number = 0;
    public readonly top:number = 0;
    public readonly width:number = 0;
    public readonly height:number = 0;

    constructor(left:number, top:number, width:number, height:number)
    {
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
    }

    public get right()
    {
        return this.left + this.width;
    }

    public get bottom()
    {
        return this.top + this.height;
    }

    public center():Point
    {
        return new Point(this.left + (this.width / 2), this.top + (this.height / 2));
    }

    public topLeft():Point
    {
        return new Point(this.left, this.top);
    }

    public points():Point[]
    {
        return [
            new Point(this.left, this.top),
            new Point(this.right, this.top),
            new Point(this.right, this.bottom),
            new Point(this.left, this.bottom),
        ];
    }

    public size():Point
    {
        return new Point(this.width, this.height);
    }

    public offset(pt:PointLike):Rect
    {
        return new Rect(
            this.left + pt.x,
            this.top + pt.y,
            this.width,
            this.height);
    }

    public contains(input:Point|RectLike):boolean
    {
        if (input['x'] !== undefined && input['y'] !== undefined)
        {
            let pt = <Point>input;

            return (
                pt.x >= this.left
                && pt.y >= this.top
                && pt.x <= this.left + this.width
                && pt.y <= this.top + this.height
            );
        }
        else
        {
            let rect = <RectLike>input;

            return (
                rect.left >= this.left &&
                rect.top >= this.top &&
                rect.left + rect.width <= this.left + this.width &&
                rect.top + rect.height <= this.top + this.height
            );
        }
    }

    public inflate(size:PointLike):Rect
    {
        return new Rect(
            this.left - size.x,
            this.top - size.y,
            this.width + size.x,
            this.height + size.y
        );
    }

    public intersects(rect:RectLike):boolean
    {
        return rect.left + rect.width > this.left
            && rect.top + rect.height > this.top
            && rect.left < this.left + this.width
            && rect.top < this.top + this.height;
    }

    public normalize():Rect
    {
        if (this.width >= 0 && this.height >= 0)
        {
            return this;
        }

        var x = this.left;
        var y = this.top;
        var w = this.width;
        var h = this.height;

        if (w < 0)
        {
            x += w;
            w = Math.abs(w);
        }
        if (h < 0)
        {
            y += h;
            h = Math.abs(h);
        }

        return new Rect(x, y, w, h);
    }

    public toString():string
    {
        return `[${this.left}, ${this.top}, ${this.width}, ${this.height}]`;
    }
}