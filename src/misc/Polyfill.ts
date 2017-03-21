

export function ie_safe_create_mouse_event(type:string, source:MouseEvent):MouseEvent
{
    if (MouseEvent.prototype.initMouseEvent)
    {
        let event = document.createEvent("MouseEvent");
        event.initMouseEvent(
            source.type,
            source.bubbles,
            source.cancelable,
            window,
            source.detail,
            source.screenX,
            source.screenY,
            source.clientX,
            source.clientY,
            source.ctrlKey,
            source.altKey,
            source.shiftKey,
            source.metaKey,
            source.button,
            source.relatedTarget,
        );
        return event;
    }
    else
    {
        return new MouseEvent(type, source);
    }
}