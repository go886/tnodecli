const fs = require('fs');
const path = require('path')


function isString(v) {
    return v && (typeof v === "string");
}

function imgfileToBase64(path) {
    let bitmap = fs.readFileSync(path);
    let base64str = Buffer.from(bitmap, 'binary').toString('base64');
    return base64str;
}

module.exports = {
    name: 'img',
    do(ctx) {
        var attributes = ctx.attributes;
        var styles = ctx.styles;
        attributes && Object.keys(attributes).forEach(k => {
            let v = attributes[k]
            if (isString(v) && v.length > 2 && v.indexOf('@/') == 0) {
                if (!ctx.engine.config.resource) {
                    console.error('config resource config error');
                }else  {
                    let fullname = path.join(ctx.engine.config.resource, v.substring(2));
                    if (!fs.existsSync(fullname)) {
                        console.error(`resource: ${fullname} not exists`)
                    }else {
                        try {
                            v = imgfileToBase64(fullname)
                            attributes[k] = `data:image/png;base64, ${v}`
                        } catch (error) {
                            console.error(`read resource: ${fullname} error:${error}`)
                        }
                    }
                }
            }
        });

        // styles && Object.keys(styles).forEach(k => {
        //     let v = styles[k]
        //     if (v) {

        //     }
        // });
    }
}