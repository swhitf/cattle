var browserify = require('browserify');
var fs = require('fs-extra');
var watch = require('watch');;


function task_js() {
    console.log('Build js...');
    var cfg = {
        entries: [
            './build/_dev/main.js'
        ],
        debug: true,
    };
    browserify(cfg)
        .bundle()
        .pipe(fs.createWriteStream('./dist/dev/app.js'));
}

function task_resources() {
    fs.copySync('./res', './dist/dev');
}

var opts = {
    interval: 0.25
};

watch.watchTree('./build', opts, task_js);
watch.watchTree('./res', opts, task_resources);