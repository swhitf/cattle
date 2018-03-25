"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Border_1 = require("../vom/styling/Border");
var Theme_1 = require("../vom/styling/Theme");
exports.MicrosoftExcelTheme = new Theme_1.Theme('MicrosoftExcel', {
    'cell': {
        zIndex: -1,
    },
    'net.input': {
        border: new Border_1.Border(2, '#217346'),
        zIndex: 2000,
    },
    'net.selection': {
        background: 'rgba(0, 0, 0, 0.20)',
        border: new Border_1.Border(1, '#217346'),
        zIndex: 1000,
    },
});
//# sourceMappingURL=MicrosoftExcelTheme.js.map