const config = require('./config')
const service = require('@ali/tnode/test/debugger')
service.project = require(config.acoutput)
service.run(config.debugport);
// service.echo('$debug.load', ['abc'])
// service.echo('abc.main.oncreate', {})
// service.echo('abc.header.onclick', {})