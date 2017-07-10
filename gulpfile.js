'use strict';

var gulp = require('gulp'),
	uglify = require('gulp-uglifyjs'),
	rename = require('gulp-rename');
// ___________________________________________________

gulp.task('default', ['lint', 'uglify']);
gulp.task('lint', ['jslint']);

// ___________________________________________________
// npm i --save-dev gulp-jshint jshint-stylish
var jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish');

gulp.task('jslint', function() {
	gulp.src('./index.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

// ___________________________________________________
gulp.task('uglify', function() {
	gulp.src('index.js')
		.pipe(uglify())
		.pipe(rename('c3po.min.js'))
		.pipe(gulp.dest('dist'));
});


var istanbul = require('gulp-istanbul');
// We'll use mocha here, but any test framework will work
var mocha = require('gulp-mocha');

gulp.task('test', function(cb) {
	gulp.src(['index.js'])
		.pipe(istanbul()) // Covering files
		.pipe(istanbul.hookRequire()) // Force `require` to return covered files
		.on('finish', function() {
			gulp.src(['test/*.js'])
				.pipe(mocha())
				.pipe(istanbul.writeReports()) // Creating the reports after tests ran
				/* .pipe(istanbul.enforceThresholds({
					thresholds: {
						global: 90
					}
				})) */ // Enforce a coverage of at least 90%
				.on('end', cb);
		});
});

// npm i --save-dev browserify vinyl-source-str vinyl-buffer gulp-util gulp-uglify gulp-sourcemaps

var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var sourcemaps = require('gulp-sourcemaps');
// var reactify = require('reactify');

gulp.task('build', function() {
	// set up the browserify instance on a task basis
	var b = browserify({
		// entries: './index.js',
		debug: true
			// defining transforms here will avoid crashing your stream
			// , transform: [reactify]
	});

	return b.bundle()
		.pipe(source('index.js'))
		.pipe(buffer())
		.pipe(sourcemaps.init({
			loadMaps: true
		}))
		// Add transformation tasks to the pipeline here.
		.pipe(uglify())
		.on('error', gutil.log)
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest('./dist/'));
});
