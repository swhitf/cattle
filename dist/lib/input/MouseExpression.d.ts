export declare type MouseEventType = 'click' | 'dblclick' | 'mousedown' | 'mousemove' | 'mouseup' | 'dragbegin' | 'drag' | 'dragend';
export declare class MouseExpression {
    static parse(input: string): MouseExpression;
    readonly event: MouseEventType;
    readonly button: number;
    readonly keys: number[];
    readonly exclusive: boolean;
    private constructor();
    matches(mouseData: MouseEvent): boolean;
}
