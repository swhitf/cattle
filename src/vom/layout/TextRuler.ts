import { Point } from '../../geom/Point';
import { Font } from '../styling/Font';


const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 1;

export class TextRuler 
{	
    public static measure(font:Font, text:string):Point
    {        
        const gfx = canvas.getContext('2d');
        const tm = gfx.measureText(text);
        return new Point(tm.width, font.size);
    }
}