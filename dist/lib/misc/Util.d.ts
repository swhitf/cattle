export declare function extend(target: any, data: any): any;
export declare function index<T>(arr: T[], indexer: (tm: T) => number | string): ObjectMap<T>;
export declare function flatten<T>(aa: any): T[];
export declare function keys<T>(ix: ObjectIndex<T> | ObjectMap<T>): string[];
export declare function values<T>(ix: ObjectIndex<T> | ObjectMap<T>): T[];
export declare function zipPairs(pairs: any[][]): any;
export declare function unzipPairs(pairs: any): any[][];
export declare function max<T>(arr: T[], selector: (t: T) => number): T;
export declare function shadowClone(target: any): any;
