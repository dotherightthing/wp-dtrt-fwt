/**
 * @file DTRT WordPress Parent Theme gulpfile.js
 * @summary
 *     Gulp build tasks
 *     Based on https://github.com/dotherightthing/wpdtrt-plugin-boilerplate/blob/master/gulpfile.js
 *
 * @example usage:
 *    yarn run build
 *    yarn run install_deps
 *    yarn run package
 *    yarn run test
 *    yarn run version
 *    yarn run watch
 *
 * @version     0.2.8
 */

/**
 * @namespace gulp
 */

/* eslint-env node */
/* eslint-disable max-len */

"use strict";

const gulp = require("gulp");
const autoprefixer = require("autoprefixer");
const babel = require("gulp-babel");
const del = require("del");
const ghRateLimit = require("gh-rate-limit");
const jsdoc = require("gulp-jsdoc3");
const eslint = require("gulp-eslint");
const log = require("fancy-log");
const phpcs = require("gulp-phpcs");
const postcss = require("gulp-postcss");
const print = require("gulp-print").default;
const pxtorem = require("postcss-pxtorem");
const rename = require("gulp-rename");
const runSequence = require("run-sequence");
const sass = require("gulp-sass");
const sassLint = require("gulp-sass-lint");
const shell = require("gulp-shell");
const sourcemaps = require('gulp-sourcemaps');
const validate = require("gulp-nice-package");
const zip = require("gulp-zip");

/**
 * @summary Get the themeName from package.json
 * @return {string} themeName
 * @memberOf gulp
 */
function get_themeName() {
    // pop() - remove the last element from the path array and return it
    const themeName = process.cwd().split("/").pop();

    return themeName;
}

/**
 * @summary Determines whether we're in the boilerplate, or using it as a dependency
 * @return {Boolean} True if we're in the boilerplate
 * @memberOf gulp
 */
function is_parent_theme() {
    const themeName = get_themeName();

    return (themeName === "wpdtrt");
}

/**
 * @summary Determines whether the current Gulp process is running on a CI server
 * @return {Boolean}
 * @see {@link https://docs.travis-ci.com/user/environment-variables/#Default-Environment-Variables}
 * @see {@link https://confluence.atlassian.com/bitbucket/environment-variables-in-bitbucket-pipelines-794502608.html}
 * @memberOf gulp
 */
function is_ci() {
    return (typeof process.env.CI !== "undefined");
}

/**
 * @summary Get the value of the Github API access token used by Travis
 * @return {String}
 * @memberOf gulp
 */
function get_gh_token() {
    let token = "";

    if ( is_ci() ) {
        token = (process.env.GH_TOKEN ? process.env.GH_TOKEN : "");
    }

    return (token);
}

/**
 * @summary Get the path to the parent theme
 * @return {string} path
 * @memberOf gulp
 */
function get_parent_theme_path() {
    let path = "";

    // if we're in the child theme
    if (! is_parent_theme() ) {
        path = "../wpdtrt/";
    }

    return path;
}

/**
 * @summary Get list of JavaScript files to document
 * @return {array} jsFiles Array of files
 * @see {@link http://usejsdoc.org/about-including-package.html}
 * @memberOf gulp
 */
function get_js_doc_files() {

    let parent_theme_path = get_parent_theme_path();

    if ( parent_theme_path !== "" ) {
        parent_theme_path += "/";
    }

    // note: es6 originals only
    const jsDocFiles = [
        "./js/frontend.js",
        "./js/backend.js",
        "package.json",
        `${parent_theme_path}gulpfile.js`,
        `${parent_theme_path}js/backend.js`
    ];

    return jsDocFiles;
}

/**
 * @summary Get list of JavaScript files to transpile from ES6 to ES5
 * @return {array} jsFiles Array of files
 * @see {@link http://usejsdoc.org/about-including-package.html}
 * @memberOf gulp
 */
