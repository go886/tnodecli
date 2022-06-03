const colors = require('colors')
const sprintf = require('sprintf-js').sprintf
const util = require('./util')


function hook(orig, color) {
    return function () {
        try {
            if (arguments.length > 0) {
                var arg = arguments[0]
                if (util.isString(arg) && arguments.length > 1) {
                    arg = sprintf.apply(sprintf, arguments)
                } else if (arguments.length > 1) {
                    var items = []
                    Array.prototype.slice.call(arguments, 0).forEach((arg) => {
                        items.push(util.stringify(arg));
                    });
                    arg = items.join(' ');
                }
                orig.call(console, color(arg))
            }
        } catch (error) {
            orig.call(console, error)
        }
    };
}

console.info = hook(console.info, colors.blue)
console.warn = hook(console.warn, colors.yellow)
console.error = hook(console.error, colors.red)
module.exports = console;