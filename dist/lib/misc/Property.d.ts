export interface PropertyChangedCallback {
    (obj: any, val: any): void;
}
export declare function property(defaultValue: any, filter: PropertyChangedCallback): (ctor: any, propName: string) => void;