function get_js_files() {

    let parent_theme_path = get_parent_theme_path();

    if ( parent_theme_path !== "" ) {
        parent_theme_path += "/";
    }

    // note: es6 originals only
    const jsFiles = [
        "./js/frontend.js",
        "./js/backend.js",
        "./js/twentysixteen.js",
        `${parent_theme_path}js/wpdtrt_footer.js`,
        `${parent_theme_path}js/wpdtrt_header.js`
    ];

    return jsFiles;
}

/**
 * @summary Displays a block comment for each task that runs
 * @param  {string} step          Step number
 * @param  {string} task_category Task category
 * @param  {string} task_action   Task action
 * @param  {string} task_detail   Task detail
 * @return {string}               Task header
 * @memberOf gulp
 */
function gulp_helper_taskheader(step, task_category, task_action, task_detail) {

    log(" ");
    log("========================================");
    log(step + " - " + task_category + ":");
    log("=> " + task_action + ": " + task_detail);
    log("----------------------------------------");
    log(" ");
}

const themeName = get_themeName();
const themeNameSafe = themeName.replace(/-/g, "_");
const cssDir = "css";
const jsDir = "js";
const distDir = themeName;
const dummyFile = "README.md";
const jsFiles = get_js_files();
const phpFiles = [
    "**/*.php",
    "!docs/**/*.php",
    "!node_modules/**/*.php",
    "!vendor/**/*.php",
    "!wp-content/**/*.php"
];

const scssFiles = "./scss/**/*.scss";

/**
 * @callback runSequenceCallback
 * @summary Tells runSequence that a task has finished.
 * @description
 *     By returning a stream,
 *     the task system is able to plan the execution of those streams.
 *     But sometimes, especially when you're in callback hell
 *     or calling some streamless plugin,
 *     you aren't able to return a stream.
 *     That's what the callback is for.
 *     To let the task system know that you're finished
 *     and to move on to the next call in the execution chain.
 * @see {@link https://stackoverflow.com/a/29299107/6850747}
 * @memberOf gulp
 */

/**
 * @function install_dependencies
 * @summary Tasks which install dependencies
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("install_dependencies", (callback) => {

    gulp_helper_taskheader(
        "1",
        "Dependencies",
        "Install",
        ""
    );

    runSequence(
        "install_dependencies_yarn",
        "preinstall_dependencies_github",
        "install_dependencies_composer",
        callback
    );
});

/**
 * @function install_dependencies_yarn
 * @summary Install Yarn dependencies
 * @memberOf gulp
 */
gulp.task("install_dependencies_yarn", () => {

    gulp_helper_taskheader(
        "1a",
        "Dependencies",
        "Install",
        "Yarn"
    );

    // return stream or promise for run-sequence
    return gulp.src(dummyFile, {read: false})
        .pipe(shell([
            "yarn install --non-interactive"
        ]));
});

/**
 * @function preinstall_dependencies_github
 * @summary Expose the Github API rate limit to aid in debugging failed builds
 * @return {Object} Rate Limit object
 * @memberOf gulp
 */
gulp.task("preinstall_dependencies_github", () => {

    gulp_helper_taskheader(
        "1b",
        "Dependencies",
        "Pre-Install",
        "Check current Github API rate limit for automated installs"
    );

    if ( ! is_ci() ) {
        return true;
    }

    const token = get_gh_token();

    if ( token === "" ) {
        return true;
    }

    return ghRateLimit({
      token: get_gh_token()
    }).then( (status) => {
        log("Github API rate limit:");
        log(`API calls remaining: ${status.core.remaining}/${status.core.limit}`);
        log(" ");
    });
});

/**
 * @function install_dependencies_composer
 * @summary Install Composer dependencies
 * @memberOf gulp
 */
gulp.task("install_dependencies_composer", () => {

    // Travis already runs composer install
    if ( is_ci() ) {
        return true;
    }

    gulp_helper_taskheader(
        "1b",
        "Dependencies",
        "Install",
        "Composer (PHP)"
    );

    // return stream or promise for run-sequence
    return gulp.src(dummyFile, {read: false})
        .pipe(shell([
            "composer install --prefer-dist --no-interaction --no-suggest"
        ]));
});

