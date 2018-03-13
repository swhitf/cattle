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
    add(ticker: RefreshTick): RefreshLoop;
    add(ticker: RefreshTicker): RefreshLoop;
    remove(ticker: RefreshTick): RefreshLoop;
    remove(ticker: RefreshTicker): RefreshLoop;
    start(): void;
}
