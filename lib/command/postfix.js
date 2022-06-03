const expression = require('./plugins/expression')


module.exports = (name) => {
    let result = JSON.stringify(expression.postfix(name))
    console.info(`${name} => ${result}`)
};