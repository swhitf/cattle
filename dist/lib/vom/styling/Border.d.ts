export declare class Border {
    static readonly default: Border;
    readonly width: number;
    readonly color: string;
    readonly dash: number[];
    readonly offset: number;
    constructor(width?: number, color?: string, dash?: number[]);
    copy(changes?: Partial<Border>): Border;
}
