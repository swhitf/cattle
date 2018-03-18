import * as sha256 from 'tiny-sha256';

import { EventEmitter } from '../../base/EventEmitter';
import { SimpleEventEmitter } from '../../base/SimpleEventEmitter';
import * as dom from '../../misc/Dom';
import { ClipboardPolyfill } from '../../polyfill/clipboard';
import { ClipEvent } from './ClipEvent';


export interface Clipboard extends EventEmitter
{
    copy(data:string);
    cut(data:string);
}

class ClipboardImpl extends SimpleEventEmitter implements Clipboard
{
    private pendingCutHash:string;

    constructor()
    {
        super();

        dom.on(window, 'paste', this.onWindowPaste.bind(this));
    }

    public copy(data:string):void
    {
        ClipboardPolyfill.writeText(data);
        this.emit(new ClipEvent('copy', data));
    }

    public cut(data:string):void
    {
        ClipboardPolyfill.writeText(data);
        this.pendingCutHash = sha256(data);
    }

    private onWindowPaste(e:ClipboardEvent):void
    {
        const text = e.clipboardData.getData('text/plain');
        
        if (text === null || text == undefined)
            return;

        if (this.pendingCutHash && this.pendingCutHash == sha256(text))
        {
            delete this.pendingCutHash;
            this.emit(new ClipEvent('cut', text));
        }
        else
        {
            this.emit(new ClipEvent('paste', text));
        }
    }
}

export const clipboard:Clipboard = new ClipboardImpl();