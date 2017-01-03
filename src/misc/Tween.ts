/* Simple JavaScript Tween v 0.2  - http://mattshaw.org/projects/simple-javascript-tweening
 *
 * [Arguments]
 * o: Target element
 * props: key/values object of props to tween
 * durationSecs: duration of tween in seconds (not millis)
 * onComplete: (optional) function to fire when tween is complete
 * easef: (optional) easing function
 */
export function create(o, props, durationSecs, onComplete?, easef?){
    var fps=30,count=0,stopAt = fps*durationSecs,startVals={},endVals={},easef=easef||easeOut;
    for (var p in props) startVals[p] = getProperty(o,p);
    for (var p in props) endVals[p] = props[p];
    var f=function(){
        count++;
        if (count>=stopAt){
            stop(o);
            setProps(o,endVals);
            if (onComplete) onComplete();
        } else {
            for (var p in props) setProperty(o,p, easef(count,startVals[p],endVals[p]-startVals[p],stopAt) );
        }
    }
    clearInterval(o._int);
    o._int = setInterval(f,durationSecs*1000/fps);
}
export function stop(o){ clearInterval(o._int); }
export function setProps(o,props){ for (var p in props) setProperty(o,p,props[p]); }
export function setProperty(o,p,value)
{
    if (o.ownerDocument)
        o.style[p]=value+'px';
    else
        o[p]=value;
}
export function getProperty(o,p){
    var v;
    if (o.ownerDocument)
        if(document.defaultView && document.defaultView.getComputedStyle){
            var cs=document.defaultView.getComputedStyle(o,null);
            if(cs && cs.getPropertyValue) v=cs.getPropertyValue(p);
        } else v = o.currentStyle[p];
    else
        v = o[p];
    v = Number(String(v).split('px')[0]);
    return v;
}
//R.Penner Quart easing t=time,b=start,c=delta,d=duration
export function easeIn (t, b, c, d) { return c*(t/=d)*t*t*t + b;}
export function easeOut (t, b, c, d) {	return -c * ((t=t/d-1)*t*t*t - 1) + b;}
export function easeInOut (t, b, c, d) { if ((t/=d/2) < 1) return c/2*t*t*t*t + b; return -c/2 * ((t-=2)*t*t*t - 2) + b; }