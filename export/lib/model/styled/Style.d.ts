export declare function cascade(): PropertyDecorator;
export declare type TextAlignment = 'left' | 'center' | 'right';
export interface ValueFormatter {
    (value: string): string;
}
export declare class Style {
    readonly parent: Style;
    borderColor: string;
    fillColor: string;
    formatter: ValueFormatter;
    textAlignment: TextAlignment;
    textColor: string;
    textFont: string;
    textSize: number;
    textStyle: string;
    textVariant: string;
    textWeight: string;
    constructor(parent?: Style, values?: any);
}
export declare const BaseStyle: Style;
