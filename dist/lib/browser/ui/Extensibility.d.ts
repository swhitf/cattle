import "reflect-metadata";
/**
 * Do not use directly.
 */
export interface ClassDef<T> {
}
/**
 * Function definition for a cell renderer function.
 */
export interface Renderer {
    (gfx: CanvasRenderingContext2D, visual: any): void;
}
/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs some task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
export declare function command(name?: string): MethodDecorator;
/**
 * A decorator that defines the render function for a GridCell implementation, allowing custom cell types
 * to control their drawing behavior.
 *
 * @param func
 * A decorator that marks a method
 */
export declare function renderer(func: Renderer): ClassDecorator;
/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
export declare function routine(name?: string): MethodDecorator;
/**
 * A decorator that marks a field as a _variable_; a readable and optionally writable value that can be consumed by
 * modules.  A name for the variable can be optionally specified, otherwise the name of the field being exported
 * as the variable will be used.
 * @param name The optional variable name
 * @returns decorator
 */
export declare function variable(mutable: boolean): PropertyDecorator;
export declare function variable(name?: string, mutable?: boolean): any;
/**
 * A decorator for use within implementations of GridCell that marks a field as one that affects the visual
 * appearance of the cell.  This will cause the value of the field to be mapped to the _Visual_ object
 * created before the cell is drawn.
 *
 * @returns decorator
 */
export declare function visualize(): PropertyDecorator;
