import { Point } from '../geom/Point';
import { ObjectMap } from '../common';


export function parse(html:string):HTMLElement
{
    let frag = document.createDocumentFragment();
    let body = document.createElement('body');
    frag.appendChild(body);
    body.innerHTML = html;

    return <HTMLElement>body.firstElementChild;
}

export function cumulativeOffset(element:HTMLElement):Point
{
    let top = 0, left = 0;
    do 
    {
        left += element.offsetLeft || 0;
        top += element.offsetTop  || 0;
        element = element.offsetParent as HTMLElement;
    } 
    while(element);

    return new Point(left, top);
};


export function css(e:HTMLElement, styles:ObjectMap<string>):HTMLElement
{
    for (let prop in styles)
    {
        e.style[prop] = styles[prop];
    }

    return e;
}

export function fit(e:HTMLElement, target:HTMLElement):HTMLElement
{
    return css(e, {
        width: target.clientWidth + 'px',
        height: target.clientHeight + 'px',
    });
}

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

export function singleTransition(e:HTMLElement, prop:string, millis:number, ease:string = 'linear'):void
{
    e.style.transition = `${prop} ${millis}ms ${ease}`;
    console.log(e.style.transition);
    setTimeout(() => e.style.transition = '', millis);
}