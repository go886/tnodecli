var path = require("path");
module.exports = {
    context: path.resolve(__dirname, '../'),
    entry: {
        main: './main.js'
    },
    output: {
        path: path.resolve(__dirname, "../build"),
        publicPath: "/assets/",
        filename: "[name].js",
        libraryTarget: 'commonjs2'
    },
    devServer: {
        contentBase: path.join(__dirname, "../build"), //网站的根目录为 根目录/dist，如果配置不对，会报Cannot GET /错误
        port: 9000,
        open: true,
        index: 'index.html'
        // host: '192.168.0.103' //请在dos下，输入ipconfig可以找到当前电脑的ip
    }
}
