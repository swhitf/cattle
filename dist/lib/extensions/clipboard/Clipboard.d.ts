import { EventEmitter } from '../../base/EventEmitter';
export interface Clipboard extends EventEmitter {
    copy(data: string): any;
    cut(data: string): any;
}
export declare const clipboard: Clipboard;
