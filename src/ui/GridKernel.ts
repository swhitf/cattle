//This keeps WebStorm quiet, for some reason it is complaining...
declare var Reflect:any;


export interface GridCommand
{
    (...args:any[]):void;
}

export interface GridCommandHub
{
    /**
     * Defines the specified command for extensions or consumers to use.
     */
    define(command:string, impl:GridCommand):void;

    /**
     * Executes the specified grid command.
     */
    exec(command:string, ...args:any[]):void;
}

export interface GridVariable
{
    get():any;
    set?(value:any):void;
}

export interface GridVariableHub
{
    /**
     * Defines the specified variable for extensions or consumers to use.
     */
    define(variable:string, impl:GridVariable):void;

    /**
     * Gets the value of the specified variable.
     */
    get(variable:string):any;

    /**
     * Sets the value of the specified variable.
     */
    set(variable:string, value:any):void;
}

export interface GridRoutineHook
{
    (...args:any[]):void;
}

export interface GridRoutineOverride
{
    (...args:any[]):any;
}

export interface GridRoutineHub
{
    /**
     * Adds a hook to the specified signal that enables extensions to override grid behavior
     * defined in the core or other extensions.
     */
    hook(routine:string, callback:any):void;

    override(routine:string, callback:any):any;

    /**
     * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
     * should be supporting data or relevant objects to the routine.  The value returned will be `true`
     * if the routine has been overridden by an extension.
     */
    signal(routine:string, ...args:any[]):boolean;
}

/**
 * Implements the core of the Grid extensibility system.
 */
export class GridKernel
{
    public readonly commands:GridCommandHub = new GridKernelCommandHubImpl();
    public readonly routines:GridRoutineHub = new GridKernelRoutineHubImpl();
    public readonly variables:GridVariableHub = new GridKernelVariableHubImpl();

    constructor(private emitter:(event:string, ...args:any[]) => void)
    {
    }

    public install(ext:any):void
    {
        let { commands, variables } = this;

        if (ext['__kernel'])
        {
            throw 'Extension appears to have already been installed into this or another grid...?';
        }

        ext['__kernel'] = this;

        let cmds = Reflect.getMetadata('grid:commands', ext) || [];
        for (let c of cmds)
        {
            commands.define(c.name, c.impl.bind(ext));
        }

        let vars = Reflect.getMetadata('grid:variables', ext) || [];
        for (let v of vars)
        {
            variables.define(v.name, {
                get: (function() { return this[v.key]; }).bind(ext),
                set: !!v.mutable ? (function(val) { this[v.key] = val; }).bind(ext) : undefined,
            });
        }
    }
}

class GridKernelCommandHubImpl implements GridCommandHub
{
    private store:ObjectMap<GridCommand> = {};

    /**
     * Defines the specified command for extensions or consumers to use.
     */
    public define(command:string, impl:GridCommand):void
    {
        if (this.store[command])
        {
            throw 'Command with name already registered: ' + command;
        }

        this.store[command] = impl;
    }

    /**
     * Executes the specified grid command.
     */
    public exec(command:string, ...args:any[]):void
    {
        let impl = this.store[command];
        if (impl)
        {
            impl.apply(this, args);
        }
        else
        {
            throw 'Unrecognized command: ' + command;
        }
    }
}

class GridKernelRoutineHubImpl implements GridRoutineHub
{
    private hooks:ObjectMap<GridRoutineHook[]> = {};
    private overrides:ObjectMap<GridRoutineOverride> = {};

    /**
     * Adds a hook to the specified signal that enables extensions to override grid behavior
     * defined in the core or other extensions.
     */
    public hook(routine:string, callback:GridRoutineHook):void
    {
        let list = this.hooks[routine] || (this.hooks[routine] = []);
        list.push(callback);
    }

    public override(routine:string, callback:GridRoutineOverride):void
    {
        this.overrides[routine] = callback;
    }

    /**
     * Signals that a routine is about to run that can be hooked or overridden by extensions.  Arguments
     * should be supporting data or relevant objects to the routine.  The value returned will be `true`
     * if the routine has been overridden by an extension.
     */
    public signal(routine:string, args:any[], impl:Function):any
    {
        this.invokeHooks(`before:${routine}`, args);

        if (!!this.overrides[routine])
        {
            args.push(impl);
            impl = this.overrides[routine];
        }

        let result = impl.apply(this, args);

        this.invokeHooks(routine, args);
        this.invokeHooks(`after:${routine}`, args);

        return result;
    }

    private invokeHooks(routine:string, args:any[]):void
    {
        let list = this.hooks[routine];

        if (list)
        {
            for (let hook of list)
            {
                hook.apply(this, args);
            }
        }
    }
}

class GridKernelVariableHubImpl implements GridVariableHub
{
    private store:ObjectMap<GridVariable> = {};

    /**
     * Defines the specified variable for extensions or consumers to use.
     */
    public define(variable:string, impl:GridVariable):void
    {
        if (this.store[variable])
        {
            throw 'Variable with name already registered: ' + variable;
        }

        this.store[variable] = impl;
    }

    /**
     * Gets the value of the specified variable.
     */
    public get(variable:string):any
    {
        let impl = this.store[variable];
        if (impl)
        {
            return impl.get();
        }

        throw 'Unrecognized variable: ' + variable;
    }

    /**
     * Sets the value of the specified variable.
     */
    public set(variable:string, value:any):void
    {
        let impl = this.store[variable];
        if (impl)
        {
            if (impl.set)
            {
                impl.set(value);
            }
            else
            {
                throw 'Cannot set readonly variable: ' + variable;
            }
        }
        else
        {
            throw 'Unrecognized variable: ' + variable;
        }
    }
}