const TSLoader = {
    test: /\.tsx?$/,
    use: 'ts-loader',
    exclude: /node_modules/
};

const BabelLoader = {
    test: /\.js*/,
    exclude: /node_modules/,
    use: {
        loader: 'babel-loader',
        options: {
            presets: [
                '@babel/preset-react',
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties',
            ],
            cacheDirectory: '../cache/babel',
        },
    },
};

const ESLintLoader = {
    test: /\.js$/,
    enforce: 'pre',
    exclude: /node_modules/,
    use: {
        loader: 'eslint-loader',
        options: {
            configFile: __dirname + '/../.eslintrc'
        },
    }
};

const CSSLoader = {
    test: /\.css$/,
    exclude: /node_modules/,
    use: [
        'style-loader',
        'css-loader',
        'postcss-loader'
    ],
};

module.exports = {
    TSLoader: TSLoader,
    BabelLoader: BabelLoader,
    ESLintLoader: ESLintLoader,
    CSSLoader: CSSLoader
};
