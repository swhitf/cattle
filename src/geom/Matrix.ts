import { Point } from './Point';


export enum AngleUnits
{
    Radians = 1,
    Degrees = 2,
}

export class Matrix
{
    public static identity:Matrix = new Matrix();
    
    public readonly a:number;
    public readonly b:number;
    public readonly c:number;
    public readonly d:number;
    public readonly e:number;
    public readonly f:number;

    constructor(a:number = 1, b:number = 0, c:number = 0, d:number = 1, e:number = 0, f:number = 0)
    {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
    }

    public isIdentity():boolean
    {
        return this.equals(Matrix.identity);
    }

    public isInvertible():boolean
    {
        return !this._q(this.determinant(), 0)
    }

    public determinant():number
    {
        return this.a * this.d - this.b * this.c
    }

    public equals(m:Matrix):boolean
    {
        const q = this._q;

        return (
            q(this.a, m.a) && q(this.b, m.b) &&
            q(this.c, m.c) && q(this.d, m.d) &&
            q(this.e, m.e) && q(this.f, m.f)
        )
    }

    public apply(pt:Point):Point
    {
        return new Point(
            pt.x * this.a + pt.y * this.c + this.e,
            pt.x * this.b + pt.y * this.d + this.f
        );
    }

    public concat(cm:Matrix):Matrix
    {
        return this.clone().multiply(cm)
    }

    public clone():Matrix
    {
        return new Matrix().multiply(this);
    }

    public transform(a2, b2, c2, d2, e2, f2):Matrix
    {
        const a1 = this.a;
        const b1 = this.b;
        const c1 = this.c;
        const d1 = this.d;
        const e1 = this.e;
        const f1 = this.f;

        const a = a1 * a2 + c1 * b2;
        const b = b1 * a2 + d1 * b2;
        const c = a1 * c2 + c1 * d2;
        const d = b1 * c2 + d1 * d2;
        const e = a1 * e2 + c1 * f2 + e1;
        const f = b1 * e2 + d1 * f2 + f1;

        return new Matrix(a, b, c, d, e, f);
    };

    public multiply(m:Matrix):Matrix
    {
        return this.transform(m.a, m.b, m.c, m.d, m.e, m.f)
    }

    public divide(m:Matrix):Matrix
    {
        if (!m.isInvertible())
        {
            throw "Matrix not invertible";
        }

        return this.multiply(m.inverse())
    }

    public divideScalar(dv:number):Matrix
    {
        let a = this.a / dv;
        let b = this.b / dv;
        let c = this.c / dv;
        let d = this.d / dv;
        let e = this.e / dv;
        let f = this.f / dv;

        return new Matrix(a, b, c, d, e, f);
    }

    public scale(f:number):Matrix
    {
        return this.transform(f, 0, 0, f, 0, 0);
    }

    public translate(tx:number, ty:number):Matrix
    {
        return this.transform(1, 0, 0, 1, tx, ty);
    }

    public rotate(angle:number, unit:AngleUnits = AngleUnits.Radians):Matrix
    {
        if (unit === AngleUnits.Degrees)
        {
            return this.rotate(angle * Math.PI / 180);
        }

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return this.transform(cos, sin, -sin, cos, 0, 0)
    }

    public inverse():Matrix
    {
        const dt = this.determinant();

        if (this._q(dt, 0))
        {
            throw "Matrix not invertible.";
        }

        let a = this.d / dt;
        let b = -this.b / dt;
        let c = -this.c / dt;
        let d = this.a / dt;
        let e = (this.c * this.f - this.d * this.e) / dt;
        let f = -(this.a * this.f - this.b * this.e) / dt;

        return new Matrix(a, b, c, d, e, f);
    }

    public toArray():number[]
    {
        return [this.a, this.b, this.c, this.d, this.e, this.f];
    }

    public toCSS():string
    {
        return `matrix(${this.toArray()})`;
    }

    public toCSS3D():string
    {
        return `matrix3d(${this.a}, ${this.b}, 0, 0, ${this.c}, ${this.d}, 0, 0, 0, 0, 1, 0, ${this.e}, ${this.f}, 0, 1)`;
    }

    private _q(f1:number, f2:number):boolean
    {
        return Math.abs(f1 - f2) < 1e-14
    }
}