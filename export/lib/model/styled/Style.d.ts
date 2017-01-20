export declare function cascade(): PropertyDecorator;
export declare type TextAlignment = 'left' | 'center' | 'right';
export declare class Style {
    readonly parent: Style;
    borderColor: string;
    fillColor: string;
    textAlignment: TextAlignment;
    textColor: string;
    textFont: string;
    textSize: number;
    constructor(parent?: Style, values?: any);
}
export declare const BaseStyle: Style;
