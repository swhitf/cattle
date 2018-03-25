export declare type FontStyling = 'normal' | 'italic' | 'oblique';
export declare type FontVariant = 'normal' | 'small-caps';
export declare class Font {
    static readonly default: Font;
    readonly family: string;
    readonly size: number;
    readonly weight: number;
    readonly styling: FontStyling;
    readonly variant: FontVariant;
    constructor(family?: string, size?: number, weight?: number, styling?: FontStyling, variant?: FontVariant);
    copy(changes: Partial<Font>): Font;
    toString(): string;
}
