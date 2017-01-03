import { ObjectIndex, ObjectMap } from '../global';


export function extend(target:any, data:any):any
{
    for (let k in data)
    {
        target[k] = data[k];
    }

    return target;
}

export function index<T>(arr:T[], indexer:(tm:T) => number|string):ObjectMap<T>
{
    let obj = {};

    for (let tm of arr)
    {
        obj[indexer(tm)] = tm;
    }

    return obj;
}

export function values<T>(ix:ObjectIndex<T>|ObjectMap<T>):T[]
{
    let a:T[] = [];

    for (let k in ix)
    {
        a.push(ix[k]);
    }

    return a;
}

export function zipPairs(pairs:any[][]):any
{
    let obj = {};

    for (let pair of pairs)
    {
        obj[pair[0]] = pair[1];
    }

    return obj;
}

export function unzipPairs(pairs:any):any[][]
{
    let arr = [];

    for (let key in pairs)
    {
        arr.push([key, pairs[key]]);
    }

    return arr;
}
