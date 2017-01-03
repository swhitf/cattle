import { ObjectMap } from '../global';


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