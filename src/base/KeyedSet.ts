

export interface KeySetItemCallback<T, R = void> {
    (tm:T, index:number):R;
}

export interface KeySetItemReduceCallback<T, R = T> {
    (prev:R, curr:T, index:number, array:T[]):R;
}

export class KeyedSet<T> {

    protected list = [] as T[];    
    protected index = {} as any;

    constructor(protected indexer:(t:T) => string) {
    }

    public get array():T[] {
        return this.list;
    }

    public get size():number {
        return this.list.length;
    }    

    public add(value:T):boolean {
        let key = this.indexer(value);
        if (this.index.has(key)) {
            return false;
        }
        else {
            this.index.set(key, value);
            this.list.push(value);
            return true;
        }
    }

    public addAll(...values:T[]):void {
        values.forEach(x => this.add(x));
    }

    public clear():void {
        this.index.clear();
        this.list.splice(0, this.list.length);
    }

    public delete(key:string):boolean {
        let value = this.get(key);
        if (value) {
            let i = this.list.indexOf(value);
            this.index.delete(key);
            this.list.splice(i, 1);
            return true;
        }
        else {
            return false;
        }
    }

    public remove(value:T):boolean {
        return this.delete(this.indexer(value));
    }

    public removeAll(values:T[]):void {
        values.forEach(x => this.remove(x));
    }

    public has(value:T):boolean {
        let key = this.indexer(value);
        return !!this.index.has(key);
    }    

    public get(key:string):T {
        return this.index.get(key) || null;
    }
    
    public first():T {
        return this.list[0];
    }
    
    public last():T {
        return this.list[this.list.length - 1];
    }
    
    public forEach(callback:KeySetItemCallback<T>, thisArg?:any):void {
        this.list.forEach(callback, thisArg);
    }
    
    public filter(callback:KeySetItemCallback<T, boolean>):T[] {
        return this.list.filter(callback);
    }
    
    public find(callback:KeySetItemCallback<T, boolean>):T {
        return this.list.find(callback);
    }
    
    public map<U>(callback:KeySetItemCallback<T, U>):U[] {
        return this.list.map(callback);
    }

    public reduce<U>(callback:KeySetItemReduceCallback<T, U>, initial:U):U {
        return this.list.reduce(callback, initial);
    }
}
