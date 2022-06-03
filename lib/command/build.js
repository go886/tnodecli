const fs = require('fs')
const path = require('path')
const tnode = require('./TNode')
const util = require('../util/util')
const serializer = require('./serializer')
module.exports = (project) => {
    project = project || process.cwd()

    const projectDir = project;
    const configDir = path.resolve(projectDir, '.tnode');
    var webpackConfig, config;
    try {
        webpackConfig = require(path.join(configDir, 'webpack.config.js'))
        config = require(path.join(configDir, 'config.js'))
    } catch (error) {
        console.error(error.message)
        console.info("Please Try Run 'tnode init'")
        return;
    }
   
    if (!config.name) config.name = util.loadProjectName(project)

    if (config.output) {
        const compiler = tnode(config, { webpackConfig, deugger: false, mocked: false });
        compiler.build((data, err) => {
            if (err) console.error(err)
            else {
                if (!fs.existsSync(path.dirname(config.output))) {
                    fs.mkdirSync(path.dirname(config.output), '777');
                }
                fs.writeFileSync(config.output, data);

                const isNeedBin = config.disabledBin !== true;
                if (isNeedBin) {
                    const boutfile = config.output + '.json';
                    fs.writeFileSync(boutfile, serializer.safe_encode(data, config.compress))
                    console.info('output file: %s', boutfile);

                }
                console.info('output file: %s', config.output);
            }
        });
    } else {
        console.error('output is null')
    }
};