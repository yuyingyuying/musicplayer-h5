'use strict';

var gulp = require('gulp'),
    clean = require('gulp-clean'),
    watch = require('gulp-watch'),
    sass = require('gulp-sass'),
    connect = require('gulp-connect'),
    postcss = require('gulp-postcss'),
    base64 = require('gulp-base64'),
    autoprefixer = require('autoprefixer');

// 目标清理
gulp.task('clean-css', function () {
    gulp.src(['src/css'], {read: false})
        .pipe(clean());
});

// sass
gulp.task('sass', function () {
    gulp.src('sass/*.scss')
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(postcss([ autoprefixer({ browsers: ['last 5 versions'] }) ]))
        .pipe(base64({
            maxImageSize: 20 * 1024
        }))
        .pipe(gulp.dest('src/css'));
});

// 使用connect启动一个Web服务器
gulp.task('webserver', function(){
    connect.server({
        root: '',
        port: 9000,
        livereload: true
    });
});

// 预设任务
gulp.task('default', ['sass', 'webserver', 'watch']);

// 文档临听
gulp.task('watch', function () {
    gulp.watch('sass/*.scss', ['sass']);
});
