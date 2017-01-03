import { GridElement } from '../ui/GridElement';
import { GridKernel } from '../ui/GridKernel';
import * as Tether from 'tether';
import * as Dom from '../misc/Dom';

export class ScrollerExtension
{
    private layer:HTMLDivElement;
    private scrollerX:HTMLDivElement;
    private scrollerY:HTMLDivElement;
    private wedgeX:HTMLDivElement;
    private wedgeY:HTMLDivElement;

    constructor(private grid:GridElement, private kernel:GridKernel)
    {
        this.createElements(grid.root);

        grid.on('invalidate', () => this.alignElements());
        grid.on('scroll', () => this.alignElements());
    }

    private createElements(target:HTMLElement):void
    {
        let layer = this.layer = document.createElement('div');
        layer.className = 'grid-scroller-layer';
        layer.style.pointerEvents = 'none';
        layer.style.width = target.clientWidth + 'px';
        layer.style.height = target.clientHeight + 'px';
        target.parentElement.insertBefore(layer, target);

        let t = new Tether({
            element: layer,
            target: target,
            attachment: 'middle center',
            targetAttachment: 'middle center'
        });

        t.position();

        let scrollerX = this.scrollerX = document.createElement('div');
        scrollerX.className = 'grid-scroller grid-scroller-x';
        scrollerX.addEventListener('scroll', this.onScrollHorizontal.bind(this));
        layer.appendChild(scrollerX);

        let wedgeX = this.wedgeX = document.createElement('div');
        scrollerX.appendChild(wedgeX);

        let scrollerY = this.scrollerY = document.createElement('div');
        scrollerY.className = 'grid-scroller grid-scroller-y';
        scrollerY.addEventListener('scroll', this.onScrollVertical.bind(this));
        layer.appendChild(scrollerY);

        let wedgeY = this.wedgeY = document.createElement('div');
        scrollerY.appendChild(wedgeY);

        Dom.css(this.scrollerX, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: `${this.grid.width}px`,
            height: '16px',
            left: '0px',
            bottom: '0px',
        });

        Dom.css(this.scrollerY, {
            pointerEvents: 'auto',
            position: 'absolute',
            overflow: 'auto',
            width: '16px',
            height: `${this.grid.height}px`,
            right: '0px',
            top: '0px',
        });
    }

    private alignElements():void
    {
        Dom.css(this.scrollerX, {
            width: `${this.grid.width}px`,
        });

        Dom.css(this.wedgeX, {
            width: `${this.grid.virtualWidth}px`,
            height: '1px',
        });

        if (this.scrollerX.scrollLeft != this.grid.scrollLeft)
        {
            this.scrollerX.scrollLeft = this.grid.scrollLeft;
        }

        Dom.css(this.scrollerY, {
            height: `${this.grid.height}px`,
        });

        Dom.css(this.wedgeY, {
            width: '1px',
            height: `${this.grid.virtualHeight}px`,
        });

        if (this.scrollerY.scrollTop != this.grid.scrollTop)
        {
            this.scrollerY.scrollTop = this.grid.scrollTop;
        }
    }

    private onScrollHorizontal():void
    {
        this.grid.scrollLeft = this.scrollerX.scrollLeft;
    }

    private onScrollVertical():void
    {
        this.grid.scrollTop = this.scrollerY.scrollTop;
    }
}