import { EventSubscription } from '../../base/EventEmitter';
import { Point } from '../../geom/Point';
import { VisualChangeEvent } from '../events/VisualChangeEvent';
import { Visual } from '../Visual';


export type TetherPosition = 'top'|'right'|'bottom'|'left'|'center';

export interface TetherHandle
{
    cancel():void;
}

export interface TetherSettings
{
    
}

export class Tether
{
    public static anchor(subject:Visual):TetherHandle
    {
        return new AnchorTether(subject);
    }

    public static dock(subject:Visual, to:Visual, where:TetherPosition):TetherHandle
    {
        throw 'Not implemented';
    }
}

const GeomProps = ['topLeft', 'size', 'top', 'left', 'width', 'height'];

class AnchorTether implements TetherHandle
{
    private origTopLeft:Point;
    private origSize:Point;
    private parent:Visual;
    private evtSub:EventSubscription;

    constructor(private subject:Visual)
    {
        if (!subject.parent)
        {
            throw 'Cannot anchor a visual without a parent.';
        }
        
        this.evtSub = subject.parent.on('change', this.onTargetChange.bind(this));
        this.parent = subject.parent;
        this.origTopLeft = subject.topLeft;
        this.origSize = subject.parent.size;
    }

    public cancel():void
    {
        this.evtSub.cancel();
    }

    private onTargetChange(e:VisualChangeEvent):void
    {
        if (this.parent != this.subject.parent)
        {
            this.cancel();
            return;
        }

        if (GeomProps.indexOf(e.property) < 0)
            return;

        this.subject.topLeft = this.origTopLeft.add(this.parent.size.subtract(this.origSize));
    }
}