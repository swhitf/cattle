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

export interface VoidCallback
{
    ():void;
}