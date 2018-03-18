import { Camera } from '../Camera';
import { Event } from '../../base/Event';
/**
 * Represents an event raised when a camera object is affected.
 */
export declare class CameraEvent extends Event {
    /**
     * Specifies the camera that the event was raised for.
     */
    readonly target: Camera;
    /**
     * Initializes a new instance of CameraEvent.
     *
     * @param type A string value that identifies the type of event.
     * @param target The camera that the event was raised for.
     */
    constructor(type: string, target: Camera);
}
