const fs = require('fs')
const path = require('path')
var child_process = require('child_process');
const util = require('../util/util')

module.exports = () => {
    const project = process.cwd();
    util.syncCopyDir(path.join(__dirname, '../templates/.tnode'), path.join(project, '/.tnode'))
    util.syncCopyDir(path.join(__dirname, '../templates/.vscode'), path.join(project, '/.vscode'))

    if (fs.existsSync(path.join(project, 'package.json'))) {
        child_process.execSync('npm init -f', { cwd: project }, (error, stdout, stderr) => {

        });
    }

    child_process.execSync('tnpm install @ali/tnode --save' , {cwd:project}, (error, stdout, stderr)=>{

    });

    child_process.execSync('tnpm install babel-loader@7.1.5 babel-core@6.26.3 babel-preset-env@1.7.0 babel-preset-stage-2@6.24.1 --save-dev' , {cwd:project}, (error, stdout, stderr)=>{

    });

    console.info('init finished! ');
};