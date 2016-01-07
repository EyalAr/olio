var webpack = require("webpack");

module.exports = {
    entry: "./index.js",
    module: {
        loaders: [{
            test: /.+\.js$/,
            exclude: [ /node_modules/, /bower_components/ ],
            loader: 'babel-loader'
        }]
    },
    resolve: {
        alias: {
            "fabric": "./bower_components/fabric/dist/fabric.js"
        }
    },
    output: {
        filename: "build/index.js"
    },
    plugins: [
        new webpack.SourceMapDevToolPlugin(
            '[file].map', null, "../[resource-path]", "../[resource-path]")
    ]
};
