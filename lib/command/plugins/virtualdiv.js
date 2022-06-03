function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}
module.exports = {
    mainInvalidAttributes: [
        'if',
        'repeat',
        'ios-virtual',
        'android-virtual'
    ],
    virtualTags: {
        div: [
            'class',
            'repeat'
        ],
    },
    do(ctx) {
        if ('main' == ctx.shortName && ctx.node === ctx.template && ctx.attributes) {
            this.mainInvalidAttributes.forEach(k => {
                if (ctx.attributes[k] != null) {
                    console.error("root node attr '%s' is not supported", k)
                }
            })
        } else {
            // const tags = this.virtualTags[ctx.tagName]
            // if (tags) {
            //     if (!ctx.attributes || 0 == ctx.attributes.length) {
            //         ctx.attributes['virtual'] = true
            //     } else if (Object.keys(ctx.attributes).length <= tags.length) {
            //         let virtual = true;
            //         Object.keys(ctx.attributes).forEach(k => {
            //             if (!contains(tags, k)) {
            //                 virtual = false;
            //             }
            //         });

            //         if (virtual == true) {
            //             ctx.attributes['virtual'] = true;
            //         }
            //     }
            // }
        }
    }
}