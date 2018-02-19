'use strict'

const browserify = require('browserify');
const tsify = require('tsify');
const watchify = require('watchify');
const fs = require('fs-extra');
const gaze = require('gaze');

const shouldLog = !process.argv.some(x => x == '-s');
const shouldWatch = process.argv.some(x => x == '-w');

const log = shouldLog ? console.log : () => {};

function delayed(callback) {
    var t = 0;
    return function() {
        clearTimeout(t);
        t = setTimeout(callback.bind(this, arguments), 100);
    }
}
    
function task_clean() {
    log('Cleaning...');
    fs.emptyDirSync('./dist/dev');
}

function task_js() {

    let b = browserify({
        cache: {},
        debug: true,
        entries: ['./src/@dev/main.ts'],
        packageCache: {},
    });

    b.plugin(tsify);
    
    if (shouldWatch) {
        b.plugin(watchify);
    }

    const bundle = () => {
        b.bundle()
         .on('end', () => log('Built js at', new Date()))
         .on('error', e => console.error(e.toString()))
         .pipe(fs.createWriteStream('./dist/dev/app.js'));
    };

    b.on('update', bundle);
    bundle();
}

function task_resources() {
    fs.copySync('./res', './dist/dev');
    log('Built resources at', new Date());
}

task_clean();

if (shouldWatch) {
    console.log('Building & watching...')

    task_js();
    task_resources();

    gaze('./res/**/*', function()  {
        this.on('all', delayed(task_resources));
    });
}
else {
    console.log('Building...')
    
    task_js();
    task_resources();
}