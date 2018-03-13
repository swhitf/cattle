import { GridElement } from './GridElement';
import { GridKernel } from './GridKernel';
export interface GridExtension {
    init(grid: GridElement, kernel: GridKernel): void;
}
/**
 * Do not use directly.
 */
export interface ClassDef<T> {
}
export declare function Dependency(name: string): any;
/**
 * A decorator that marks a method as a _command_; an externally callable logic block that performs a task.  A name
 * for the command can be optionally specified, otherwise the name of the method being exported as the command will be
 * used.
 * @param name The optional command name
 * @returns decorator
 */
export declare function Command(name?: string): any;
/**
 * A decorator that marks a method as a _routine_; a logic block that can be hooked into or overridden by other
 * modules.  A name for the routine can be optionally specified, otherwise the name of the method being exported
 * as the routine will be used.
 * @param name The optional routine name
 * @returns decorator
 */
export declare function Routine(name?: string): any;
/**
 * A decorator that marks a field as a _variable_; a readable and optionally writable value that can be consumed by
 * extensions.  A name for the variable can be optionally specified, otherwise the name of the field being exported
 * as the variable will be used.
 * @param name The optional variable name
 * @returns decorator
 */
export declare function Variable(mutable: boolean): any;
export declare function Variable(name?: string, mutable?: boolean): any;
