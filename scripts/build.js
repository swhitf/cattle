var browserify = require('browserify');
var fs = require('fs-extra');
var watch = require('watch');

var silent = process.argv.some(x => x == '-s');
var loop = process.argv.some(x => x == '-w');
var tracker = {};



function log(msg) {
    if (!silent) {
        console.log(msg);
    }
}

function delayed(callback) {
    var t = 0;
    return function() {
        clearTimeout(t);
        setTimeout(callback.bind(this, arguments), 100);
    }
}
    
function task_clean() {
    log('Cleaning...');
    fs.emptyDirSync('./dist/dev');
}

function task_js() {
    log('Packing code...');
    var b = browserify({
        entries: ['./build/_dev/main.js'],
        debug: true,
    });
    b.bundle().pipe(fs.createWriteStream('./dist/dev/app.js'));
}

function task_resources() {
    log('Copying resources...');
    fs.copySync('./res', './dist/dev');
}

task_clean();

if (loop) {
    console.log('Watching...');
    var opts = {
        interval: 0.25
    };
    watch.watchTree('./build', opts, delayed(task_js));
    watch.watchTree('./res', opts, delayed(task_resources));
}
else {
    task_js();
    task_resources();
}