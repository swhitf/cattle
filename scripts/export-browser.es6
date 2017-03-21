'use strict'

const browserify = require('browserify');
const fs = require('fs-extra');
const tsify = require("tsify");
const watch = require('watch').watchTree;

const cfg = {
    entries: ['./src/browser.ts'],
    cache: {},
    packageCache: {},
    plugin: [tsify],
    debug: true
};

browserify(cfg)
    .bundle()
    .pipe(fs.createWriteStream('./export/browser/kpmglib.js'));