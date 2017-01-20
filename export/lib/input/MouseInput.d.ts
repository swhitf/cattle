import { EventEmitterBase } from '../ui/internal/EventEmitter';
export declare type Mappable = EventTarget | EventEmitterBase;
export interface MouseCallback {
    (e: Event): void;
}
export declare class MouseInput {
    private emitters;
    static for(...elmts: Mappable[]): MouseInput;
    private subs;
    private constructor(emitters);
    on(expr: string, callback: MouseCallback): MouseInput;
    private createListener(target, expr, callback);
}
