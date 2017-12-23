

export class Modifiers 
{
    public readonly alt:boolean;
    public readonly ctrl:boolean;
    public readonly shift:boolean;

    constructor(alt:boolean, ctrl:boolean, shift:boolean)
    {
        this.alt = alt;
        this.ctrl = ctrl;
        this.shift = shift;
    }
}