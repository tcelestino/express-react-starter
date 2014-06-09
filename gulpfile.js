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
  return gulp.src(['src/less/*.less'])
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
    .pipe(gulp.dest('src/dist/js'));
});

gulp.task('dev', function () {
  gulp.start('css-dev');
  gulp.start('js-dev');
});

gulp.task('watch-dev', function () {
  var server = livereload();

  gulp.start('dev');

  gulp.watch(['src/less/*'], ['css-dev']);
  gulp.watch(['src/js/*'], ['js-dev']);

  gulp.watch(['src/dist/**']).on('change', function (file) {
    server.changed(file.path);
  });
});

/* DEV TASKS > */

/* < PROD TASKS */

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

gulp.task('js', function () {
  return gulp.src([
      'src/bower_components/react/react-with-addons.min.js'
    , 'src/js/*.js'
    , 'src/dist/**/*.js'
    ])
    .pipe(order([
        'src/bower_components/*'
      , 'src/js/*'
      , 'src/dist/*'
    ]))
    .pipe(concat('main.js'))
    .pipe(wrap('(function(window, document, undefined){\n<%= contents %>\n})(window, document);'))
    .pipe(uglify({
      wrap: true,
      unused: true,
      join_vars: true,
      mangle: {
        except: ['React', '$', '_', 'jQuery']
      }
    }))
    .pipe(gulp.dest('public/dist'))
});

/* PROD TASKS > */

gulp.task('default', ['clean'], function () {
  gulp.start('css');
  gulp.start('js');
});
