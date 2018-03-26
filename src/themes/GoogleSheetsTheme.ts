import { Border } from '../vom/styling/Border';
import { Theme } from '../vom/styling/Theme';


export const GoogleSheetsTheme = new Theme('GoogleSheets', {

    'net label': {
        foreground: 'red',
    },   

    'cell': {
        zIndex: -1,
    },

    'net.input': {
        border: new Border(2, '#4285f4'),
        zIndex: 2000,
    },

    'net.selection': {
        background: 'rgba(160, 195, 255, 0.2)',
        zIndex: 1000,
    },

    'net.copy': {
        animateBorder: true,
        border: new Border(2, '#4285f4', [6, 4]),
    },

});