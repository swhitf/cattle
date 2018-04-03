import { Point } from '../../geom/Point';
import { Font } from '../styling/Font';
export declare class TextRuler {
    private static canvas;
    static measure(font: Font, text: string): Point;
}
