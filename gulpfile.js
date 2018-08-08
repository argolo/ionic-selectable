let gulp = require('gulp'),
    path = require('path'),
    compiler = require('@angular/compiler-cli/src/main').main,
    rollup = require('gulp-rollup'),
    rename = require('gulp-rename'),
    fs = require('fs-extra'),
    runSequence = require('run-sequence'),
    sass = require('gulp-sass'),
    header = require('gulp-header'),
    inlineResources = require('./tools/inline-resources'),
    rootFolder = path.join(__dirname),
    srcFolder = path.join(__dirname, 'src'),
    buildFolder = path.join(__dirname, 'build'),
    distFolder = path.join(__dirname, 'dist');

function deleteFolder(folder) {
    return fs.removeSync(folder);
}

gulp.task('clean-dist', function () {
    // Delete contents but not dist folder to avoid broken npm links
    // when dist directory is removed while npm link references it.
    return fs.emptyDirSync(distFolder);
});

gulp.task('copy-html', function () {
    return gulp.src([`${srcFolder}/**/*.html`])
        .pipe(gulp.dest(distFolder));
});

// gulp.task('clean-html', function () {
//     var files = fs.readdirSync(distFolder);

//     for (var i = 0; i < files.length; i++) {
//         if (files[i].indexOf('.html') !== -1) {
//             fs.removeSync(`${distFolder}/${files[i]}`);
//         }
//     }

//     return Promise.resolve();
// });

// Inlines template (.html) and style (.css) files into the the component .ts files.
gulp.task('inline-resources', function () {
    return Promise.resolve().then(() => inlineResources(distFolder));
});

// Runs the Angular compiler. This will output all compiled modules to the /build folder.
gulp.task('compile-angular', function () {
    compiler(['--project', `${rootFolder}/tsconfig.json`]);
    return Promise.resolve();
});

// Runs rollup inside the /build folder to generate our Flat ES module
// and place the generated file into the /dist folder.
gulp.task('rollup-fesm', function () {
    return gulp.src(`${buildFolder}/**/*.js`)
        // Transform the files here.
        .pipe(rollup({

            // Bundle's entry point.
            // See "input" in https://rollupjs.org/#core-functionality
            input: `${buildFolder}/index.js`,

            // Allow mixing of hypothetical and actual files. "Actual" files can be files
            // accessed by Rollup or produced by plugins further down the chain.
            // This prevents errors like: 'path/file' does not exist in the hypothetical file system
            // when subdirectories are used in the `src` directory.
            allowRealFiles: true,

            // A list of IDs of modules that should remain external to the bundle.
            // See "external" in https://rollupjs.org/#core-functionality
            external: [
                '@angular/core',
                '@angular/common'
            ],

            // Format of generated bundle.
            // See "format" in https://rollupjs.org/#core-functionality
            format: 'es'
        }))
        .pipe(gulp.dest(distFolder));
});

// Runs rollup inside the /build folder to generate our UMD module and place the
// generated file into the /dist folder.
gulp.task('rollup-umd', function () {
    return gulp.src(`${buildFolder}/**/*.js`)
        // Transform the files here.
        .pipe(rollup({
            // Bundle's entry point.
            // See "input" in https://rollupjs.org/#core-functionality
            input: `${buildFolder}/index.js`,

            // Allow mixing of hypothetical and actual files. "Actual" files can be files
            // accessed by Rollup or produced by plugins further down the chain.
            // This prevents errors like: 'path/file' does not exist in the hypothetical file system
            // when subdirectories are used in the `src` directory.
            allowRealFiles: true,

            // A list of IDs of modules that should remain external to the bundle.
            // See "external" in https://rollupjs.org/#core-functionality
            external: [
                '@angular/core',
                '@angular/common'
            ],

            // Format of generated bundle.
            // See "format" in https://rollupjs.org/#core-functionality
            format: 'umd',

            // Export mode to use.
            // See "exports" in https://rollupjs.org/#danger-zone
            exports: 'named',

            // The name to use for the module for UMD/IIFE bundles
            // (required for bundles with exports).
            // See "name" in https://rollupjs.org/#core-functionality
            name: 'ionic-select-searchable',

            // See "globals" in https://rollupjs.org/#core-functionality
            globals: {
                typescript: 'ts'
            }
        }))
        .pipe(rename('ionic-select-searchable.umd.js'))
        .pipe(gulp.dest(distFolder));
});

// Copies all the files from /build to /dist, except .js files. We ignore all .js from /build
// because with don't need individual modules anymore, just the Flat ES module generated before.
gulp.task('copy-build', function () {
    return gulp.src([`${buildFolder}/**/*`, `!${buildFolder}/**/*.js`])
        .pipe(gulp.dest(distFolder));
});

gulp.task('copy-package', function () {
    return gulp.src([`${srcFolder}/package.json`])
        .pipe(gulp.dest(distFolder));
});

gulp.task('copy-readme', function () {
    return gulp.src([`${rootFolder}/README.md`])
        .pipe(gulp.dest(distFolder));
});

gulp.task('clean-build', function () {
    return deleteFolder(buildFolder);
});

gulp.task('copy-css', function () {
    return gulp.src([`${srcFolder}/*.scss`])
        .pipe(gulp.dest(distFolder));
});

gulp.task('copy-and-minify-css', function () {
    return gulp.src([`${srcFolder}/select-searchable.style.scss`])
        // This is to create a minified CSS file in order to use in StackBlitz demos.
        // This minified file isn't required for component to work.
        .pipe(header('\
            $select-ios-icon-color: #999;\
            $select-md-icon-color: #999;\
            $select-ios-placeholder-color: #999;\
            $select-md-placeholder-color: #999;\
            $select-ios-padding-left: 16px;\
            $select-md-padding-left: 16px;\
            $content-margin: 16px !default;\
            $content-padding: 16px;\
        '))
        .pipe(sass({
            outputStyle: 'compressed'
        }).on('error', function (error) {
            console.log(error);
            // This is necessary for the error not to stop build process.
            this.emit('end');
        }))
        .pipe(rename('select-searchable.style.min.css'))
        .pipe(gulp.dest(distFolder));
});

gulp.task('compile', function () {
    runSequence(
        'clean-dist',
        'compile-angular',
        'rollup-fesm',
        'rollup-umd',
        'copy-build',
        'copy-html',
        'inline-resources',
        'copy-package',
        'copy-readme',
        'copy-css',
        'copy-and-minify-css',
        'clean-build',
        // Can't remove templates as it will break --prod build, becuase
        // references to the templates a stored in metadata file.
        // 'clean-html',
        function (error) {
            if (error) {
                console.log(error.message);
                deleteFolder(distFolder);
                deleteFolder(buildFolder);
            } else {
                console.log('Done');
            }
        });
});

gulp.task('watch', function () {
    gulp.watch(`${srcFolder}/**/*`, ['compile']);
});
gulp.task('clean', ['clean-dist', 'clean-build']);
gulp.task('build', ['clean', 'compile']);
gulp.task('build-and-watch', ['build', 'watch']);
gulp.task('default', ['build-and-watch']);
