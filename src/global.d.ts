///<reference path="../node_modules/@types/reflect-metadata/index.d.ts" />

export interface ObjectIndex<T>
{
    [index:number]:T;
}

export interface ObjectMap<T>
{
    [index:string]:T;
}