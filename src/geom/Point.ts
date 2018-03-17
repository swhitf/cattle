

export interface PointLike 
{
    x:number;
    y:number;
}

export type BrowserPoint = { left:number; top:number; };
export type PointInput = number[]|Point|PointLike|BrowserPoint;

export class Point implements PointLike
{
    public readonly x:number = 0;
    public readonly y:number = 0;

    public static rad2deg:number = 360 / (Math.PI * 2);
    public static deg2rad:number = (Math.PI * 2) / 360;

    public static empty = new Point(0, 0);
    public static max = new Point(2147483647, 2147483647);
    public static min = new Point(-2147483647, -2147483647);
    public static up = new Point(0, -1);

    public static average(points:PointLike[]):Point
    {
        if (!points.length)
        {
            return Point.empty;
        }

        let x = 0, y = 0;

        points.forEach(p =>
        {
            x += p.x;
            y += p.y;
        });

        return new Point(x / points.length, y / points.length);
    }

    public static direction(from:PointInput, to:PointInput):Point
    {
        return ptArg(to).subtract(from).normalize();
    }
    
    public static create(source:PointInput):Point
    {
        return ptArg(source);
    }

    public static fromBuffer(buffer:number[], index:number = 0):Point
    {
        return new Point(buffer[index], buffer[index + 1]);
    }

    constructor(x:number|number[], y?:number)
    {
        if (Array.isArray(x))
        {
            this.x = (x[0]);
            this.y = (x[1]);
        }
        else
        {
            this.x = (<number>x);
            this.y = (y);
        }
    }

    public get left():number 
    {
        return this.x;
    }

    public get top():number 
    {
        return this.y;
    }

    //region Geometry

    public angle():number
    {
        return (this.x < 0)
            ? 360 - Math.atan2(this.x, -this.y) * Point.rad2deg * -1
            : Math.atan2(this.x, -this.y) * Point.rad2deg;
    }

    public angleAbout(val:PointInput):number
    {
        let pt = ptArg(val);
        return Math.atan2(pt.cross(this), pt.dot(this));
    }

    public cross(val:PointInput):number
    {
        let pt = ptArg(val);
        return this.x * pt.y - this.y * pt.x;
    }

    public distance(to:PointInput):number
    {
        let pt = ptArg(to);
        let a = this.x - pt.x;
        let b = this.y - pt.y;
        return Math.sqrt(a * a + b * b);
    }

    public dot(val:PointInput):number
    {
        let pt = ptArg(val);
        return this.x * pt.x + this.y * pt.y;
    }

    public length():number
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normalize():Point
    {
        let len = this.length();
        if (len > 0.00001)
        {
            return this.multiply(1 / len);
        }

        return this.clone();
    }

    public perp():Point
    {
        return new Point(this.y * -1, this.x);
    }

    public rperp():Point
    {
        return this.reverse().perp();
    }

    public inverse()
    {
        return new Point(this.x * -1, this.y * -1);
    }

    public reverse():Point
    {
        return new Point(this.x * -1, this.y * -1);
    }

    public rotate(radians:number):Point
    {
        let cos = Math.cos(radians);
        let sin = Math.sin(radians);
        let nx = this.x * cos - this.y * sin;
        let ny = this.y * cos + this.x * sin;

        return new Point(nx, ny);
    }

    //endregion

    //region Arithmetic

    public add(val:number|PointInput):Point
    {
        let pt = ptArg(val);
        if (!pt) 
        {
            throw 'add: pt required.';
        }

        return new Point(this.x + pt.x, this.y + pt.y);
    }

    public divide(divisor:number):Point
    {
        return new Point(this.x / divisor, this.y / divisor);
    }

    public multiply(multipler:number):Point
    {
        return new Point(this.x * multipler, this.y * multipler);
    }

    public round():Point
    {
        return new Point(Math.round(this.x), Math.round(this.y));
    }

    public subtract(val:number|PointInput):Point
    {
        let pt = ptArg(val);
        if (!pt) 
        {
            throw 'subtract: pt required.';
        }

        return this.add(pt.reverse());
    }

    public clamp(lower:Point, upper:Point):Point
    {
        let x = this.x;
        if (x < lower.x) x = lower.x;
        if (x > upper.x) x = upper.x;

        let y = this.y;
        if (y < lower.y) y = lower.y;
        if (y > upper.y) y = upper.y;

        return new Point(x, y);
    }

    //endregion

    //region Conversion

    public clone():Point
    {
        return new Point(this.x, this.y);
    }

    public equals(another:PointLike):boolean
    {
        return this.x === another.x && this.y === another.y;
    }

    public toArray():number[]
    {
        return [this.x, this.y];
    }

    public toString():string
    {
        return `[${this.x}, ${this.y}]`;
    }

    //endregion
}

function ptArg(val:any):Point
{
    if (val !== null || val !== undefined)
    {
        if (val instanceof Point)
        {
            return <Point>val;
        }
        if (val.x !== undefined && val.y !== undefined)
        {
            return new Point(val.x, val.y);
        }
        if (val.left !== undefined && val.top !== undefined)
        {
            return new Point(val.left, val.top);
        }
        if (Array.isArray(val))
        {
            return new Point(<number[]>val);
        }
        if (typeof(val) === 'string')
        {
            val = parseInt(val);
        }
        if (typeof(val) === 'number')
        {
            return new Point(val, val);
        }
    }

    return Point.empty;
}