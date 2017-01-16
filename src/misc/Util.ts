

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

export function keys<T>(ix:ObjectIndex<T>|ObjectMap<T>):string[]
{
    return Object.keys(ix);
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

export function max<T>(arr:T[], selector:(t:T) => number):T
{
    if (arr.length === 0)
        return null;

    let t = arr[0];

    for (let x of arr)
    {
        if (selector(t) < selector(x))
        {
            t = x;
        }
    }

    return t;
}

export function shadowClone(target:any):any
{
    if (typeof(target) === 'object')
    {
        let sc = {} as any;

        for (let prop in target)
        {
            sc[prop] = shadowClone(target[prop]);
        }

        return sc;
    }

    return target;
}