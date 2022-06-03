var path = require("path");

module.exports = {
    version: '1.0.0',
    port: 8899,
    path: path.resolve(__dirname, '../'),
    entry: 'main.html',
    resource: path.resolve(__dirname, '../resource'),
    output: path.resolve(__dirname, '../build/main.json'),
    acoutput: path.join(__dirname, '../build/out.js'),
    ac: path.resolve(__dirname, '../build/main.js'),
    openbrowser: true,
    mocked: true,
    border: false,
    qrschema: "http://h5.m.taobao.com/tnode/index.htm?tnode={TNodeURL}",
    compress: true,
    debugger: false,
    debugport: 6899,
    plugin: [
        // 'define'
    ]
}