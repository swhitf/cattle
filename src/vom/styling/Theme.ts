

export interface Style
{
    readonly selector:string;
    readonly props:StyleProps;
}

export type StyleProps = { [name:string]:any };

export class Theme
{
    public readonly name:string;
    public readonly styles:Style[];

    public dtv:number = 0;

    constructor(name:string, styles?:{[selector:string]:any})
    {
        this.name = name;
        this.styles = [];

        if (styles) 
        {
            this.extend(styles);
        }
    }

    public extend(style:{[selector:string]:any}):Theme
    public extend(selector:string, props:StyleProps):Theme
    public extend(...input:any[]):Theme
    {
        this.dtv++;
        return input.length > 1
            ? this.extendNew(input[0], input[1])
            : this.extendSet(input[0]);
    }

    private extendSet(set:any):Theme
    {
        for (let selector in set)
        {
            this.extendNew(selector, set[selector]);
        }

        return this;
    }

    private extendNew(selector:string, props:StyleProps):Theme
    {
        this.styles.push({
            selector: selector,
            props: props,
        });

        return this;
    }
}