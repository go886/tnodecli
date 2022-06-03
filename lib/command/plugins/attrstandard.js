const standardAtrrsMap = {
    'clip': {
        name: 'overflow',
        to: function (value) {
            if (value == '1' || value == 'true')
                return 'hidden'
            else {
                return value
            }
        }
    }
}
module.exports = {
    name: 'attrstandard',
    do(ctx) {
        var attributes = ctx.attributes;
        var styles = ctx.styles;
        attributes && Object.keys(attributes).forEach(k => {
            const attr = standardAtrrsMap[k]
            if (attr) {
                console.warn('nonstandard attr:%s -> %s', k, attr.name)
                var value = attributes[k]
                value = attr.to(value)
                delete attributes[k]
                attributes[attr.name] = value;
            }
        });

        styles && Object.keys(styles).forEach(name => {
            var style = styles[name]
            Object.keys(style).forEach(k => {
                const attr = standardAtrrsMap[k]
                if (attr) {
                    console.warn('nonstandard attr:%s -> %s', k, attr.name)
                    var value = style[k]
                    value = attr.to(value)
                    delete style[k]
                    style[attr.name] = value;
                }
            })
        });
    }
}