import { ObjectMap } from '../common';
import { Point } from '../geom/Point';
/** General **/
export declare function create(elementName: string, style: ObjectMap<string>): HTMLElement;
export declare function parse(html: string): HTMLElement;
export declare function css(e: HTMLElement, styles: ObjectMap<string>): HTMLElement;
/** Events **/
export declare function on(e: EventTarget, event: string, callback: EventListenerOrEventListenerObject): () => void;
/** Location **/
export declare function cumulativeOffset(element: HTMLElement): Point;
export declare function fit(e: HTMLElement, target: HTMLElement): HTMLElement;
/** Visibility **/
export declare function hide(e: HTMLElement): HTMLElement;
export declare function show(e: HTMLElement): HTMLElement;
export declare function toggle(e: HTMLElement, visible: boolean): HTMLElement;
