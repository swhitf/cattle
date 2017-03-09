/**
 * Embedding of Clipboard.js - https://github.com/zenorocha/clipboard.js/
 *
 * After various attempts, I was unable to npm install including types effectively and because an index.js is not
 * used I cannot use the TypeScript 2.1 unknown module import, so resorting to local embedded version.  Will remove
 * in the future if possible.
 *
 * Modifications have been made to make the code compile:
 * - Removed Promise polyfill (imported instead)
 * - Restructured export and added typed interface
 * - Some changes to prevent type checking where undesired
 */
import { Promise } from 'es6-promise';
export interface ClipboardObject {
    copy(val: string | Element): Promise<void>;
    paste(): Promise<string>;
}
export declare const Clipboard: any;
