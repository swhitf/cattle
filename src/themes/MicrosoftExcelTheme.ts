import { Border } from '../vom/styling/Border';
import { Theme } from '../vom/styling/Theme';


export const MicrosoftExcelTheme = new Theme('MicrosoftExcel', {

    'cell': {
        zIndex: -1,
    },

    'net.input': {
        border: new Border(2, '#217346'),
        zIndex: 2000,
    },

    'net.selection': {
        background: 'rgba(255, 255, 255, 0.2)',
        zIndex: 1000,
    },

});