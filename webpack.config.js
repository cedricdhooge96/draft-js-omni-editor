const path = require('path');
const loaders = require('./webpack/loaders');

module.exports = {
    entry: './src/index.js',
    mode: 'development',
    module: {
        rules: [
            loaders.CSSLoader,
            loaders.TSLoader,
            loaders.BabelLoader,
            loaders.ESLintLoader
        ]
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    }
};
