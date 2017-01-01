var webpack = require('webpack');
var config = [];

function generateConfig(name) {
    var uglify = name.indexOf('min') > -1;

    var config = {
        context: __dirname + "/",
        entry: {
            [name]: './index.js'
        },
        output: {
            path: 'dist/',
            filename: '[name].js',
            sourceMapFilename: '[name].map',
            publicPath: 'dist',
            library: 'CrossMessenger',
            libraryTarget: 'umd'
        },

        module: {
            loaders: [
                {
                    test: /\.js$/,
                    loader: 'babel',
                    exclude: /node_modules/,
                    query: {
                        presets: ['es2015', 'stage-1'],
                        plugins: ["transform-decorators-legacy"]
                    }
                }
            ]
        },
        devtool: 'source-map',

        // watch filesystem not supported in VM vagrant.
        // polling is the solution...
        // watchOptions: {
        //     poll: 1000
        // }
    };

    config.plugins = [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        })
    ];

    if (uglify) {
        config.plugins.push(
            new webpack.optimize.UglifyJsPlugin({
                output: {
                    comments: false
                },
                compressor: {
                    warnings: false
                }
            })
        );
    }

    return config;
}

['CrossMessenger', 'CrossMessenger.min'].forEach(function (key) {
    config.push(generateConfig(key));
});

module.exports = config;
