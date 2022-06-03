var path = require("path");
module.exports = {
    mode: 'production',   // none, development 
    context: __dirname,
    entry: {
        main: '../build/out.js'
    },
    output: {
        path: path.resolve(__dirname, "../build"),
        // publicPath: "/assets/",
        filename: "[name].js",
        libraryTarget: 'commonjs2'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', "stage-2"]
                    }
                }
            }
        ]
    },
    externals: [
        require('@ali/tnode/loader')
    ]
}
