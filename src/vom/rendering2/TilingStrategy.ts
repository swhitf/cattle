import { Rect } from '../../geom/Rect';
import { TileRef } from './TileRef';


export class TilingStrategy 
{
    public readonly w = TileRef.DW;
    public readonly h = TileRef.DH;

    public for(rect:Rect):TileRef[]
    {
        const { w, h } = this;

        const xf = (rect.left - (rect.left % w)) / w;
        const xt = (rect.right - (rect.right % w)) / w;

        const yf = (rect.top - (rect.top % h)) / h;
        const yt = (rect.bottom - (rect.bottom % h)) / h;

        const refs = [] as TileRef[];

        for (let x = xf; x <= xt; x++) 
        {
            for (let y = yf; y <= yt; y++) 
            {
                refs.push(new TileRef(x, y));
            }
        }

        return refs;
    }
}