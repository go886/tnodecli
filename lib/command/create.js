const path = require('path')
const fs = require('fs')
var child_process = require('child_process');
const util = require('../util/util')

module.exports = (name) => {
    const curDir = process.cwd();
    const project = path.join(curDir, name)
    if (fs.existsSync(project)) {
        console.error('project: %s exists',  project)
        return;
    }

    util.syncCopyDir(path.join(__dirname, '../templates/'), project)

    child_process.execSync('npm init -f' , {cwd:project}, (error, stdout, stderr)=>{

    });

    child_process.execSync('tnpm install @ali/tnode --save' , {cwd:project}, (error, stdout, stderr)=>{

    });

    child_process.execSync('tnpm install babel-loader@7.1.5 babel-core@6.26.3 babel-preset-env@1.7.0 babel-preset-stage-2@6.24.1 promise-polyfill@8.1.0 --save-dev' , {cwd:project}, (error, stdout, stderr)=>{

    });

    console.info('project %s is ok!!! ',  name)
};