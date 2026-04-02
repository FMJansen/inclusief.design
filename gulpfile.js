// Include gulp
import gulp from 'gulp';

// Include plugins
import log from 'fancy-log';
import colors from 'ansi-colors';

import rename from 'gulp-rename';

import plumber from 'gulp-plumber';
import * as sass from 'sass';
import gulpSass from 'gulp-sass';
const usingSass = gulpSass(sass);
import sourcemaps from 'gulp-sourcemaps';
import prefix from 'gulp-autoprefixer';

import cache from 'gulp-cache';

import clone from 'gulp-clone';

// Include browsersync
import browserSyncImport from 'browser-sync'
var browserSync = browserSyncImport.create();

import child from 'child_process'



// Paths
var src = 'src/';
var dest = 'static/';



// Process & compress SCSS
gulp.task('sass', function() {
    return gulp.src(src + 'scss/base.scss')
        .pipe(plumber(function(error) {
            log(colors.red(error.message));
            this.emit('end');
        }))
        .pipe(usingSass({style: 'compressed'}).on('error', usingSass.logError))
        .pipe(prefix())
        .pipe(rename('main.css'))
        .pipe(gulp.dest(dest + 'css'));
});

// Process & sourcemap SCSS
gulp.task('sassDev', function() {
    return gulp.src(src + 'scss/base.scss')
        .pipe(plumber(function(error) {
            log(colors.red(error.message));
            this.emit('end');
        }))
        .pipe(sourcemaps.init())
        .pipe(usingSass().on('error', usingSass.logError))
        .pipe(sourcemaps.write())
        .pipe(rename('main.css'))
        .pipe(gulp.dest(dest + 'css'))
        .pipe(browserSync.stream());
});

// Copy SCSS
gulp.task('copy-scss', function() {
    return gulp.src(src + 'scss/*.scss')
        .pipe(gulp.dest(dest + 'css'));
});


// Copy & min images
gulp.task('images', function() {
    return gulp.src(src + 'images/*',  { encoding: false })
        .pipe(gulp.dest(dest + 'img'));
});



gulp.task('jekyll', function() {
    const jekyll = child.spawn('bundle', ['exec', 'jekyll', 'build']);

    const jekyllLogger = (buffer) => {
        buffer.toString()
            .split(/\n/)
            .forEach((message) => log(('Jekyll: ' + message)));
    };

    jekyll.stdout.on('data', jekyllLogger);
    jekyll.stderr.on('data', jekyllLogger);

    return Promise.resolve('done jekyll');
});



// Static Server + watching scss/html/js files
gulp.task('serve', function() {

    browserSync.init({
        files: ['_site/**'],
        port: 3000,
        proxy: '127.0.0.1:4000'
    });

    gulp.watch("src/scss/*.scss", gulp.series('sassDev'));
    gulp.watch("*.html").on('change', browserSync.reload);
    gulp.watch("*.md").on('change', browserSync.reload);
});



// Default task: serve with browserSync
gulp.task('default',
    gulp.series(
        'serve',
        gulp.parallel('sassDev', 'copy-scss')
    )
);



// Build task: everything minified only
gulp.task('build', gulp.parallel('sass', 'images'));



// Build task: everything minified only
gulp.task('jek-build',
    gulp.series(
        'build',
        'jekyll'
    )
);



// Clear image cache
gulp.task('clear', function() {
    // Still pass the files to clear cache for
    gulp.src('images/**')
        .pipe(cache.clear());
    return Promise.resolve('done clearing');
});
