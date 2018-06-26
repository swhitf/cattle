import * as sha256 from 'tiny-sha256';

import { EventEmitter } from '../../base/EventEmitter';
import { SimpleEventEmitter } from '../../base/SimpleEventEmitter';
import * as dom from '../../misc/Dom';
import { ClipboardPolyfill } from '../../polyfill/clipboard';
import { Keys } from '../../vom/input/Keys';
import { ClipEvent } from './ClipEvent';


export interface Clipboard extends EventEmitter
{
    copy(data:string);
    cut(data:string);
}

class ClipboardImpl extends SimpleEventEmitter implements Clipboard
{
    private pendingCutHash:string;
    private capture:HTMLTextAreaElement;
    private target:any;

    constructor()
    {
        super();

        this.capture = <HTMLTextAreaElement>dom.create('textarea', {
            position: 'fixed',
            top: '0px',
            left: '0px',                    
        });

        dom.on(document, 'paste', this.onDocumentPaste.bind(this));

        //Some IE versions do not support document paste so we have to shiv it by intercepting
        //CTRL+V and placing a textbox down to capture the paste...
        dom.on(window, 'keydown', (e:KeyboardEvent) => 
        {
            if (e.keyCode == Keys.KEY_V && e.ctrlKey) 
            {
                this.target = document.activeElement;
                document.body.appendChild(this.capture);
                this.capture.focus();
            }
        });
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

    private onDocumentPaste(e:ClipboardEvent):void
    {
        //Refocus previous and remove capture
        this.target.focus();
        this.target = null;
        document.body.removeChild(this.capture);

        const text = getText(e);
        
        if (text === null || text == undefined)
            return;

        if (this.pendingCutHash && this.pendingCutHash == sha256(text))
        {
            this.pendingCutHash = null;
            this.emit(new ClipEvent('cut', text));
        }
        else
        {
            this.emit(new ClipEvent('paste', text));
        }
    }
}

export const clipboard:Clipboard = new ClipboardImpl();

function getText(e:ClipboardEvent):string 
{
    if (window['clipboardData'] && window['clipboardData'].getData) // IE
        return window['clipboardData'].getData('Text');
    else if (e.clipboardData && e.clipboardData.getData)
        return e.clipboardData.getData('text/plain');
}