/**
 * Originally take from https://github.com/lgarron/clipboard-polyfill
 *
 * Unchanged; just couldn't get npm include to work...
 */
import { DT } from './DT';
declare global  {
    interface Navigator {
        clipboard: {
            writeText?: (s: string) => Promise<void>;
            readText?: () => Promise<string>;
        };
    }
}
export declare class ClipboardPolyfill {
    static readonly DT: typeof DT;
    static setDebugLog(f: (s: string) => void): void;
    static suppressWarnings(): void;
    static write(data: DT): Promise<void>;
    static writeText(s: string): Promise<void>;
    static read(): Promise<DT>;
    static readText(): Promise<string>;
}
