import { GridModel } from './GridModel';
import { GridModelIndex } from './GridModelIndex';
import { Range } from './Range';
import { Point } from '../geom/Point';
import { Rect } from '../geom/Rect';


export class Query
{
    public static over(model:GridModel):Query
    {
        return new Query(model);
    }

    private constructor(private model:GridModel)
    {
    }

    public vector(from:Point, to:Point, toInclusive:boolean = false):Range
    {
        if (toInclusive)
        {
            to = to.add(1);
        }

        let index = new GridModelIndex(this.model);
        let dims = Rect.fromPoints(from, to);
        let results = [] as string[];

        for (let r = dims.top; r < dims.bottom; r++)
        {
            for (let c = dims.left; c < dims.right; c++)
            {
                let cell = index.locateCell(c, r);
                if (cell)
                {
                    results.push(cell.ref);
                }
            }
        }

        return Range.create(this.model, results);
    }
}