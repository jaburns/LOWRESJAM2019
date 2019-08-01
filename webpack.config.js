const WebpackPreBuildPlugin = require('pre-build-webpack');

module.exports = {
    mode: 'production',
    context: __dirname,
    devtool: 'source-map',
    entry: './src/main.ts',
    output: {
        path: __dirname+'/public',
        filename: 'bundle.js'
    },
    resolve: {
        extensions: ['.js', '.ts'],
        modules: [ __dirname+'/src', 'node_modules' ]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'awesome-typescript-loader' },
            { test: /\.glsl$/, loader: 'raw-loader' },
        ]
    },
    plugins: [
        new WebpackPreBuildPlugin(stats => {
            require('./src/shaders/index.gen.js')();
        })
    ],
    optimization: {
        minimize: true
    },
};
