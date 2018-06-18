const path = require('path')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const middleware = require('webpack-dev-middleware');
// const webpackHotMiddleware = require('webpack-hot-middleware')
const express = require('express');



const webpackConfig = require('./webpack.config')
webpackConfig.mode = 'none'


function runWatch() {
    const compiler = webpack(webpackConfig)
    compiler.watch({}, (err, stats) => {
        console.log(err);
    });
}

function runDevServer() {
    const compiler = webpack(webpackConfig)
    const app = express();
    app.use(middleware(compiler, {
        quiet: true,  //向控制台显示任何内容 
        // publicPath: webpackConfig.output.publicPath
    }));

    // app.use(express.static(webpackConfig.devServer.contentBase))
    app.use(express.static(__dirname))

    const port = webpackConfig.devServer.port
    app.listen(port, ()=>{
        console.log('listen' + port)
    });
    return;



    // const server = new WebpackDevServer(
    //     compiler,
    //     {
    //         contentBase: path.join(__dirname, '../build'),
    //         quiet: true,
    //         before(app, ctx) {
    //             app.use(devmiddleware)
    //             // ctx.devmiddleware.waitUntilValid(() => {
    //             //     // resolve()
    //             // });
    //         }
    //     },
    // )

    // server.listen(webpackConfig.devServer.port);
}


function test() {
    const compiler = webpack(webpackConfig)
}


module.exports = {
    start() {
        // runWatch();
        runDevServer();



        // return;


        // hotMiddleware = webpackHotMiddleware(compiler, { 
        //   log: false, 
        //   heartbeat: 2500 
        // })

        // compiler.plugin('compilation', compilation => {
        //   compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
        //     hotMiddleware.publish({ action: 'reload' })
        //     cb()
        //   })
        // })

        // compiler.plugin('done', stats => {
        //   logStats('Renderer', stats)
        // })


    }
}