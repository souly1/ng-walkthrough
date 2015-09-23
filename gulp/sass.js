'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    minifyCss = require('gulp-minify-css'),
    rename = require('gulp-rename');

gulp.task('sass', function(done) {
    gulp.src('./scss/ng-walkthrough.scss')
        .pipe(sass({
            errLogToConsole: true,
            outputStyle: 'expanded',
            sourceComments: false
        }))
        .pipe(gulp.dest('./css/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest('./css/'))
        .on('end', done);
});
