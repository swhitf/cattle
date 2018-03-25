export declare class Report {
    static begin(): void;
    static time(what: string, callback?: any): any;
    static count(what: string, value?: number): void;
    static complete(print?: boolean): any;
}
