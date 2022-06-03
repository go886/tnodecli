const path = require('path')
const fs = require('fs')

module.exports = {
    isFunction(v) {
        var getType = {};
        return v && getType.toString.call(v) == '[object Function]';
    },
    isString(v) {
        return (typeof v === "string");
    },
    isObject(o) {
        return o instanceof Object
    },
    isInteger(obj) {
        return typeof obj === 'number' && obj%1 === 0
    },
    isFloat(n){
        return Number(n) === n && n % 1 !== 0;
    },
    isBoolean(obj) {
        return obj === !!obj
    },
    stringify(x) {
        return typeof x === 'undefined' || x === null
            ? ''
            : typeof x === 'object'
                ? x instanceof RegExp
                    ? x.toString()
                    : x instanceof Date
                        ? JSON.parse(JSON.stringify(x))
                        : JSON.stringify(x,(key, value)=>{
                            if (value !== null && value !== 'undefined') return value;
                        })
                : x.toString()
    },
    copyFile(src, dst) {
        fs.createReadStream(src).pipe(fs.createWriteStream(dst));
    },
    syncCopyDir(srcDir, dstDir) {
        if (!fs.existsSync(dstDir)) {
            fs.mkdirSync(dstDir, '777');
        }
        var fileList = fs.readdirSync(srcDir);
        fileList && fileList.forEach(file => {
            if (file !== '.DS_Store') {
                const srcPath = path.join(srcDir, file);
                const dstPath = path.join(dstDir, file);
                if (fs.statSync(srcPath).isDirectory()) {
                    this.syncCopyDir(srcPath, dstPath);
                } else {
                    console.info('copy file %s', file)
                    this.copyFile(srcPath, dstPath);
                }
            }
        });
    },
    loadProjectName(project) {
        try {
            var package =  require(path.join(project, 'package.json'))
            return package.name;
        } catch (error) {
        }
    }
}