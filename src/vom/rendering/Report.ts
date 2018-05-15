

var data = {
    start: 0 as number,
    counters: {} as any,
    timers: {} as any,
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
    public static num:number = 0;
    public static output1 = document.getElementById('report1') as HTMLElement;
    public static output2 = document.getElementById('report2') as HTMLElement;
    public static output3 = document.getElementById('report3') as HTMLElement;
    public static enabled = true;

    public static begin():void
    {
        data.counters = {};
        data.start = performance.now();
        data.timers = {};
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
        if (!this.enabled) return;
        
        if (print && Report.output1) 
        {
            const log = [] as string[];
            const write = function(...a:any[]) { log.push(a.join(' ')); }

            write('Render Report', Report.num++, 'at', new Date().getTime(), 'in', performance.now() - data.start);

            write('  Timers:')
            for (let key in data.timers)
            {
                const list = data.timers[key].map(x => x.val());
                if (list.length > 1) {
                    write('   ', list.length, key, 
                        'Avg', (list.reduce((x, t) => x + t, 0) / list.length).toFixed(5),
                        'Min', (Math.min(...list)).toFixed(5),
                        'Max', (Math.max(...list)).toFixed(5),
                        'Sum', (list.reduce((x, t) => x + t, 0)).toFixed(5),
                    );
                }
                else {
                    write('   ', 1, key, list[0]);
                }
            }
            
            Report.output3.innerHTML = Report.output2.innerHTML;
            Report.output2.innerHTML = Report.output1.innerHTML;
            Report.output1.innerHTML = log.join('\r\n');
        }

        return data;
    }
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}