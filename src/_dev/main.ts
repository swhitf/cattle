import { NetExtension } from '../extensions/nets/NetExtension';
import { NetHandle } from '../extensions/nets/NetHandle';
import { Border } from '../vom/styling/Border';
import { DefaultNetManager } from '../extensions/nets/DefaultNetManager';
import { Base26 } from '../misc/Base26';
import { select } from '../vom/VisualQuery';
import { debug_events } from '../eventing/EventEmitter';
import { Theme } from '../vom/styling/Theme';
import { GridCellStyle } from '../model/GridCellStyle';
import { GridElement } from '../core/GridElement';


let grid = window['grid'] = GridElement
   .create(document.getElementById('x'))
   .extend(new NetExtension())
//    .extend(new SelectorExtension())
//    .extend(new EditingExtension())
//    .extend(new ClipboardExtension())
//    .extend(new HistoryExtension(history))
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
//    .extend(new ComputeExtension())
//    .extend(new ClickZoneExtension())
   .mergeInterface()
;

grid.model.cells[0].style = GridCellStyle.get('test');
grid.model.cells[0].value = 'Test';

let theme = new Theme('Test');

grid.surface.theme = theme;