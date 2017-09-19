import { Rect } from '../geom/Rect';
import { Point, PointInput } from '../geom/Point';
import { Visual, VisualPredicate } from './Visual';
import { Matrix } from '../geom/Matrix';
import { Camera } from './Camera';


export class DefaultCamera implements Camera
{
    public id:string;

    public order:number;

    public offsetLeft:number;

    public offsetTop:number;

    public left:number;

    public top:number;

    public width:number;

    public height:number;

    public transform:Matrix;

    constructor(id:string, order:number, offset:Point, view:Rect)
    {
        this.id = id;
        this.order = order;
        this.offsetLeft = offset.x;
        this.offsetTop = offset.y;
        this.left = view.left;
        this.top = view.top;
        this.width = view.width;
        this.height = view.height;
        this.transform = Matrix.identity.translate(view.left, view.top).inverse()
    }

    public toSurfacePoint(viewPt:PointInput):Point
    {
        return this.transform
            .inverse()
            .apply(Point.create(viewPt));
    }

    public toViewPoint(surfacePt:PointInput):Point
    {
        return this.transform.apply(Point.create(surfacePt));
    }
}