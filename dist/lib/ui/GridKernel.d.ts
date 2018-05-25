export interface GridCommand {
    (...args: any[]): void;
}
export interface GridCommandHub {
    /**
     * Defines the specified command for extensions or consumers to use.
     */
    define(command: string, impl: GridCommand): void;
    /**
     * Executes the specified grid command.
     */
    exec(command: string, ...args: any[]): void;
}
export interface GridVariable {
    get(): any;
    set?(value: any): void;
}
export interface GridVariableHub {
    /**
     * Defines the specified variable for extensions or consumers to use.
     */
    define(variable: string, impl: GridVariable): void;
    /**
     * Gets the value of the specified variable.
     */
    get(variable: string): any;
    /**
     * Sets the value of the specified variable.
     */
    set(variable: string, value: any): void;
}
export interface GridRoutineHook {
    (...args: any[]): void;
}
export interface GridRoutineOverride {
    (...args: any[]): any;
}
export interface GridRoutineHub {
    /**
     * Adds a hook to the specified signal that enables extensions to override grid behavior
     * defined in the core or other extensions.
     */
    hook(routine: string, callback: any): void;
    override(routine: string, callback: any): any;
    /**
     * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
     * should be supporting data or relevant objects to the routine.  The value returned will be `true`
     * if the routine has been overridden by an extension.
     */
    signal(routine: string, ...args: any[]): boolean;
}
/**
 * Implements the core of the Grid extensibility system.
 */
export declare class GridKernel {
    private emitter;
    readonly commands: GridCommandHub;
    readonly routines: GridRoutineHub;
    readonly variables: GridVariableHub;
    constructor(emitter: (event: string, ...args: any[]) => void);
    exportInterface(target?: any): any;
    install(ext: any): void;
}
