var gulp = require('gulp');
var connect = require('gulp-connect');
var merge = require('merge-stream');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

/**
 * Packs the application static resources.
 */
gulp.task('artifacts', function() {

    var debug = gulp.src('debug/**/*')
        .pipe(gulp.dest('dist'));

    return merge(debug)
        .pipe(connect.reload());
});

gulp.task('js', function() {

    var b = browserify({
        entries: [
            './node_modules/reflect-metadata/temp/Reflect.js',
            './build/_example/main.js'
        ],
        debug: true,
        //transform: 'require-globify'
    });

    return b.bundle()
        .pipe(source('code.js'))
        .pipe(gulp.dest('dist'))
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
gulp.task('serve', ['js', 'artifacts', 'watch'], function() {
    connect.server({
        port: 3000,
        root: 'dist',
        fallback: 'dist/index.html',
        livereload: true
    });
});

gulp.task('default', ['serve']);