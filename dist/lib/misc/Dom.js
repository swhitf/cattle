"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Point_1 = require("../geom/Point");
/** General **/
function create(elementName, style) {
    return css(parse("<" + elementName + ">"), style);
}
exports.create = create;
function parse(html) {
    var frag = document.createDocumentFragment();
    var body = document.createElement('body');
    frag.appendChild(body);
    body.innerHTML = html;
    return body.firstElementChild;
}
exports.parse = parse;
function css(e, styles) {
    for (var prop in styles) {
        e.style[prop] = styles[prop];
    }
    return e;
}
exports.css = css;
/** Events **/
function on(e, event, callback) {
    e.addEventListener(event, callback);
    return function () { return e.removeEventListener(event, callback); };
}
exports.on = on;
/** Location **/
function cumulativeOffset(element) {
    return Point_1.Point.create(element.getBoundingClientRect());
}
exports.cumulativeOffset = cumulativeOffset;
;
function fit(e, target) {
    return css(e, {
        width: target.clientWidth + 'px',
        height: target.clientHeight + 'px',
    });
}
exports.fit = fit;
/** Visibility **/
function hide(e) {
    return css(e, { display: 'none' });
}
exports.hide = hide;
function show(e) {
    return css(e, { display: 'block' });
}
exports.show = show;
function toggle(e, visible) {
    return visible ? show(e) : hide(e);
}
exports.toggle = toggle;
//# sourceMappingURL=Dom.js.map