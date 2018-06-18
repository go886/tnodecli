#!/usr/bin/env node
const commander = require('commander')

// console.log(process.argv)


// commander.usage('<command>')
commander
    .command('create <ProjectName>')
    .description('create a new TNode Project')
    .action(require('../lib/command/create'));

commander
    .command('init')
    .description('init TNode Project')
    .action(() => {

    });

commander
    .command('dev [entry]')
    .description('devloper')
    .action(require('../lib/command/dev'));

commander.parse(process.argv)
if (!commander.args.length) {
    console.log('welcome use TNode Engine(0.0.1)!!!')
    commander.help()
}
