

export interface KeyedSetItemCallback<T, R = void> 
{
    (tm:T, index:number):R;
}

export interface KeyedSetItemReduceCallback<T, R = T> 
{
    (prev:R, curr:T, index:number, array:T[]):R;
}

export class KeyedSet<T> 
{
    protected list = [] as T[];    
    protected index = {} as any;

    constructor(protected indexer:(t:T) => number|string) 
    {
    }

    public get array():T[] 
    {
        return this.list;
    }

    public get size():number 
    {
        return this.list.length;
    }    

    public add(value:T):boolean 
    {
        let key = this.indexer(value);
        if (this.index[key]) 
        {
            return false;
        }
        else 
        {
            this.index[key] = value;
            this.list.push(value);
            return true;
        }
    }

    public merge(value:T):void
    {
        let key = this.indexer(value);
        if (this.index[key]) 
        {
            Object.assign(this.index[key], value);
        }
        else 
        {
            this.add(value);
        }
    }

    public clear():void 
    {
        this.index = {};
        this.list = [];
    }

    public delete(key:number|string):boolean 
    {
        let value = this.get(key);
        if (value) 
        {
            let i = this.list.indexOf(value);
            delete this.index[key];
            this.list.splice(i, 1);
            return true;
        }
        else 
        {
            return false;
        }
    }

    public remove(value:T):boolean 
    {
        return this.delete(this.indexer(value));
    }

    // public removeWhere(predicate:KeyedSetItemCallback<T, boolean>):number 
    // {
    //     let before = this.list.length;

    //     this.list = this.list.filter((tm, i) => 
    //     {
    //         if (predicate(tm, i))
    //         {
    //             delete this.index[this.indexer(tm)];
    //             return false;
    //         }

    //         return true;
    //     });

    //     return before - this.list.length;
    // }

    public has(value:T):boolean 
    {
        let key = this.indexer(value);
        return !!this.index[key];
    }    

    public at(index:number):T 
    {
        return this.list[index] || null;
    }

    public get(key:string|number):T 
    {
        return this.index[key] || null;
    }
    
    public first():T 
    {
        return this.list[0];
    }
    
    public last():T 
    {
        return this.list[this.list.length - 1];
    }
    
    public forEach(callback:KeyedSetItemCallback<T>, thisArg?:any):void 
    {
        this.list.forEach(callback, thisArg);
    }
    
    public filter(callback:KeyedSetItemCallback<T, boolean>):T[] 
    {
        return this.list.filter(callback);
    }
    
    public find(callback:KeyedSetItemCallback<T, boolean>):T 
    {
        return this.list.find(callback);
    }
    
    public map<U>(callback:KeyedSetItemCallback<T, U>):U[] 
    {
        return this.list.map(callback);
    }

    public reduce<U>(callback:KeyedSetItemReduceCallback<T, U>, initial:U):U 
    {
        return this.list.reduce(callback, initial);
    }
}
