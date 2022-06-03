const path = require("path")
const fs = require("fs");
const crypto = require('crypto')
const webpack = require('webpack')
const xmlreader = require('./xmlreader')
const plugins = require('./plugins')
const filewatcher = require('filewatcher')
const dslparser = require('./parser').parser;


function isString(v) {
    return v && (typeof v === "string");
}
function isFunction(v) {
    var getType = {};
    return v && getType.toString.call(v) == '[object Function]';
};
function hasFilter(str) {
    const reg = /\$\.[a-zA-Z]+\.[a-zA-Z]+\(/i;
    return reg.test(str);
}

function isBindAttr(value) {
    const reg = /\{\{[^\}\}]+\}\}/i;
    return value.match(reg) != null || hasFilter(value);
}


function unique(array) {
    var n = [];//临时数组
    for (var i = 0; i < array.length; i++) {
        if (n.indexOf(array[i]) == -1) n.push(array[i]);
    }
    return n;
}

function toXMLValue(v) {
    return v.replace(/&/g, '&amp;').replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
}

function dslToXML(template) {
    template = template.replace(/&/g, '&amp;') //测试
    template = template.replace(/ elseif /g, ' elseif="true" ')
    template = template.replace(/ elseif>/g, ' elseif="true" >')

    // template = template.replace(/\s+(if)\s*=\s*"(.*?)"(\s+|\/\>|\>)/mg, function (item, k, v, e) {
    //     var value = " " + k + '="' + toXMLValue(v) + '"' + e;
    //     return value;
    // });

    // template = template.replace(/\s+(if)\s*=\s*'(.*?)'(\s+|\/\>|\>)/mg, function (item, k, v, e) {
    //     var value = " " + k + "='" + toXMLValue(v) + "'" + e;
    //     return value;
    // });

    return template;
}

function parserHtml(template, fileName) {
    // var rootNode = dslparser(template);
    // return rootNode;

    
    var rootNode;
    xmlreader.read(dslToXML(template), function (err, res) {
        if (err) {
            console.info(fileName);
            console.error(err.message);
            return;
        }
        rootNode = res;
    });

    if (rootNode && rootNode.type === 'body') {
        return rootNode.childrens[0];
    }

    return rootNode;
}

function removeCssComment(str) {
    const r = /\/\*[\s\S]*?\*\//mg
    return str.replace(r, '');
}

function parserStyle(css) {
    css = removeCssComment(css);
    //  const reg = /^([\.\#]?\w+)[^{]+\{([^}]*)\}/mg;
    const reg = /^([^{]+)\{([^}]*)\}/mg;
    const r = /(.*?):(.*?);/g;

    var cssRootNode = {};
    var items = [];
    while ((items = reg.exec(css))) {
        var keys = items[1];
        var value = items[2];

        var cssItem = {};
        var values = []
        while ((values = r.exec(value))) {
            cssItem[values[1].trim()] = values[2].trim();
        }

        keys.split(',').forEach(function (k) {
            let key = k.trim();
            if (cssRootNode[key]) {
                console.error(`repeat css style '${key}'`)
            }
            cssRootNode[key] = cssItem; //多keys
        });
    }

    return cssRootNode;
}

function parserScript(code) {
    return eval(code);
}

function removeSketchPX(str) {
    const r = /(\d+)px\b/mg;
    return str.replace(r, '$1')
}

function replaceFilePath(str, serverurl) {
    const r = /\"\.\//mg;
    const serverURL = "\"" + serverurl + '/uid/'

    return str.replace(r, serverURL)
}


