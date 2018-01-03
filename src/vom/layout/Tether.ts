import { Point } from '../../geom/Point';
import { VisualChangeEvent } from '../events/VisualChangeEvent';
import { Visual } from '../Visual';
import { Destroyable } from '../../base/Destroyable';
import { AbstractDestroyable } from '../../base/AbstractDestroyable';


export type TetherPosition = 'top'|'right'|'bottom'|'left'|'center';

export interface TetherSettings
{
    
}

export class Tether
{
    public static anchor(subject:Visual):Destroyable
    {
        return new AnchorTether(subject);
    }

    public static dock(subject:Visual, to:Visual, where:TetherPosition):Destroyable
    {
        throw 'Not implemented';
    }
}

const GeomProps = ['topLeft', 'size', 'top', 'left', 'width', 'height'];

class AnchorTether extends AbstractDestroyable
{
    private origTopLeft:Point;
    private origSize:Point;
    private parent:Visual;

    constructor(private subject:Visual)
    {
        super();

        if (!subject.parent)
        {
            throw 'Cannot anchor a visual without a parent.';
        }
        
        this.chain(subject.parent.on('change', this.onTargetChange.bind(this)));
        this.parent = subject.parent;
        this.origTopLeft = subject.topLeft;
        this.origSize = subject.parent.size;
    }

    private onTargetChange(e:VisualChangeEvent):void
    {
        if (this.parent != this.subject.parent)
        {
            this.destroy();
            return;
        }

        if (GeomProps.indexOf(e.property) < 0)
            return;

        this.subject.topLeft = this.origTopLeft.add(this.parent.size.subtract(this.origSize));
    }
}