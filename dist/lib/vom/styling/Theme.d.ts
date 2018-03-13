export interface Style {
    readonly selector: string;
    readonly props: StyleProps;
}
export declare type StyleProps = {
    [name: string]: any;
};
export declare class Theme {
    readonly name: string;
    readonly styles: Style[];
    dtv: number;
    constructor(name: string);
    extend(style: {
        [selector: string]: any;
    }): Theme;
    extend(selector: string, props: StyleProps): Theme;
    private extendSet(set);
    private extendNew(selector, props);
}
