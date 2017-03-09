export declare function parse(html: string): HTMLElement;
export declare function css(e: HTMLElement, styles: ObjectMap<string>): HTMLElement;
export declare function fit(e: HTMLElement, target: HTMLElement): HTMLElement;
export declare function hide(e: HTMLElement): HTMLElement;
export declare function show(e: HTMLElement): HTMLElement;
export declare function toggle(e: HTMLElement, visible: boolean): HTMLElement;
export declare function singleTransition(e: HTMLElement, prop: string, millis: number, ease?: string): void;
