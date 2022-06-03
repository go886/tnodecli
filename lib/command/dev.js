const path = require('path')
const express = require('express')
const qr = require('qr-image')
const open = require('open')
const version = require("versioning")
require('string.format')
const stream = require('stream');


const tnode = require('./TNode')
const cliConfig = require('../util/config');
const util = require('../util/util')
const serializer = require('./serializer')

function killport(port) {
    var cmd = process.platform == 'win32' ? 'netstat -ano' : 'ps aux';
    var exec = require('child_process').exec;
    exec(cmd, function (err, stdout, stderr) {
        if (err) { return console.error(err); }

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



function localIp() {
    var os = require('os');
    var IPv4, hostName;
    hostName = os.hostname();
    var net = os.networkInterfaces();
    var en = net.en0 ? net.en0 : net.en1;
    for (var i = 0; i < en.length; i++) {
        en.forEach(function (v, index) {
            if (v.family == 'IPv4') {
                IPv4 = v.address;
            }
        });
    }
    return IPv4
}

module.exports = (project) => {
    project = project || process.cwd()

    const projectDir = project;
    const configDir = path.resolve(projectDir, '.tnode');
    const tnodeconfigpath = path.join(configDir, 'config.js');
    const webpackconfigpath = path.join(configDir, 'webpack.config.js');
    var webpackConfig, config;
    try {
        webpackConfig = require(webpackconfigpath)
        config = require(tnodeconfigpath)
    } catch (error) {
        console.error(error.message)
        console.info("Please Try Run 'tnode init'")
        return;
    }

    const port = config.port;
    const serverURL = 'http://' + localIp() + ':' + port;
    if (version.compare(cliConfig.version, config.version) == -1) {
        console.error('TNodeCLI is old version.\r\nplease use `npm update -g @ali/tnodecli`  update.')
        return;
    }

    if (!config.name) config.name = util.loadProjectName(project)

    var dslResult = '{}'
    var binaryDsl = ''
    const compiler = tnode(config, { webpackConfig, serverURL });
    compiler.watch((data, err) => {
        if (err) {}//console.error(err.message);
        else if (data) {
            dslResult = data;//JSON.parse(JSON.stringify(data));
            binaryDsl =  Buffer.from(serializer.safe_encode(dslResult, config.compress), "base64");
        }
    });

    const app = express();
    app.use(express.static(configDir))
    app.use('/tnode', (req, res) => {
        res.type('text')
        res.send(dslResult)
    });
    app.use('/b/tnode', (req, res) => {
        const readStream = new stream.PassThrough();
        readStream.end(binaryDsl);
        res.set('Content-disposition', 'attachment; filename=' + 'tnode.bin');
        res.set('Content-Type', 'text/html');
        readStream.pipe(res);
    })
    app.get('/qrcode', (req, res) => {
        var TNodeURL = serverURL + '/tnode'
        var qrurl = config.qrschema.format({ TNodeURL: encodeURIComponent(TNodeURL) })
        var img = qr.image(qrurl, { size: 5 });
        res.type('png');
        img.pipe(res);
    });

    app.get('/b/qrcode', (req, res) => {
        var TNodeURL = serverURL + '/b/tnode'
        var qrurl = config.qrschema.format({ TNodeURL: encodeURIComponent(TNodeURL) })
        var img = qr.image(qrurl, { size: 5 });
        res.type('png');
        img.pipe(res);
    });

    var server = app.listen(port, () => {
        // var host = server.address().address;
        // var port = server.address().port;
        console.info('TNode listening at %s', serverURL);
        if (config.openbrowser) {
            open(serverURL)
        }
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error('port:%d in use, please check setting', port);
            server.close();
            process.exit();
        }
    });


    process.on('SIGINT', () => {
        console.info(' TNode stop...');
        server.close();
        process.exit();
    });
};