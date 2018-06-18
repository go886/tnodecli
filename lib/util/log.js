const colors = require('colors')
require('string.format')

module.exports = {
    log(fmt, options) {
        // return console.log.apply( console, fmt.blue, options);
        return console.log((options ? fmt.format(options) : fmt).blue);
    },
    error(fmt, options){
        return console.error((options ? fmt.format(options) : fmt).red);
    }
}



