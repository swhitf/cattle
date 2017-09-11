

export interface RefreshTick
{
    (dt:number):boolean|void;
}

export interface RefreshTicker
{
    tick(dt:number):boolean|void;
}

export class RefreshLoop
{
    private destroyed:boolean = false;
    private tickers:RefreshTick[] = [];

    constructor(private fps:number = 60)
    {
    }

    public destroy():void
    {
        this.destroyed = true;
    }

    public add(ticker:RefreshTick):RefreshLoop;
    public add(ticker:RefreshTicker):RefreshLoop;
    public add(ticker:any)
    {
        this.tickers.push(ticker.tick ? ticker.tick.bind(ticker) : ticker);
        return this;
    }

    public remove(ticker:RefreshTick):RefreshLoop;
    public remove(ticker:RefreshTicker):RefreshLoop;
    public remove(ticker:any)
    {
        this.tickers = this.tickers.filter(x => x != ticker);
        return this;
    }

    public start():void
    {
        let now:number;
        let then:number = Date.now();
        let interval:number = 1000 / this.fps;
        let delta:number;

        let remove = [];
        let meter = window['fps'];

        let tick = () =>
        {
            if (this.destroyed)
            {
                return;
            }

            if (meter)
            {
                meter.tickStart();
            }

            requestAnimationFrame(tick);

            now = Date.now();
            delta = now - then;

            if (delta > interval) {

                let dt = delta / 1000;
                this.tickers.forEach(x => 
                {
                    if (x(dt) === false)
                    {
                        remove.push(x);
                    }
                });

                // Just `then = now` is not enough.
                // Lets say we set fps at 10 which means
                // each frame must take 100ms
                // Now frame executes in 16ms (60fps) so
                // the loop iterates 7 times (16*7 = 112ms) until
                // delta > interval === true
                // Eventually this lowers down the FPS as
                // 112*10 = 1120ms (NOT 1000ms).
                // So we have to get rid of that extra 12ms
                // by subtracting delta (112) % interval (100).
                // Hope that makes sense.

                then = now - (delta % interval);
            }

            if (meter)
            {
                meter.tick();
            }

            if (remove.length)
            {
                remove.forEach(x => this.remove(x));
                remove = [];
            }
        };

        tick();
    }
}