const path = require('path')
const fs = require('fs')

const names = [
    'width',
    'height',
    'flex',
    'margin-left',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'border-width',
    'font-size',
]

var attrsName = {}
names.forEach(k=>{
    attrsName[k] = true;
});
const suffixs = [
    'px',
    'rem',
]

function isString(v) {
    return v && (typeof v === "string");
}

function isSuffix(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function removeSuffix(value) {
    if (isString(value)) {
        for (var i = 0; i < suffixs.length; ++i) {
            if (isSuffix(value, suffixs[i])) {
                value = value.substr(0, value.length - suffixs[i].length)
            }
        }
    }
    return value;
}

function format(value) {
    return parseFloat(value)
}

module.exports = {
    name: 'cssformat',
    do(ctx) {
        var attributes = ctx.attributes;
        var styles = ctx.styles;
        attributes && Object.keys(attributes).forEach(k => {
            if (attrsName[k]) {
                attributes[k] = format(attributes[k])
            }
        });

        styles && Object.keys(styles).forEach(name => {
            var style = styles[name]
            Object.keys(style).forEach(k => {
                if (attrsName[k]) {
                    style[k] = format(style[k])
                }
            })
        });
    }
}