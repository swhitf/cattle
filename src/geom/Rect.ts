import { Point, PointLike, PointInput } from './Point';


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

    public static fromMany(rects:RectLike[]):Rect
    {
        let points = [].concat.apply([], rects.map(x => Rect.prototype.points.call(x)));
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
            new Point(this.left + this.width, this.top),
            new Point(this.left + this.width, this.top + this.height),
            new Point(this.left, this.top + this.height),
        ];
    }

    public size():Point
    {
        return new Point(this.width, this.height);
    }

    public contains(input:PointLike|RectLike):boolean
    {
        if (input['x'] !== undefined && input['y'] !== undefined)
        {
            let pt = <PointLike>input;

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

    public extend(size:PointInput):Rect
    {
        let pt = Point.create(size);

        return new Rect(
            this.left,
            this.top,
            this.width + pt.x,
            this.height + pt.y,
        );
    }

    public inflate(size:PointInput):Rect
    {
        let pt = Point.create(size);
        
        return Rect.fromEdges(
            this.left - pt.x,
            this.top - pt.y,
            this.right + pt.x,
            this.bottom + pt.y
        );
    }

    public offset(by:PointInput):Rect
    {
        let pt = Point.create(by);

        return new Rect(
            this.left + pt.x,
            this.top + pt.y,
            this.width,
            this.height
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