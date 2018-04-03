"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Border_1 = require("../vom/styling/Border");
var Theme_1 = require("../vom/styling/Theme");
exports.GoogleSheetsTheme = new Theme_1.Theme('GoogleSheets', {
    'net label': {
        foreground: 'red',
    },
    'cell': {
        zIndex: -1,
    },
    'net.input': {
        border: new Border_1.Border(2, '#4285f4'),
        zIndex: 2000,
    },
    'net.selection': {
        background: 'rgba(160, 195, 255, 0.2)',
        zIndex: 1000,
    },
    'net.copy': {
        animateBorder: true,
        border: new Border_1.Border(2, '#4285f4', [6, 4]),
    },
});
//# sourceMappingURL=GoogleSheetsTheme.js.map