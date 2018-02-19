export interface ObjectIndex<T>
{
    [index:number]:T;
}

export interface ObjectMap<T>
{
    [index:string]:T;
}

export interface Predicate<T>
{
    (x:T):boolean;
}

export interface BlankPredicate
{
    ():boolean;
}

export interface VoidCallback
{
    ():void;
}

export interface VoidCallback1<T>
{
    (a1:T):void;
}

export function when<T>(predicate:BlankPredicate, callback:VoidCallback):VoidCallback
{
    return function() 
    {
        if (predicate())
        {
            callback();
        }
    }
}