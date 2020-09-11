// Include gulp
var gulp = require('gulp');

// Include plugins
var log = require('fancy-log');
var colors = require('ansi-colors');

var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var plumber = require('gulp-plumber');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var prefix = require('gulp-autoprefixer');

var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');

var clone = require('gulp-clone');
var sink = clone.sink();
var webp = require('gulp-webp');

// Include browsersync
var browserSync = require('browser-sync').create();

var child = require('child_process');



// Paths
var src = 'src/';
var dest = 'static/';



// Concatenate & minify JS
gulp.task('scripts', function() {
    return gulp.src(src + 'js/*.js')
        .pipe(plumber(function(error) {
            log(colors.red(error.message));
            this.emit('end');
        }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(gulp.dest(dest + 'js'));
});

// Concatenate & sourcemap JS
gulp.task('scriptsDev', function() {
    return gulp.src(src + 'js/*.js')
        .pipe(plumber(function(error) {
            log(colors.red(error.message));
            this.emit('end');
        }))
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dest + 'js'));
});



// Process & compress SCSS
gulp.task('sass', function() {
    return gulp.src(src + 'scss/base.scss')
        .pipe(plumber(function(error) {
            log(colors.red(error.message));
            this.emit('end');
        }))
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(prefix({browsers: ['last 4 version']}))
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
        .pipe(sass().on('error', sass.logError))
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



// Copy & Webp images
gulp.task('images', function() {
    return gulp.src([
      src + 'images/**/*' ])
        .pipe(sink)
        .pipe(webp())
        .pipe(sink.tap())
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
    gulp.watch("src/js/*.js", gulp.series('scriptsDev'));
});



// Default task: serve with browserSync
gulp.task('default',
    gulp.series(
        'serve',
        gulp.parallel('sassDev', 'scriptsDev', 'copy-scss', 'images')
    )
);



// Build task: everything minified only
gulp.task('build', gulp.parallel('scripts', 'sass', 'images'));



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