/**
 * @function lint
 * @summary Tasks which lint files
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("lint", (callback) => {

    gulp_helper_taskheader(
        "2",
        "QA",
        "Lint",
        ""
    );

    runSequence(
        "lint_sass",
        "lint_js",
        "lint_package_json",
        "lint_php",
        callback
    );
});

/**
 * @function lint_sass
 * @summary Lint Sass files
 * @memberOf gulp
 */
gulp.task("lint_sass", () => {

    gulp_helper_taskheader(
        "2a",
        "QA",
        "Lint",
        "Sass"
    );

    return gulp.src(scssFiles)
        .pipe(sassLint())
        .pipe(sassLint.format());
        // .pipe(sassLint.failOnError())
});

/**
 * @function lint_js
 * @summary Lint JavaScript files
 * @memberOf gulp
 */
gulp.task("lint_js", () => {

    gulp_helper_taskheader(
        "2b",
        "QA",
        "Lint",
        "JS"
    );

    const files = get_js_files();

    // return stream or promise for run-sequence
    return gulp.src(files)
        .pipe(eslint())
        .pipe(eslint.format());
        // .pipe(eslint.failAfterError());
});

/**
 * @function lint_package_json
 * @summary Lint package.json
 * @memberOf gulp
 */
gulp.task("lint_package_json", () => {

    gulp_helper_taskheader(
        "2c",
        "QA",
        "Lint",
        "package.json"
    );

    // return stream or promise for run-sequence
    return gulp.src("package.json")
        .pipe(validate({
            recommendations: false
        }));
});

/**
 * @function lint_php
 * @summary Lint PHP files
 * @see {@link https://packagist.org/packages/squizlabs/php_codesniffer}
 * @see {@link https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards}
 * @see {@link https://github.com/dotherightthing/wpdtrt-plugin-boilerplate/issues/89}
 * @see {@link https://github.com/JustBlackBird/gulp-phpcs/issues/39}
 * @memberOf gulp
 */
gulp.task("lint_php", () => {

    gulp_helper_taskheader(
        "2d",
        "QA",
        "Lint",
        "PHP"
    );

    return gulp.src(phpFiles)
        // Validate files using PHP Code Sniffer
        .pipe(phpcs({
            bin: "vendor/bin/phpcs",
            // standard must be included and cannot reference phpcs.xml, which is ignored
            // The WordPress ruleset cherry picks sniffs from Generic, PEAR, PSR-2, Squiz etc
            standard: "WordPress", // -Core + -Docs + -Extra + -VIP
            warningSeverity: 0, // minimum severity required to display an error or warning.
            showSniffCode: true,
            // phpcs.xml exclusions are duplicated here,
            // but only 3 levels of specificity are tolerated by gulp-phpcs:
            exclude: [
                "WordPress.Files.FileName",
                "WordPress.Functions.DontExtract",
                "WordPress.CSRF.NonceVerification",
                "WordPress.XSS.EscapeOutput",
                "WordPress.VIP.PostsPerPage",
                "WordPress.VIP.SessionVariableUsage",
                "WordPress.VIP.ValidatedSanitizedInput",
                "Generic.Strings.UnnecessaryStringConcat"
            ]
        }))
        // Log all problems that were found
        .pipe(phpcs.reporter("log"));
});

/**
 * @function compile
 * @summary Tasks which compile
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("compile", (callback) => {

    gulp_helper_taskheader(
        "3",
        "Assets",
        "Compile",
        ""
    );

    runSequence(
        "compile_css",
        "transpile_js",
        callback
    );
});

/**
 * @function compile_css
 * @summary Compile CSS
 * @memberOf gulp
 */
