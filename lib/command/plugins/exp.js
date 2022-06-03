const path = require('path')
const fs = require('fs')
const expression = require('./expression')

function isString(v) {
    return v && (typeof v === "string");
}
function isObject(o) {
    return o instanceof Object
}
function hasFilter(str) {
    const reg = /\$\.[a-zA-Z]+\.[a-zA-Z]+\(/i;
    return reg.test(str);
}

function isDefine(value) {
    return /^\{\{\s*\$\([a-zA-Z0-9.]+\)\s*\}\}$/.test(value)
}

function isBindAttr(key, value) {
    if (key == 'if' || key == 'elseif')
        return true;
    const reg = /\{\{[^\}\}]+\}\}/i;
    return value && isString(value) && value.match(reg) != null || hasFilter(value);
}
module.exports = {
    name: 'exp',
    init(engine) {
        this.engine = engine
        var definePath = path.join(this.engine.config.path, 'define.js')
        try {
            this.globalDefine = require(definePath)
        } catch (error) {

        }
    },

    getValue(keypath, vm, defaultvm) {
        vm = vm || {}
        var keys = keypath.split('.')
        keys.reverse()
        while (keys.length > 0 && vm) {
            vm = vm[keys.pop()]
        }

        if (!vm && defaultvm) {
            vm = getValue(keypath, defaultvm, null);
        }
        return vm;
    },
    parseDefine(ctx, value) {         // {{$(trackinfo)}}
        var token = value.substring(4, value.length - 3)
        var v = this.getValue(token, ctx.env, this.globalDefine);//      (ctx.env || {})[token] || (this.globalDefine || {})[token]
        if (!v) {
            console.warn('no match define:%s tagName:%s filename:%s', value, ctx.tagName, ctx.shortName)
        }
        return v ? v : ''
    },
    do(ctx) {
        var attributes = ctx.attributes;
        const node = ctx.node;
        attributes && Object.keys(attributes).forEach(k => {
            var value = attributes[k];
            const isBind = isBindAttr(k, value);
            if (isBind) {
                try {
                    if (isDefine(value)) {
                        value = this.parseDefine(ctx, value);
                        if (!isObject(value)) {
                            attributes[k] = value;
                            return;
                        }
                    }

                    const postfix = expression.postfix(value)
                    if (ctx.engine.config.expression == true) {
                        console.log('------------------->')
                        console.log('ex:%s\t', value)
                        console.info('postfix:%s\n', isString(postfix) ? postfix : JSON.stringify(postfix, null, 2))
                    }

                    delete attributes[k]
                    if (!node.bindattrs) node.bindattrs = {}
                    node.bindattrs[k] = postfix;
                    // postfix && postfix.forEach((e, i)=>{
                    //     if (isString(e) && isDefine(e)) {
                    //         postfix[i] = this.parseDefine(ctx, e)
                    //     }
                    // });
                    if (k === 'repeat' && !attributes['key']) {
                        console.warn("repeat=%s not match \"key\" prop", value)
                        console.info('See https://yuque.antfin-inc.com/ocean/tnode/optimize#c5vhgf for more information')
                    }
                } catch (error) {
                    console.error('expression error tagName:%s key:%s file:%s', ctx.tagName, k, ctx.shortName)
                    console.info(' -> %s', isString(value) ? value : JSON.stringify(value))
                    console.info((error.message || '').split('Expecting')[0])
                }
            } else if ('class' == k) {
                node.class = attributes[k]
                delete attributes[k]
            } else if ('tree' == k) {
                var tree = parseInt(attributes[k]);
                node.tree = isNaN(tree) ? attributes[k] : tree;
                delete attributes[k]
            }
        });
    }
}