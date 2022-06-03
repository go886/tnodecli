const parser = require('./parser')
function isString(v) {
    return v && (typeof v === "string");
}
function isObject(o) {
    return o instanceof Object
}
function compare(l, r) {
    return l == r || parseFloat(l) == parseFloat(r);
}

function callOP(l, r, op) {
    if ('==' == op) {
        return compare(l, r)
    } else if ('!=' == op) {
        return !compare(l, r)
    } else if ('+' == op) {
        return l + r;
    }
    l = l == true ? 1 : parseFloat(l) || 0
    r = r == true ? 1 : parseFloat(r) || 0
    switch (op) {
        //  case '+': return l + r
        case '-': return l - r
        case '*': return l * r
        case '/': return l / r
        case '%': return l % r
        case '>': return !!(l > r)
        case '<': return !!(l < r)
        case '>=': return !!(l >= r)
        case '<=': return !!(l <= r)
        case '&&': return !!(l && r)
        case '||': return !!(l || r)
    }
    throw 'op error'
}

function calculate(postfix, scheduler) {
    if (!Array.isArray(postfix)) {
        !isString(postfix) && Object.keys(postfix).forEach(k => {
            if (Array.isArray(postfix[k]) || !isString(postfix[k])) {
                postfix[k] = calculate(postfix[k], scheduler)
            }
        });
        return postfix;
    }


    var item, left, right, result;
    var opStack = []
    for (var i = 0; i < postfix.length; ++i) {
        item = postfix[i]
        if (isString(item)) {
            switch (item) {
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                case '>':
                case '<':
                case '==':
                case '>=':
                case '<=':
                case '!=':
                case '&&':
                case '||': {
                    if (opStack.length >= 2) {
                        right = opStack.pop()
                        left = opStack.pop();
                        result = callOP(left, right, item)
                        opStack.push(result)
                    } else {
                        opStack.push(item);
                    }
                }
                    break;
    
                default: {
                    // filter | mustach | string
                    if (/^\$(\.[a-zA-Z]+){2}/.test(item) == true) {
                        var tokens = item.split(':');
                        var argsCnt = tokens.length >= 2 ? tokens[1] : 0;
                        var args = []
                        while (argsCnt-- > 0 && opStack.length > 0) {
                            args.push(opStack.pop());
                        }
                        item = callFilter(scheduler, tokens[0], args.reverse())
                    } else if (item.length > 2) {
                        left = item[0]
                        right = item[item.length - 1]
                        if (left == right && (left == '"' || left == '\'')) {
                            item = item.substr(1, item.length - 2)
                        } else if (item.length > 4 && '{' == item[0] && '{' == item[1] && '}' == item[item.length - 1] && '}' == item[item.length - 2]) {
                            item = callMustache(item.substr(2, item.length - 4), scheduler)
                        }
                    }
                    opStack.push(item);
                    break;
                }
            }
        } else {
            opStack.push(item);
        }
    }
    return opStack.length > 1 ? opStack.join('') : opStack.pop();
}

function callMustache(k, scheduler) {
    var r = scheduler ? scheduler.getprops(k) : ''
    return r == null ? '' : r;
}

function callFilter(scheduler, filter, args) {
    var r = scheduler ? scheduler.filter(filter, args) : ''
    return r == null ? '' : r;
}
function convert2Postfix(infix) {
    if (isString(infix)) return [infix]; // {{a.b}} 只有一个的情况下
    infix = JSON.parse(JSON.stringify(infix), (k, v)=>{
        return (('left' == k || 'right' == k) && v != null && !(v instanceof Object)) ? {value:v} : v;  //解决js left === right 一样的问题
    })

    return _convert2Postfix(infix);
}

function _convert2Postfix(infix) {
    var postfix = []
    var node = infix;
    var stack = []
    var lastVisit = node;
    while (node != null) {
        while (node.left != null) {
            stack.push(node);
            node = node.left ;
        }
        while (node.right == null || node.right ===lastVisit) {
            const value = node.op ? node.op : (node.value != null ? node.value : node);
            if (Array.isArray(value)) {
                value.forEach(e => {
                    if (e.op)
                        postfix = postfix.concat(_convert2Postfix(e))
                    else
                        postfix.push(e)
                });
            } else {
                postfix.push(value)
            }

            lastVisit = node;
            if (stack.length == 0)
                return postfix;
            node = stack.pop();
        }
        stack.push(node);
        node = node.right;
    }
    return postfix;
}

/**
 * 
 * @param {string|Map} value 
 */
function infixExpression(value) {
    var infix = null;
    try {
        infix = parser.parse(value)
    } catch (err) {
        throw err
    }
    return infix;
}

function postfixExpression(value) {
    var postfix = value;
    if (isString(value)) {
        postfix = convert2Postfix(infixExpression(value))
    } else if (isObject(value) && !Array.isArray(value)) {
        Object.keys(value).forEach(k => {
            value[k] = postfixExpression(value[k])
        });
        return value
    }
    return postfix;
}


module.exports = {
    expression(value, scheduler) {
        var postfix = this.postfix(value);
        try {
            return calculate(postfix, scheduler);
        } catch (error) {
            console.error(error)
        }
        return ''
    },
    postfix(value) {
        if (isString(value)) value = value.trim();
        try {
            value = JSON.parse(value)
        } catch (error) {
        }
        return postfixExpression(value)
    }
}

