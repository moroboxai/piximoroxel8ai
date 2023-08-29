'use strict';

const path = require('path');
const gulp = require('gulp');
const ts = require('gulp-typescript');
const webpack = require('webpack');
const gulpWebpack = require('webpack-stream');

// Webpack config for the library
const libWebpackConfig = (lib, output, options, library, prod) => ({
    context: path.resolve(__dirname, 'src'),
    entry: './index.ts',
    mode: prod ? 'production' : 'development',
    target: 'web',
    node: false,
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        filename: output,
        path: path.resolve(__dirname, lib),
        ...library
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new webpack.DefinePlugin({
            "typeof process": JSON.stringify("undefined")
        })
    ],
    ...options
});

// Webpack config for building the sample agent
const agentWebpackConfig = {
    context: path.resolve(__dirname, 'sample'),
    entry: './agent.ts',
    mode: 'development',
    target: 'web',
    node: false,
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        filename: "agent.js",
        path: path.resolve(__dirname, 'sample'),
        library: {
            type: 'umd'
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
};

// Webpack config for building the sample game
const gameWebpackConfig = {
    context: path.resolve(__dirname, 'sample'),
    entry: './game.ts',
    mode: 'development',
    target: 'web',
    node: false,
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    output: {
        filename: "game.js",
        path: path.resolve(__dirname, 'sample'),
        library: {
            type: 'umd'
        }
    },
    resolve: {
        extensions: ['.ts', '.js']
    }
};

gulp.task('cjs', () => {
    return gulp.src('./src/index.ts')
        .pipe(ts.createProject('tsconfig.json')())
        .pipe(gulp.dest('lib/cjs'));
});

gulp.task('es', () => {
    return gulp.src('./src/index.ts')
        .pipe(gulpWebpack(libWebpackConfig(
            'lib/es',
            'index.js',
            {
                experiments: {
                    outputModule: true
                }
            },
            {
                library: {
                    type: "module"
                }
            },
            true
        ), webpack))
        .pipe(gulp.dest('lib/es'));
});

gulp.task('umd-dev', () => {
    return gulp.src('./src/index.ts')
        .pipe(gulpWebpack(libWebpackConfig(
            'lib/umd',
            'piximoroxel8ai.js',
            {},
            {
                library: {
                    type: 'umd',
                    name: 'PixiMoroxel8AI'
                }
            },
            false
        ), webpack))
        .pipe(gulp.dest('lib/umd'));
});

gulp.task('umd', () => {
    return gulp.src('./src/index.ts')
        .pipe(gulpWebpack(libWebpackConfig(
            'lib/umd',
            'piximoroxel8ai.min.js',
            {},
            {
                library: {
                    type: 'umd',
                    name: 'PixiMoroxel8AI'
                }
            },
            true
        ), webpack))
        .pipe(gulp.dest('lib/umd'));
});


gulp.task('build-lib', gulp.series('cjs', 'es', 'umd-dev', 'umd'));

gulp.task('build-game', () => {
    return gulp.src('./sample/game.ts')
        .pipe(gulpWebpack(gameWebpackConfig, webpack))
        .pipe(gulp.dest('./sample'));
});

gulp.task('build-agent', () => {
    return gulp.src('./sample/agent.ts')
        .pipe(ts.createProject('tsconfig.json', {
            module: "ES6",
            target: "es6",
            strict: false,
            declaration: false
        })())
        .pipe(gulp.dest('./sample'));
});

gulp.task('build-sample', gulp.series('build-agent', 'build-game'));

gulp.task('build', gulp.series('build-lib', 'build-sample'));