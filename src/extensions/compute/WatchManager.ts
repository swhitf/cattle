export class WatchManager
{
    private observing:ObjectMap<string[]> = {};
    private observed:ObjectMap<string[]> = {};

    constructor()
    {
    }

    public clear():void
    {
        this.observing = {};
        this.observed = {};
    }

    public getObserversOf(cellRef:string):string[]
    {
        return this.observed[cellRef] || [];
    }

    public getObservedBy(cellRef:string):string[]
    {
        return this.observing[cellRef] || [];
    }

    public watch(observer:string, subjects:string[]):void
    {
        if (!subjects || !subjects.length)
            return;

        this.observing[observer] = subjects;
        for (let s of subjects)
        {
            let list = this.observed[s] || (this.observed[s] = []);
            list.push(observer);
        }
    }

    public unwatch(observer:string):void
    {
        let subjects = this.getObservedBy(observer);
        delete this.observing[observer];

        for (let s of subjects)
        {
            let list = this.observed[s] || [];
            let ix = list.indexOf(observer);
            if (ix >= 0)
            {
                list.splice(ix, 1);
            }
        }
    }
}