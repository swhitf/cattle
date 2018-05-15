


export type FontStyling = 'normal'|'italic'|'oblique';
export type FontVariant = 'normal'|'small-caps';

export class Font
{
    public static readonly default:Font = new Font();

    public readonly family:string;
    public readonly size:number;
    public readonly weight:number;
    public readonly styling:FontStyling;
    public readonly variant:FontVariant;

    constructor(family?:string, size?:number, weight?:number, styling?:FontStyling, variant?:FontVariant)
    {
        this.family = family || 'Arial';
        this.size = size || 14;
        this.weight = weight || 400;
        this.styling = styling || 'normal';
        this.variant = variant || 'normal';
    }

    public copy(changes:Partial<Font>)
    {
        return new Font(
            changes.family || this.family,
            changes.size || this.size,
            changes.weight || this.weight,
            changes.styling || this.styling,
            changes.variant || this.variant
        );
    }

    public toString():string
    {
        return `${this.styling} ${this.variant} ${this.weight} ${this.size}px ${this.family}`;
    }
}