gulp.task("compile_css", () => {

    gulp_helper_taskheader(
        "3a",
        "Assets",
        "Compile",
        "SCSS -> CSS"
    );

    const processors = [
        autoprefixer({
            cascade: false
        }),
        pxtorem({
            rootValue: 16,
            unitPrecision: 5,
            propList: [
                "font",
                "font-size",
                "padding",
                "padding-top",
                "padding-right",
                "padding-bottom",
                "padding-left",
                "margin",
                "margin-top",
                "margin-right",
                "margin-bottom",
                "margin-left",
                "bottom",
                "top",
                "max-width"
            ],
            selectorBlackList: [],
            replace: false,
            mediaQuery: true,
            minPixelValue: 0
        })
    ];

    // if child theme
    if ( ! is_parent_theme() ) {
        const ci = is_ci();
        const suffix = ci ? 'ci' : 'wp';

        // generate an importer file
        require('fs').writeFileSync('scss/_wpdtrt-import.scss', '@import \'wpdtrt/dependencies-' + suffix + '\';\r\n');
    }

    // return stream or promise for run-sequence
    return gulp.src(scssFiles)
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: "expanded"}).on('error', sass.logError))
        .pipe(postcss(processors))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest(cssDir));
});

/**
 * @function transpile_js
 * @summary Transpile JS
 * @memberOf gulp
 */
gulp.task("transpile_js", () => {

    gulp_helper_taskheader(
        "3a",
        "Assets",
        "Transpile",
        "ES6 JS -> ES5 JS"
    );

    // return stream or promise for run-sequence
    return gulp.src(jsFiles)
        .pipe(babel({
            presets: ["env"]
        }))
        .pipe(rename({
            suffix: "-es5"
        }))
        .pipe(gulp.dest(jsDir));
});

/**
 * @function docs
 * @summary Tasks which generate documentation
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("docs", (callback) => {

    gulp_helper_taskheader(
        "5",
        "Documentation",
        "",
        ""
    );

    runSequence(
        "docs_delete",
        "docs_js",
        "docs_php",
        callback
    );
});

/**
 * @function docs_delete
 * @summary Delete existing generated docs
 * @memberOf gulp
 */
gulp.task("docs_delete", () => {

    gulp_helper_taskheader(
        "5a",
        "Documentation",
        "Delete",
        ""
    );

    // return stream or promise for run-sequence
    return del([
        "docs/jsdoc",
        "docs/phpdoc"
    ]);
});

/**
 * @function docs_js
 * @summary Generate JavaScript documentation
 * @memberOf gulp
 */
gulp.task("docs_js", () => {

    gulp_helper_taskheader(
        "5b",
        "Documentation",
        "Generate",
        "JS"
    );

    const files = get_js_doc_files();

    // require path is relative to this gulpfile
    const jsdocConfig = require("./jsdoc.json");

    // return stream or promise for run-sequence
    return gulp.src(files)
        // note: output cannot be piped on from jsdoc
        .pipe(jsdoc(jsdocConfig));
});

/**
 * @function docs_php
 * @summary Generate PHP documentation
 * @memberOf gulp
 */
gulp.task("docs_php", () => {

    gulp_helper_taskheader(
        "5c",
        "Documentation",
        "Generate",
        "PHP"
    );

    const boilerplate = is_parent_theme();
    let configFile = "";

    if ( boilerplate ) {
        // use config file in boilerplate root
        configFile = "phpdoc-parent-theme.xml";
    } else {
        // use config file in plugin root
        // see https://github.com/dotherightthing/wpdtrt-plugin-boilerplate/issues/139#issuecomment-406854915
        configFile = "phpdoc-child-theme.xml";
    }

    // return stream or promise for run-sequence
    // note: src files are not used,
    // this structure is only used
    // to include the preceding log()
    return gulp.src(dummyFile, {read: false})
        .pipe(shell([
            `vendor/bin/phpdoc --config ${configFile}`
        ]));
});

