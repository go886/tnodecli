const path = require('path')
const fs = require('fs')
const console = require('../util/log')
const webpack = require('webpack')



function killport(port) {
    var cmd = process.platform == 'win32' ? 'netstat -ano' : 'ps aux';
    var exec = require('child_process').exec;
    exec(cmd, function (err, stdout, stderr) {
        if (err) { return console.log(err); }

        stdout.split('\n').filter(function (line) {
            var p = line.trim().split(/\s+/);
            var address = p[1];

            if (address != undefined) {
                if (address.split(':')[1] == port) {
                    exec('taskkill /F /pid ' + p[4], function (err, stdout, stderr) {
                        if (err) {
                            return console.log('释放指定端口失败！！');
                        }

                        console.log('占用指定端口的程序被成功杀掉！');
                    });
                }
            }
        });
    });
}



function startWebpack(config) {
    console.log('webpack config:{config}', {config})
    webpack(config)
}

module.exports = (project) => {
    project = project || process.cwd()
    console.log('name:{project}', { project })

    var runner = require(path.join(project, '.tnode/runner.js'))
    runner.start();
    return;

    var webpackconfigpath = path.join(project, '.tnode/webpack.config.js')
    console.log('webpackconfigpath:{webpackconfigpath}', { webpackconfigpath })

    startWebpack(require(webpackconfigpath))
    return;



    project = process.cwd() + '/test/test';
    const configpath = path.join(path.dirname(project), '.tnode/config.js')
    var config = { port: 8899 };
    if (fs.existsSync(configpath))
        config = require(configpath)
    else
        config = require('../templates/.tnode/config')

    var express = require('express');
    var app = express();

    app.get('/', function (req, res) {
        res.send('Hello World!');
    });


    // killport(3000)
    var server = app.listen(config.port, function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log('Example app listening at http://{host}:{port}', { host, port });
    });

    process.on('exit', () => {
        console.log('exit')
        server.close();
    });

    process.on('beforeExit', () => {
        console.log('beforeExit')
    });

    process.on('SIGINT', function () {
        console.log('SIGINT信号，按Control-D退出');
    });
};