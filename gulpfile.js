var gulp = require('gulp')
  , wrap = require('gulp-wrap')
  , less = require('gulp-less')
  , css = {
      concat: require('gulp-concat-css')
    , min: require('gulp-cssmin')
    }
  , order = require('gulp-order')
  , clean = require('gulp-clean')
  , jshint = require('gulp-jshint')
  , concat = require('gulp-concat')
  , uglify = require('gulp-uglify')
  , react = require('gulp-react')
  , rename = require('gulp-rename')
  , autoprefixer = require('gulp-autoprefixer')
  , livereload = require('gulp-livereload');

gulp.task('clean', function () {
  return gulp.src(['src/dist', 'public/dist'], { read: false })
    .pipe(clean());
});

/* < DEV TASKS */

gulp.task('css-dev', function () {
  return gulp.src(['src/less/main.less'])
    .pipe(less({
      sourceMap: true
    }))
    // .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
    .pipe(css.concat('style.css'))
    .pipe(gulp.dest('src/dist/css'));
});

gulp.task('js-dev', function () {
  return gulp.src('src/js/App.jsx')
    .pipe(react())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    /*.pipe(uglify({
      wrap: true,
      unused: true,
      join_vars: true,
      mangle: {
        except: ['React', '$', '_', 'jQuery']
      }
    }))
    */
    // .pipe(wrap('(function(window, document, undefined){\n<%= contents %>\n})(window, document);'))
    .pipe(gulp.dest('src/dist/js'));
});

gulp.task('dev', function () {
  gulp.start('css-dev');
  gulp.start('js-dev');
});

gulp.task('watch-dev', function () {
  var server = livereload();

  gulp.start('css-dev');
  gulp.start('js-dev');

  gulp.watch(['src/less/*'], ['css-dev']);
  gulp.watch(['src/js/*'], ['js-dev']);

  gulp.watch(['src/dist/**']).on('change', function (file) {
    server.changed(file.path);
  });
});

/* DEV TASKS > */

/* < PROD TASKS */

gulp.task('copy', function () {
  return gulp.src('src/sounds/*')
    .pipe(gulp.dest('public/sounds'));
});

gulp.task('nanoscroller-css', function () {
  return gulp.src('src/bower_components/nanoscroller/bin/css/nanoscroller.css')
    .pipe(css.min())
    .pipe(rename('nanoscroller.min.css'))
    .pipe(gulp.dest('src/dist/vendor'))
});

gulp.task('horse-chat-css', function () {
  return gulp.src(['src/less/**/*.less'])
    .pipe(less())
    .pipe(css.concat('horse-chat-css.css'))
    .pipe(css.min())
    .pipe(gulp.dest('src/dist/css'))
});

gulp.task('css', ['horse-chat-css', 'nanoscroller-css'], function () {
  return gulp.src([
      'src/bower_components/bootstrap/dist/css/bootstrap.min.css'
    , 'src/dist/vendor/*.css'
    , 'src/dist/css/*.css'
    ])
    .pipe(less())
    .pipe(css.concat('main.css'))
    .pipe(css.min())
    .pipe(gulp.dest('public/dist'));
});

gulp.task('horse-chat-js', function () {
  return gulp.src('src/js/**/*.jsx')
    .pipe(react())
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(wrap('(function(window, document, undefined){\n<%= contents %>\n})(window, document);'))
    .pipe(uglify())
    .pipe(gulp.dest('src/dist/js'));
});

gulp.task('js', ['horse-chat-js'], function () {
  return gulp.src([
      'src/bower_components/jquery/dist/jquery.min.js'
    , 'src/bower_components/lodash/dist/lodash.min.js'
    , 'src/bower_components/moment/min/moment.min.js'
    , 'src/bower_components/nanoscroller/bin/javascripts/jquery.nanoscroller.min.js'
    , 'src/bower_components/react/react-with-addons.min.js'
    , 'src/js/*.js'
    , 'src/dist/**/*.js'
    ])
    /*.pipe(order([
        'src/bower_components/*'
      , 'src/js/*'
      , 'src/dist/*'
    ]))*/
    .pipe(concat('main.js'))
    .pipe(gulp.dest('public/dist'))
});

/* PROD TASKS > */

gulp.task('default', ['clean'], function () {
  gulp.start('copy');
  gulp.start('css');
  gulp.start('js');
});
