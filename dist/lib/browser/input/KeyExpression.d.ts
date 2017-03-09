export declare class KeyExpression {
    static parse(input: string): KeyExpression;
    readonly ctrl: boolean;
    readonly alt: boolean;
    readonly shift: boolean;
    readonly key: number;
    readonly exclusive: boolean;
    private constructor(keys, exclusive);
    matches(keyData: KeyExpression | KeyboardEvent): boolean;
}
