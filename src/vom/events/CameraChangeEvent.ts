import { Camera } from '../Camera';
import { CameraEvent } from './CameraEvent';


/**
 * Represents an event raised when a camera object property has changed.
 */
export class CameraChangeEvent extends CameraEvent
{
    /**
     * Specifies the name of the property that changed.
     */
    public readonly property:string;
    
        /**
         * Initializes a new instance of CameraChangeEvent.
         * 
         * @param target The camera that the event was raised for.
         * @param property The name of the property that changed. 
         */
        constructor(target:Camera, property:string)
        {
            super('change', target);
            this.property = property;
        }
}