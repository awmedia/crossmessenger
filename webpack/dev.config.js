const path = require('path');
const basePath = path.resolve(__dirname, '../', 'src') + '/';
const webpack = require('webpack');
const dotenv = require('dotenv-safe').load({silent:true});
const uglifyPlugin = new webpack.optimize.UglifyJsPlugin({ include: /\.min\.js$/, minimize: false });

console.log("\n\n***********[ Webpack settings ]***********");
console.log("basePath: \t", basePath);
console.log("\n\n");

module.exports = {
    devtool: 'eval-source-map',

    // Step 1: Source Maps
    //devtool: 'cheap-module-source-map',

    context: __dirname + "/../",

    entry: {
        crossmessenger: basePath + 'crossmessenger.js'
    },
    output: {
        path: 'build',
        filename: '[name].bundle.js',
        publicPath: 'build',
    },

    // Step 2: Node environment
    plugins: [
        // new webpack.DefinePlugin({
        //     'process.env': {
        //         'NODE_ENV': JSON.stringify('production')
        //     }
        // }),
        // uglifyPlugin
    ],

    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'stage-1'],
                    plugins: ["transform-decorators-legacy", "transform-decorators-legacy"]
                }
            }
        ]
    },

    progress: true,

    // watch filesystem not supported in VM vagrant.
    // polling is the solution...
    watchOptions: {
        poll: 1000
    }
};
