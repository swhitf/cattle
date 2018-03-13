'use strict'

const argv = require('optimist').argv;
const browserify = require('browserify');
const tsify = require('tsify');
const watchify = require('watchify');
const fs = require('fs-extra');
const gaze = require('gaze');

const shouldLog = !argv.s || !argv.silent;
const shouldWatch = !!argv.w || !!argv.watch;
const targetTask = argv.t || argv.task || false;

const log = shouldLog ? console.log : () => {};

function delayed(callback) {
    var t = 0;
    return function() {
        clearTimeout(t);
        t = setTimeout(callback.bind(this, arguments), 100);
    }
}

const tasks = {
    
    clean: function () {
        log('Cleaning...');
        fs.removeSync('./build');
        fs.removeSync('./dist');
    },

    js: function () {

        fs.ensureDirSync('./dist/dev');

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
    },

    resources: function () {
        fs.ensureDirSync('./dist/dev');
        fs.copySync('./res', './dist/dev');
        log('Built resources at', new Date());
    },
}

if (targetTask) {

    if (tasks[targetTask]) tasks[targetTask]();
    else throw new Error('No such task: ' + targetTask);
}
else {

    tasks.clean();

    if (shouldWatch) {
        console.log('Building & watching...')

        tasks.js();
        tasks.resources();

        gaze('./res/**/*', function()  {
            this.on('all', delayed(tasks.resources));
        });
    }
    else {
        console.log('Building...')
        
        tasks.js();
        tasks.resources();
    }
}