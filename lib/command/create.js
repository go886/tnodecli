const path = require('path')
const fs = require('fs')
const console = require('../util/log')

module.exports = (name) => {
    const curDir = process.cwd();
    const project = path.join(curDir, name)
    if (fs.existsSync(project)) {
        console.error('project: {project} exists', { project })
        return;
    }

    function copyFile(src, dst) {
        fs.createReadStream(src).pipe(fs.createWriteStream(dst));
    }


    function copyDirSync(srcDir, dstDir) {
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir, '777');
        }
        var fileList = fs.readdirSync(srcDir);
        fileList && fileList.forEach(file => {
            const srcPath = path.join(srcDir, file);
            const dstPath = path.join(dstDir, file);
            if (fs.statSync(srcPath).isDirectory()) {
                copyDirSync(srcPath, dstPath);
            } else {
                console.log('copy file {file}', { file })
                copyFile(srcPath, dstPath);
            }
        });
    }

    copyDirSync(path.join(__dirname, '../templates/'), project)

    console.log('project {name} is ok!!! ', { name })
};