var webpack = require("webpack");

module.exports = {
    entry: "./index.js",
    module: {
        loaders: [{
            test: /.+\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
        }]
    },
    output: {
        filename: "build/index.js"
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin(
            '[file].map', null, "../[resource-path]", "../[resource-path]")
    ]
};
