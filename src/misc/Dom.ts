import { ObjectMap } from '../common';
import { Point } from '../geom/Point';


/** General **/

export function create(elementName:string, style:ObjectMap<string>):HTMLElement
{
    return css(parse(`<${elementName}>`), style);
}

export function parse(html:string):HTMLElement
{
    let frag = document.createDocumentFragment();
    let body = document.createElement('body');
    frag.appendChild(body);
    body.innerHTML = html;

    return <HTMLElement>body.firstElementChild;
}

export function css(e:HTMLElement, styles:ObjectMap<string>):HTMLElement
{
    for (let prop in styles)
    {
        e.style[prop] = styles[prop];
    }

    return e;
}

/** Events **/

export function on(e:HTMLElement, event:string, callback:EventListenerOrEventListenerObject):() => void 
{
    e.addEventListener(event, callback);
    return () => e.removeEventListener(event, callback);
}

/** Location **/

export function cumulativeOffset(element:HTMLElement):Point
{
    return Point.create(element.getBoundingClientRect());
};

export function fit(e:HTMLElement, target:HTMLElement):HTMLElement
{
    return css(e, {
        width: target.clientWidth + 'px',
        height: target.clientHeight + 'px',
    });
}

/** Visibility **/

export function hide(e:HTMLElement):HTMLElement
{
    return css(e, { display: 'none' });
}

export function show(e:HTMLElement):HTMLElement
{
    return css(e, { display: 'block' });
}

export function toggle(e:HTMLElement, visible:boolean):HTMLElement
{
    return visible ? show(e) : hide(e);
}