export declare const perf: {
    time: (key: string) => void;
    timeEnd: (key: string) => void;
    report: (key: string, reset?: boolean) => string;
};
