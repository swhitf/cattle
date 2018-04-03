import { Visual } from '../Visual';
import { VisualEvent } from './VisualEvent';
/**
 * Represents an event raised from a Visual object when its composition has changed.
 */
export declare class VisualComposeEvent extends VisualEvent {
    /**
     * Specifies the component that affected the composition.
     */
    readonly subject: Visual;
    /**
     * Specifies what happened that affected the composition.
     */
    readonly mode: 'mount' | 'unmount';
    /**
     * Initializes a new instance of VisualComposeEvent.
     *
     * @param target The visual that the event was raised from.
     * @param subject The subject component.
     * @param mode What happaned.
     */
    constructor(target: Visual, subject: Visual, mode: 'mount' | 'unmount');
}
