var gulp = require('gulp');
var connect = require('gulp-connect');
var merge = require('merge-stream');
var source = require('vinyl-source-stream');
var glob = require('glob');
var browserify = require('browserify');
var tsify = require("tsify");
var watchify = require('watchify');

gulp.task('js', function() {

    var b = browserify({
        entries: ['./build/_dev/main.js'],
        debug: true,
    });

    return b.bundle()
        .pipe(source('app.js'))
        .pipe(gulp.dest('dev/local'));

});

gulp.task('export-lib', function() {

    return gulp
        .src([
            './build/**/*',
            '!./build/_dev/',
            '!./build/_dev/',
            '!./build/browser.js'
        ])
        .pipe(gulp.dest('dist/lib'));
});

gulp.task('export-browser', function() {

    var cfg = {
        entries: ['./src/browser.ts'],
        cache: {},
        packageCache: {},
        plugin: [tsify],
        debug: true
    };

    return browserify(cfg)
        .bundle()
        .pipe(source('cattle.js'))
        .pipe(gulp.dest('dist/browser'))
});

/**
 * Packs the application static resources.
 */
gulp.task('artifacts', function() {

    var res = gulp.src('res/**/*')
        .pipe(gulp.dest('dev/local'));

    return merge(res)
        .pipe(connect.reload());
});

/**
 * Watches for various file changes
 */
gulp.task('watch', function() {
    gulp.watch(['build/**/*.js', 'res/**/*'], function() {
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
        root: 'dev/local',
        fallback: 'dev/local/index.html',
        livereload: true
    });
});

gulp.task('make', ['js', 'artifacts']);
gulp.task('default', ['serve']);