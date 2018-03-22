

var data = {
    start: 0 as number,
    counters: {} as any,
    timers: {} as any,
    logs: [] as any[],
};

const Timer = function() {
    this.start = performance.now();
    this.stop = () => { 
        this.end = performance.now();
    };
    this.val = () => {
        return this.end - this.start;
    };
};

export class Report 
{
    public static begin():void
    {
        data.counters = {};
        data.logs = [];
        data.start = performance.now();
        data.timers = {};
    }   

    public static msg(info:string)
    {
        data.logs.push(info);
    }

    public static time(what:string, callback?:any):any
    {
        const list = (data.timers[what] || (data.timers[what] = []));
        const t = new Timer();
        list.push(t);

        if (callback) {
            callback();
            t.stop();
        }
        else {
            return t.stop;
        }
    }

    public static count(what:string, value?:number)
    {
        if (data.counters[what] === undefined)
        {
            data.counters[what] = 0;
        }

        if (value === undefined)
        {
            data.counters[what]++;
        }
        else
        {
            data.counters[what] = value;
        }
    }

    public static complete(print:boolean = true):any
    {
        if (print) 
        {
            console.info('Render Report at', new Date().getTime(), 'in', performance.now() - data.start);
            console.info('  Counters:')

            for (let key in data.counters)
            {
                console.info('   ' + key, data.counters[key].toString());
            }

            console.info('  Timers:')
            for (let key in data.timers)
            {
                const list = data.timers[key].map(x => x.val());
                if (list.length > 1) {
                    console.info('   ', list.length, key, 
                        'Avg', list.reduce((x, t) => x + t, 0) / list.length,
                        'Min', Math.min(...list),
                        'Max', Math.max(...list),
                        'Sum', list.reduce((x, t) => x + t, 0),
                    );
                }
                else {
                    console.info('   ', 1, key, list[0]);
                }
            }
            
            console.info('  Messages:')
            data.logs.forEach(x => console.info('    ' + x));
        }

        return data;
    }
}