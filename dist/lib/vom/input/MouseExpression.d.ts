import { VisualMouseEvent, VisualMouseEventTypes } from '../events/VisualMouseEvent';
import { Modifiers } from './Modifiers';
export declare class MouseExpression {
    static create(e: MouseEvent | VisualMouseEvent): MouseExpression;
    static parse(input: string): MouseExpression;
    readonly event: VisualMouseEventTypes;
    readonly button: number;
    readonly modifiers: Modifiers;
    readonly exact: boolean;
    readonly exclusive: boolean;
    private constructor();
    matches(input: MouseExpression | MouseEvent | VisualMouseEvent): boolean;
    toString(): string;
}
