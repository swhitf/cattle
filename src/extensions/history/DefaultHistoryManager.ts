import { HistoryAction, HistoryManager } from './HistoryManager';


export class DefaultHistoryManager implements HistoryManager
{
    private future:HistoryAction[] = [];
    private past:HistoryAction[] = [];

    public get futureCount():number
    {
        return this.future.length;
    }

    public get pastCount():number
    {
        return this.past.length;
    }

    public clear():void
    {
        this.past = [];
        this.future = [];
    }

    public apply(action:HistoryAction):void
    {
        action.apply();
        this.push(action);
    }

    public push(action:HistoryAction):void
    {
        this.past.push(action);
        this.future = [];
    }

    public redo():boolean
    {
        if (!this.future.length)
        {
            return false;
        }

        let action = this.future.pop();
        action.apply();
        this.past.push(action);
        return true;
    }

    public undo():boolean
    {
        if (!this.past.length)
        {
            return false;
        }

        let action = this.past.pop();
        action.rollback();
        this.future.push(action);
        return true;
    }
}