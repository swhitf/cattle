//@no-export

const tracker = {} as any;

export const perf = window['perf'] = {
    time: function(key:string) {
        let e = entry(key);
        e.t = window.performance.now();
    },
    timeEnd: function(key:string) {
        let e = entry(key);
        e.r.push(window.performance.now() - e.t);
    },
    report: function(key:string, reset:boolean = true):string {
        let e = entry(key);
        let a = key + ' -> ' + analyze(e.r);
        e.r = [];
        console.log(a);
        return a;
    },
};

function entry(key):{ t:number, r:number[] } {
    return tracker[key] || (tracker[key] = { t: 0, r: [] });
}

function analyze(r:number[]):string {
    let min, max, total = undefined;
    for (let x of r) {
        if (min === undefined || min > x) min = x;
        if (max === undefined || max < x) max = x;
        if (total === undefined) total = 0;
        total += x;
    }
    return `Avg: ${total / r.length}ms, Min: ${min}ms, Max: ${max}ms`;
}