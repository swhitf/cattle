import { EventEmitterBase } from '../ui/internal/EventEmitter';
export declare type KeyMappable = EventTarget | EventEmitterBase;
export interface KeyMapCallback {
    (e?: KeyboardEvent): void;
}
export declare class KeyInput {
    private emitters;
    static for(...elmts: KeyMappable[]): KeyInput;
    private subs;
    private constructor(emitters);
    on(exprs: string | string[], callback: KeyMapCallback): KeyInput;
    private createListener(ee, ke, callback);
}
