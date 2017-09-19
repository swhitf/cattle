import { Camera } from '../Camera';
import { Event } from '../../base/Event';
import { Visual } from '../Visual';


/**
 * Represents an event raised when a camera object is affected.
 */
export class CameraEvent extends Event
{
    /**
     * Specifies the camera that the event was raised for.
     */
    public readonly target:Camera;

    /**
     * Initializes a new instance of CameraEvent.
     * 
     * @param type A string value that identifies the type of event.
     * @param target The camera that the event was raised for.
     */
    constructor(type:string, target:Camera)
    {
        super(type);

        this.target = target;
    }
}