/**
 * @function release
 * @summary Tasks which package a release
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("release", (callback) => {

    const ci = is_ci();

    if (ci) {
        gulp_helper_taskheader(
            "7",
            "Release",
            "Generate",
            ""
        );

        runSequence(
            "release_composer_dist",
            "release_yarn_dist",
            "release_delete_pre",
            "release_copy",
            "release_zip",
            "release_delete_post",
            callback
        );
    } else {
        callback();
    }
});

/**
 * @function release_composer_dist
 * @summary Uninstall PHP development dependencies
 * @memberOf gulp
 */
gulp.task("release_composer_dist", () => {

    gulp_helper_taskheader(
        "7a",
        "Release",
        "Uninstall dev dependencies",
        "Composer (PHP)"
    );

    /**
    * Remove dev packages once we"ve used them
    *
    * @see #47
    */
    return gulp.src(dummyFile, {read: false})
        .pipe(shell([
            "composer install --prefer-dist --no-interaction --no-dev --no-suggest"
        ]));
});

/**
 * @function release_yarn_dist
 * @summary Uninstall Yarn development dependencies
 * @memberOf gulp
 */
gulp.task("release_yarn_dist", () => {

    gulp_helper_taskheader(
        "7b",
        "Release",
        "Uninstall dev dependencies",
        "Yarn"
    );

    // return stream or promise for run-sequence
    return gulp.src(dummyFile, {read: false})
        .pipe(shell([
            "yarn install --non-interactive --production"
        ]));
});

/**
 * @function release_delete_pre
 * @summary Delete existing release.zip
 * @memberOf gulp
 */
gulp.task("release_delete_pre", () => {

    gulp_helper_taskheader(
        "7c",
        "Release",
        "Delete",
        "Previous release"
    );

    // return stream or promise for run-sequence
    return del([
        "release.zip"
    ]);
});

/**
 * @function release_copy
 * @summary Copy release files to a temporary folder
 * @see {@link http://www.globtester.com/}
 * @memberOf gulp
 */
gulp.task("release_copy", () => {

    gulp_helper_taskheader(
        "7d",
        "Release",
        "Copy files",
        "To temporary folder"
    );

    // Release files are those that are required
    // to use the package as a WP Parent Theme
    const releaseFiles = [
        // Theme Cheatsheets
        "./cheatsheets/**/*",
        // Theme Config
        "./config/**/*",
        // Compiled Theme CSS
        "./css/**/*",
        // Icons
        "./icons/**/*",
        // Images
        "./images/**/*",
        // Transpiled Theme JS
        "./js/**/*-es5.js",
        // Theme Logic
        "./library/**/*",
        // Yarn front-end dependencies
        "./node_modules/**/*",
        // Theme template partials
        "./template-parts/**/*",
        // Any Tiny MCE (WYSIWYG) mods
        "./tiny-mce/**/*",
        // Any PHP dependencies
        "./vendor/**/*",
        // Not wpdtrt 'file'
        "!./node_modules/wpdtrt",
        // Not binary executables
        "!./node_modules/.bin",
        "!./node_modules/**/.bin",
        "!./node_modules/**/bin",
        "!./vendor/**/bin",
        // Not JSON files
        "!./node_modules/**/*.json",
        "!./vendor/**/*.json",
        // Not Less files
        "!./node_modules/**/*.less",
        "!./vendor/**/*.less",
        // Not Authors files
        "!./node_modules/**/AUTHORS",
        "!./vendor/**/AUTHORS",
        // Not Changes files
        "!./node_modules/**/CHANGES",
        "!./vendor/**/CHANGES",
        // Not License files
        "!./node_modules/**/license",
        "!./vendor/**/license",
        "!./node_modules/**/LICENSE",
        "!./vendor/**/LICENSE",
        // Not Markdown files
        "!./node_modules/**/*.md",
        "!./vendor/**/*.md",
        // Not Makefile files
        "!./node_modules/**/Makefile",
        // Not PHP sample files
        "!./node_modules/**/*example*.php",
        "!./vendor/**/*example*.php",
        // Not Sass files
        "!./node_modules/**/*.scss",
        "!./vendor/**/*.scss",
        // Not SCSS folders
        "!./node_modules/**/*/scss",
        "!./vendor/**/*/scss",
        // Not test files
        "!./node_modules/**/test/**/*",
        "!./vendor/**/test/**/*",
        // Not tests files
        "!./node_modules/**/tests/**/*",
        "!./vendor/**/tests/**/*",
        // Not XML files
        "!./node_modules/**/*.xml",
        "!./vendor/**/*.xml",
        // Not Zip files
        "!./node_modules/**/*.zip",
        "!./vendor/**/*.zip",
        // Theme search form
        "./_searchform.php",
        // Theme archive page template
        "./archive.php",
        // Theme comments partial
        "./comments.php",
        // Theme footer partial
        "./footer.php",
        // Theme functions
        "./functions.php",
        // Theme header partial
        "./header.php",
        // Theme post title and content template
        "./index.php",
        // Theme maintenance page template
        "./maintenance.php",
        // The template for displaying all pages
        "./page.php",
        // Theme Read Me
        "./README.md",
        // Theme WP Read Me
        "./README.txt",
        // Theme Screenshot
        "./screenshot.png",
        // Theme Search Template
        "./search.php",
        // Theme widget-ready sidebar partials
        "./sidebar-widget-tests.php",
        "./sidebar.php",
        // Theme Single Post Template
        "./single.php",
        // Theme Stylesheet
        "./style.css",
        // wpdtrt-dbth child theme templates
        "./archive-tourdiaries.php",
        "./image.php",
        "./page-search.php",
        "./single-tourdiaries.php",
        "./templates/**/*",
        "./taxonomy-wpdtrt_tourdates_taxonomy_tour.php",
    ];

    // return stream or promise for run-sequence
    // https://stackoverflow.com/a/32188928/6850747
    return gulp.src(releaseFiles, {base: "."})
        .pipe(print())
        .pipe(gulp.dest(distDir));
});