const TNodeDSLP = {
    // entry: null, //入口文件地址
    // path: null, //入口文件目录
    // outfile: null,
    // acfile: null,
    // serverURL: null, //服务器地址
    // mocked: false, //mock功能是否开始
    // debugger: false,//是否为debugger 模式
    // plugin: [] ||{} //插件
    plugin: plugins || [],
    tnodeversion: 2,
    init(config, extendsconfig) {
        this.config = isString(config) ? require(config) : config;
        if (extendsconfig) {
            for (var key in extendsconfig) {
                this.config[key] = extendsconfig[key]
            }
        }

        if (this.config.plugin) {
            const addPlugin = (e) => {
                if (isString(e)) {
                    try {
                        var plugin = require('./plugins/' + e)
                        if (plugin) {
                            if (isFunction(plugin.init)) {
                                plugin.init(this)
                            }
                            this.plugin.push(plugin)
                        }
                    } catch (error) {
                        console.error('plugin error:%s', e)
                    }
                } else if (e) {
                    if (isFunction(e.init)) {
                        e.init(this)
                    }
                    this.plugin.push(e)
                }
            }

            if (Array.isArray(this.config.plugin)) {
                this.config.plugin.forEach(addPlugin);
            } else {
                addPlugin(this.config.plugin)
            }
        }
        if (this.config.webpackConfig) this.webpackcompiler = webpack(this.config.webpackConfig)
        return this;
    },

    watch(cb) {
        try {
            this.parse(cb, true);

        } catch (error) {
            console.error(error)
        }
    },
    build(cb) {
        this.parse(cb);
    },
    merage(result, acContent) {
        if (this.config.ac) {
            if (fs.existsSync(this.config.ac)) {
                var code = fs.readFileSync(this.config.ac, 'utf8');
                if (code) {
                    acContent = {
                        name: ((this.config.name || '') + (new Date()).getTime()).replace(/\./g, ''),
                        code,
                    }
                }
            }
        }

        var jsonInfo = JSON.stringify(result.templates);
        if (jsonInfo && jsonInfo.length > 2) {//{}
            const md5 = crypto.createHash('md5');

            const md5String = md5.update(jsonInfo + (acContent ? JSON.stringify(acContent) : '')).digest('hex');
            var info = {
                version: this.config.tnodeversion || this.tnodeversion,
                time: (new Date()).getTime(),
                md5: md5String,
            }
            if (this.config.debugger === true && this.config.serverURL) {
                info.debugger = this.config.serverURL.replace('http://', '').split(":")[0] + ':' + this.config.debugport
            }

            if (acContent) {
                info.ac = acContent;
            }

            if (result.registerlist) {
                info.register = result.registerlist;
            }

            var selfInfo = JSON.stringify({
                ".": info
            });

            selfInfo = selfInfo.substr(1, selfInfo.length - 2);
            jsonInfo = jsonInfo.substr(1);
            jsonInfo = '{' + selfInfo + ',' + jsonInfo;
        }

        return { result: jsonInfo, files: result.watchFiles, err: result.err }
    },
    parse(cb, watch = false) {
        var result = this.doparse();

        const finished = (result, err) => {
            if (err) {
                cb && cb(null, err);
                return;
            }

            var acContent = null;
            if (this.config.ac) {

                if (fs.existsSync(this.config.ac)) {
                    var code = fs.readFileSync(this.config.ac, 'utf8');
                    if (code) {
                        acContent = {
                            code,
                            name: '' + (new Date()).getTime(),
                        }
                    }
                }
            }

            var r = this.merage(result, acContent);
            cb && cb(r.result, r.err);
        }

        if (watch == true) {
            if (this.webpackcompiler && this.config.ac) {
                this.webpackcompiler.watch({ poll: 1000, aggregeateTimeout: 500, ignored: '/node_modules/', }, (err, stats) => {
                    finished(result, err);
                });
            } else {
                finished(result);
            }

            const watcher = filewatcher();
            result.watchFiles && result.watchFiles.forEach((filename) => {
                watcher.add(filename);
            });

            watcher.on('change',  (file, stat)=> {
                watcher.removeAll();
                result = this.doparse();
                // watchFiles = unique(watchFiles);

                result.watchFiles && result.watchFiles.forEach((filename) => {
                    watcher.add(filename);
                });
                finished(result);
            });
        } else {
            if (this.webpackcompiler && this.config.ac) {
                this.webpackcompiler.run((err, stats) => {
                    finished(result, err);
                });
            } else {
                finished(result);
            }
        }
    },
    parserTemplate(fullname) {
        var result = {
            registers: null,
            template: null,
            config: null,
        };

        var code = fs.readFileSync(fullname, 'utf8');
        // if (this.config.mocked) {
        //     code = replaceFilePath(code, this.config.serverURL);
        // }

        var registers = isString(code) && code.match(/<register[^>]*>([\s\S]*)<\/register>/i);
        if (registers) {
            result.registers = registers[1];
            code = code.replace(/<register[^>]*>([\s\S]*)<\/register>/i, '')
        }
        var template = isString(code) && code.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        if (!template) template = isString(code) && code.match(/<html[^>]*>([\s\S]*)<\/html>/i);
        if (template) {
            template = template[1];
            var templates = parserHtml(template, fullname) || {}

            var styles = code.match(/<style[^>]*>([\s\S]*)<\/style>/i);
            if (styles) {
                styles = removeSketchPX(styles[1]);
                styles = parserStyle(styles);
                if (styles) templates['_styles'] = styles;
            }
            var script = code.match(/<script[^>]*>([\s\S]*)<\/script>/i);
            if (script) {
                script = parserScript(script[1])
                if (script) {
                    var config = script["#tnode"] || {};
                    delete script["#tnode"];
                    result.config = config;
                    if (this.config.mocked || (config.ignoreMock === true)) {
                        templates['_data'] = script;
                    }
                }
            }

            result.template = templates;
        }

        return result;
    },
    buildActionServiceEntry(fileMap) {
        var dir = this.config.path;
        var jsfilesMap = {}
        fileMap && Object.keys(fileMap).forEach((key) => {
            var filename = fileMap[key]
            var paths = path.parse(filename)
            var jsfilename = path.format({
                dir: paths.dir,
                name: paths.name,
                ext: '.js'
            })
            // console.log('jsfilename:{jsfilename}',{jsfilename} )
            if (fs.existsSync(jsfilename)) {
                jsfilesMap[key] = '..' + jsfilename.replace(dir, '')
            }
        });

        var items = []
        Object.keys(jsfilesMap).forEach(key => {
            items.push("\t'" + key + "' : " + "require('" + jsfilesMap[key] + "'),")
        });

        if (items.length > 0 && this.config.acoutput) {
            items.splice(0, 0, 'module.exports = { ')
            items.push('}')

            if (!fs.existsSync(path.dirname(this.config.acoutput))) {
                fs.mkdirSync(path.dirname(this.config.acoutput), '777');
            }
            fs.writeFileSync(this.config.acoutput, items.join('\n'))
        }
    },
    doparse() {
        var projectDir = path.dirname(path.join(this.config.path, this.config.entry))
        function getShortName(fullname) {
            return fullname.replace(projectDir + '/', '').replace(path.extname(fullname), '')
        }


        var registerlist = ''
        var templates = {}; //{'$':{'version':'1.0'}}
        var stackTemplateFiles = [{ path: path.join(this.config.path, this.config.entry), shortName: getShortName(this.config.entry) }]
        var fileMap = {}
        var watchFiles = []
        var err = null;

        function getAllNode(root) {
            var stack = []
            var nodes = []
            if (root) {
                stack.push(root)
                while (stack.length > 0) {
                    var tmpNode = stack.pop()
                    nodes.push(tmpNode)
                    if (tmpNode.children && Array.isArray(tmpNode.children)) {
                        tmpNode.children.forEach(e => {
                            stack.push(e);
                        });
                    }
                }
            }
            return nodes;
            //return nodes.reverse();
        }

        const doplugin = (context) => {
            // var context = {
            //     engine, 
            //     path,
            //     shortName,
            //     templates,
            //     env,
            //     tagName,
            //     node,
            //     key,
            //     value,
            // }
            this.plugin && this.plugin.forEach((plugin) => {
                if (plugin && isFunction(plugin.do)) {
                    try {
                        plugin.do(context);
                    } catch (error) {
                        console.error('plugin:%s error:%s tagName:%s', plugin.name, error.message, context.tagName)
                    }
                }
            });
            return context;
        };

        while (stackTemplateFiles.length && err == null) {
            const item = stackTemplateFiles.pop();
            const fullName = item.path;
            const shortName = item.shortName;
            const dir = path.dirname(fullName)
            if (templates[shortName]) {
                continue;
            }

            try {
                watchFiles.push(fullName);
                var r = this.parserTemplate(fullName) || {}
                if (r.registers) registerlist += r.registers;
                if (r.template) r.template.name = shortName
                templates[shortName] = r.template
                fileMap[shortName] = fullName

                if (r && r.template) {
                    var context = {
                        engine: this,
                        path: fullName,
                        shortName,
                        template: r.template,
                        env: r.config,
                    }

                    const nodes = getAllNode(r.template);
                    function itorNode(node, index) {
                        const attributes = node.attrs;
                        if (node.type == 'template' && attributes && attributes.src) {
                            var fullName = path.join(dir, attributes.src)
                            var shortName = getShortName(fullName);
                            stackTemplateFiles.push({ 'path': fullName, 'shortName': shortName });
                            attributes.src = shortName
                        }

                        attributes && Object.keys(attributes).forEach((k) => { //暂时支持老版本
                            var v = attributes[k]
                            var arr = ['$://poplayer?'];
                            try {
                                for (var i = 0; i < arr.length; ++i) {
                                    var token = arr[i];
                                    if (0 === v.indexOf(token)) {
                                        v = v.substring(token.length);
                                        var info = JSON.parse(v)
                                        var name = info && info.src;
                                        if (name) {
                                            var fullName = path.join(dir, name)
                                            var shortName = getShortName(fullName)
                                            stackTemplateFiles.push({ 'path': fullName, 'shortName': shortName });
                                            info.src = shortName;
                                            attributes[k] = token + JSON.stringify(info);
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error(error.message)
                            }
                        });


                        context.tagName = node.type;
                        context.node = node;
                        context.attributes = attributes;
                        context.styles = node._styles;
                        doplugin(context)
                        if (node.attrs && 0 == Object.keys(node.attrs).length) {
                            delete node.attrs;
                        }
                    };
                    nodes && nodes.forEach(itorNode);
                }
            } catch (error) {
                err = error
                err.fileName = fullName;
            }
        }

        if (this.config.ac) {
            this.buildActionServiceEntry(fileMap)
        }

        if (registerlist && registerlist.length > 0) {
            registerlist = parserHtml('<register>' + registerlist + '</register>')
            registerlist = registerlist.children;
        }

        return {
            templates,
            watchFiles,
            err,
            registerlist
        }
    }
}



function NativeTNodeDSL() {
    return this.init.apply(this, arguments);
}
NativeTNodeDSL.prototype = TNodeDSLP;

module.exports = (config, extendsconfig) => {
    return new NativeTNodeDSL(config, extendsconfig)
};