import { SimpleEventEmitter } from './SimpleEventEmitter';


export class CollectionBase<T> extends SimpleEventEmitter
{
    protected array:T[] = [];

    public get count():number
    {
        return this.array.length;
    }

    protected addItem(tm:T):void
    {
        this.array.push(tm);
        this.emit('add', tm);
    }
    
    protected removeItem(tm:T):boolean
    {
        const idx = this.array.indexOf(tm);
        if (idx >= 0)
        {
            this.array.splice(idx, 1);
            this.emit('remove', tm);
            return true;
        }

        return false;
    }

    public contains(tm:T):boolean
    {
        return this.array.indexOf(tm) >= 0;
    }

    public item(index:number)
    {
        return this.array[index];
    }
}