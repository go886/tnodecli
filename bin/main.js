#!/usr/bin/env node
const commander = require('commander')
const config = require('../lib/util/config')
const console = require('../lib/util/log')

commander.version(config.version)
commander
    .command('create <appname>')
    .description('create a new TNode Project')
    .action(require('../lib/command/create'));

commander
    .command('init')
    .description('init TNode Project')
    .action(require('../lib/command/init'));

commander
    .command('postfix')
    .description('parse postfix')
    .action(require('../lib/command/postfix'))

commander
    .command('dev [entry]')
    .description('development mode')
    .action(require('../lib/command/dev'));

commander
    .command('build [entry]')
    .description('build')
    .action(require('../lib/command/build'));




commander.parse(process.argv)
if (!commander.args.length) {
    console.log('welcome use TNode Engine (' + config.version + ')')
    commander.help()
}
