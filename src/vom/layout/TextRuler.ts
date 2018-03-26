import { Point } from '../../geom/Point';
import { Font } from '../styling/Font';


export class TextRuler
{
    private static canvas:HTMLCanvasElement;

    public static measure(font:Font, text:string):Point
    {
        if (!this.canvas)
        {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.canvas.height = 1;
        }

        const gfx = this.canvas.getContext('2d');
        gfx.font = font.toString();
        
        const tm = gfx.measureText(text);

        return new Point(tm.width, font.size);
    }
}