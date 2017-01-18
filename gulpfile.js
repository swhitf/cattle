var gulp = require('gulp');
var connect = require('gulp-connect');
var merge = require('merge-stream');
var source = require('vinyl-source-stream');
var glob = require('glob');
var browserify = require('browserify');
var tsify = require("tsify");
var watchify = require('watchify');

gulp.task('js', function() {

    var entries = [
        './node_modules/reflect-metadata/temp/Reflect.js'
    ];

    entries = entries.concat(glob.sync('./src/**/*.ts'));

    var cfg = {
        entries: entries,
        cache: {},
        packageCache: {},
        plugin: [watchify, tsify],
        debug: true
    };

    var b = browserify(cfg);
    var flush = function() {
        b.bundle()
            .pipe(source('code.js'))
            .pipe(gulp.dest('dist'))
            .pipe(connect.reload());
    };

    b.on('error', function (error) { console.error(error.toString()); })
    b.on('update', flush);
    flush();

});

gulp.task('export', function() {

    var entries = [
        './node_modules/reflect-metadata/temp/Reflect.js'
    ];

    entries = entries.concat(glob.sync('./src/**/*.ts'));

    var cfg = {
        entries: entries,
        cache: {},
        packageCache: {},
        plugin: [tsify],
        debug: true
    };

    return browserify(cfg)
        .bundle()
        .pipe(source('cattle.js'))
        .pipe(gulp.dest('dist'))
});

/**
 * Packs the application static resources.
 */
gulp.task('artifacts', function() {

    var res = gulp.src('res/**/*')
        .pipe(gulp.dest('dist'));

    return merge(res)
        .pipe(connect.reload());
});

/**
 * Watches for various file changes
 */
gulp.task('watch', function() {
    gulp.watch(['build/**/*.js', 'debug/**/*'], function() {
        setTimeout(function() { gulp.start('reserve'); }, 200);
    });
});

gulp.task('reserve', ['js', 'artifacts']);

/**
 * Serve the application.
 */
gulp.task('serve', ['make', 'watch'], function() {
    connect.server({
        port: 3000,
        root: 'dist',
        fallback: 'dist/index.html',
        livereload: true
    });
});

gulp.task('make', ['js', 'artifacts']);
gulp.task('default', ['serve']);