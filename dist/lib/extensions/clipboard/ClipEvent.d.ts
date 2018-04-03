import { Event } from '../../base/Event';
export declare class ClipEvent extends Event {
    data: string;
    constructor(type: 'cut' | 'copy' | 'paste', data: string);
}
