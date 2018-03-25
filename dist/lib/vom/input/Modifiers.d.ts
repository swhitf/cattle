export declare class Modifiers {
    static create(e: MouseEvent | KeyboardEvent): Modifiers;
    static parse(input: string): Modifiers;
    readonly alt: boolean;
    readonly ctrl: boolean;
    readonly shift: boolean;
    constructor(alt: boolean, ctrl: boolean, shift: boolean);
    readonly any: boolean;
    matches(other: Modifiers): boolean;
    matchesExact(other: Modifiers): boolean;
}
