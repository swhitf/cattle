

export class Event
{
    public readonly type:string;
    public canceled:boolean = false;

    constructor(type:string)
    {
        this.type = type;
    }

    public cancel():void
    {
        this.canceled = true;
    }
}