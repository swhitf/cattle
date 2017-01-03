

export interface Visual
{
    left:number;

    top:number;

    width:number;

    height:number;
}

//export interface Visualizer<T>
//{
//    (model:T):Visual<T>;
//}
//
//export interface ClassDef<T>
//{
//    new(...args:T[]);
//}
//
//function visualizer<T>(visualizer:Visualizer<T>)
//{
//    return function(ctor:ClassDef<T>):void
//    {
//        //noinspection TypeScriptUnresolvedFunction
//        Reflect.defineMetadata("custom:visual", visualizer, ctor);
//    }
//}