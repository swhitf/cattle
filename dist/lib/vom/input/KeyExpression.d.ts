import { VisualKeyboardEvent } from '../events/VisualKeyboardEvent';
import { Modifiers } from './Modifiers';
export declare class KeyExpression {
    static create(e: KeyboardEvent | VisualKeyboardEvent): KeyExpression;
    static parse(input: string): KeyExpression;
    readonly event: string;
    readonly key: number;
    readonly modifiers: Modifiers;
    readonly exact: boolean;
    readonly exclusive: boolean;
    private constructor();
    matches(input: KeyExpression | KeyboardEvent | VisualKeyboardEvent): boolean;
    toString(): string;
}
