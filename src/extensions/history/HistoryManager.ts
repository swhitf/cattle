

export interface HistoryAction
{
    apply():void;

    rollback():void;
}

export interface HistoryManager
{
    readonly futureCount:number;

    readonly pastCount:number;

    clear():void;

    apply(action:HistoryAction):void;

    push(action:HistoryAction):void;

    redo():boolean;

    undo():boolean;
}