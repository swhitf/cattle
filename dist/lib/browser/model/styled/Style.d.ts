export declare function cascade(): PropertyDecorator;
export declare class Cascading<T> {
    readonly parent: T;
    constructor(parent?: T, values?: any);
}
export declare type TextAlignment = 'left' | 'center' | 'right';
export interface ValueFormatter {
    (value: string, visual: any): string;
}
export declare class Style extends Cascading<Style> {
    borderColor: string;
    fillColor: string;
    formatter: ValueFormatter;
    text: TextStyle;
}
export declare class TextStyle extends Cascading<TextStyle> {
    static Default: TextStyle;
    alignment: TextAlignment;
    color: string;
    font: string;
    size: number;
    style: string;
    variant: string;
    weight: string;
}
export declare const BaseStyle: Style;
