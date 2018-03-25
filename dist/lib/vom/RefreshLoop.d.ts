export interface RefreshTick {
    (dt: number): boolean | void;
}
export interface RefreshTicker {
    tick(dt: number): boolean | void;
}
export declare class RefreshLoop {
    private fps;
    private destroyed;
    private tickers;
    constructor(fps?: number);
    destroy(): void;
    add(name: string, ticker: RefreshTick): RefreshLoop;
    add(name: string, ticker: RefreshTicker): RefreshLoop;
    remove(ticker: RefreshTick): RefreshLoop;
    remove(ticker: RefreshTicker): RefreshLoop;
    start(): void;
}