/**
 * @function release_zip
 * @summary Generate release.zip for deployment by Travis/Github
 * @memberOf gulp
 */
gulp.task("release_zip", () => {

    gulp_helper_taskheader(
        "7e",
        "Release",
        "Generate",
        "ZIP file"
    );

    let release_name = 'release';

    if (typeof process.env.BITBUCKET_TAG !== "undefined") {
        release_name += '-' + process.env.BITBUCKET_TAG;
    }

    release_name += '.zip';

    // return stream or promise for run-sequence
    // https://stackoverflow.com/a/32188928/6850747
    return gulp.src([
        `./${distDir}/**/*`
    ], {base: "."})
        .pipe(zip(release_name))
        .pipe(gulp.dest("./"));
});

/**
 * @function release_delete_post
 * @summary Delete the temporary folder
 * @memberOf gulp
 */
gulp.task("release_delete_post", () => {

    gulp_helper_taskheader(
        "7f",
        "Release",
        "Delete",
        "Temporary folder"
    );

    // return stream or promise for run-sequence
    return del([
        distDir
    ]);
});

/**
 * @function watch
 * @summary Watch for changes to `.scss` files
 * @memberOf gulp
 */
gulp.task("watch", () => {

    if (! is_ci() ) {
        gulp_helper_taskheader(
            "*",
            "Watch",
            "Lint + Compile",
            "JS, SCSS + PHP"
        );

        gulp.watch(scssFiles, ["lint_sass", "compile_css"]);
        gulp.watch(jsFiles, ["lint_js", "transpile_js"]);
    }
});

/**
 * @function default
 * @summary Default task
 * @example
 * gulp
 * @param {runSequenceCallback} callback - The callback that handles the response
 * @memberOf gulp
 */
gulp.task("default", (callback) => {

    const ci = is_ci();

    gulp_helper_taskheader(
        "0",
        "Installation",
        "Gulp",
        `Install${ ci ? " and package for release" : ""}`
    );

    runSequence(
        // 1
        "install_dependencies",
        // 2
        "lint",
        // 3
        "compile",
        // 4
        "docs",
        // 5
        "release" // travis only
    );

    callback();
});

/* eslint-enable max-len */

