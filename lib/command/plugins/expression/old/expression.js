
const __cache = {}

function isString(v) {
    return v && (typeof v === "string");
}
function trim(str) {
    return isString(str) && str.replace(/^\s+|\s+$/g, '')
}

function isletter(str) {
    return /^[a-zA-Z]+$/.test(str);
}

function isfilter(str) {
    if (str && isString(str)) {
        var tokens = str.split('.');
        if (tokens.length > 1 && tokens[0] == '$') {
            for (var i = 1; i < tokens.length; ++i) {
                if (!isletter(tokens[i])) return false;
            }
            return true;
        }
    }
    return false;
}

function mustache(value) {
    var que = [];
    var ch;
    var item = ''
    var flag = 0

    for (var i = 0; i < value.length; ++i) {
        ch = value[i];
        if (flag > 0) {
            if (ch == '\'') {
                flag = 0;
                if (item && item.length > 0) {
                    que.push(item)
                    item = ''
                }
            } else if (ch == '\\') { //skip
                item += value[++i]
            } else {
                item += ch;
            }
        } else {
            switch (ch) {
                case '\'': {
                    flag++;
                    if (item && item.length > 0) {
                        que = que.concat(mustacheimp(item))
                        item = ''
                    }
                }
                    break;
                default: {
                    item += ch;
                }
                    break;
            }
        }
    }

    if (item && item.length > 0) {
        que = que.concat(mustacheimp(item));
    }
    if (que.length == 1)  //优化减少dsl 输出大小
        return que[0];
    return que.length == 0 ? '' : que;
}

function mustacheimp(value) {
    var i = 0;
    var b = -1;
    var k = 0;
    var que = []
    var item
    for (i = 0; i < value.length;) {
        if (value[i] == '{' && i + 4 < value.length && value[i + 1] == '{') {
            i += 2;
            b = i;
        } else if (b != -1 && value[i] == '}' && i + 1 < value.length && value[1 + i] == '}') {
            if (k < b - 2) {
                item = value.substring(k, b - 2)
                que.push(item)
            }

            item = trim(value.substring(b, i))
            que.push([item]);
            i += 2;
            k = i;
            b = -1;
        } else {
            ++i;
        }
    }

    if (k < value.length) {
        item = value.substr(k)
        que.push(item)
    }
    return que;
}




function getPrecedence(op) {
    // const ops = {
    //     '(': 1,
    //     ')': 1,
    //     '!': 2,
    //     '*': 3,
    //     '/': 3,
    //     '+': 4,
    //     '-': 4,
    //     '>': 6,
    //     '>=': 6,
    //     '<': 6,
    //     '<=': 6,
    //     '==': 7,
    //     '!=': 7,
    //     '&&': 11,
    //     '||': 12,
    // }

    // return ops[op]||-1


    switch (op) {
        case '(': case ')': return 0;//实际只有 + - * / 才需要调用该函数比较优先级
        case '&&': case '||': return 1;
        case '>': case '<': case '>=': case '<=': case '==': case '!=': return 2
        case '+': case '-': return 3;// + - 优先级为1
        case '*': case '/': case '%': return 4;// * / 优先级为2
    }
    return -1;


}
function compare(l, r) {
    return l == r || parseFloat(l) == parseFloat(r) || trim(l) == trim(r);

}

function callOP(l, r, op) {
    if ('==' == op) {
        return compare(l, r)
    } else if ('!=' == op) {
        return !compare(l, r)
    }
    l = l == true ? 1 : parseFloat(l) || 0
    r = r == true ? 1 : parseFloat(r) || 0
    switch (op) {
        case '+': return l + r
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



function makeExpItem(value, exp = false) {
    return { value, exp };
}

/**
 * {{name}} + 32
 * const Exp = {
    exp: true,
    value: '+'
}
 * @param {*} value 
 */
function infixExpression(value) {
    var ch;
    var item = ''
    var stack = []
    var flag = 0
    var mustacheflag = 0

    function addItem(ch) {
        if (item && item.length > 0) {
            item = trim(item);
            if (item && item.length > 0) {
                var hasfilter = false;
                if ('(' == ch) {
                    var filterindex = item.lastIndexOf('$')
                    if (filterindex !== -1) {
                        var tmp = item.substr(filterindex)
                        hasfilter = isfilter(tmp)
                        if (hasfilter) {
                            if (filterindex > 0) {
                                stack.push(makeExpItem(mustache(item.substr(0, filterindex))))
                            }
                            stack.push(makeExpItem('$', true))
                            stack.push(makeExpItem(tmp))
                        }
                    }
                }

                if (hasfilter == false) {
                    stack.push(makeExpItem(mustache(item)))
                }
            }
        }
        item = ch;
        if (item !== ',') {
            stack.push(makeExpItem(item, true))
        }
        item = ""
    }

    for (var i = 0; i < value.length; ++i) {
        ch = value[i];
        if (mustacheflag > 0) {
            item += ch;
            if (ch == '}' && i < value.length - 1 && '}' == value[i + 1]) {
                mustacheflag = 0;
                i++;
                item += '}';
            } else if (ch == '\\') {
                item += value[++i];
            }
        } else if (flag > 0) {
            item += ch;
            if (ch == '\'') {
                flag = 0;
            } else if (ch == '\\') { //skip
                item += value[++i]
            }
        } else {
            switch (ch) {
                case '\'': {
                    item += ch;
                    flag++
                }
                    break;
                case '{': { //{{}}
                    if (i < value.length - 4 && '{' == value[i + 1]) {
                        mustacheflag++;
                    }
                    item += ch;
                }
                    break;
                case '>':
                case '<':
                case '=':
                case '!': {
                    if (i < value.length - 1) {
                        if (value[i + 1] == '=') {
                            ch += '='
                            i++
                        } 
                    } 
                }
                case '&': {
                    if (i < value.length - 1) {
                        if (value[i + 1] == '&') {
                            ch += '&'
                            i++
                        } 
                    } 
                }
                case '|': {
                    if (i < value.length - 1) {
                        if (value[i + 1] == '|') {
                            ch += '|'
                            i++
                        }
                    }
                }
                    break;
                case '+':
                case '-':
                case '*':
                case '/':
                case '%':
                case ',':
                case '(':
                case ')': {
                    if ('+' == ch ||
                        '-' == ch ||
                        '*' == ch ||
                        '/' == ch ||
                        '%' == ch) { //暂时解决 ‘abc-cpm’ 中符号问题
                        if (i < value.length - 1) {
                            if (isletter(value[i + 1])) {
                                item += ch;
                                break;
                            }
                        }

                        if (i == 0 || i == value.length - 1) {
                            item += ch;
                            break;
                        }
                    }

                    if (',' == ch && item && item.length) { //暂时解决 逗号问题
                        var hasbracket = false;
                        for (var k = stack.length - 1; k >= 0; --k) {
                            if (stack[k].value == '(') {
                                hasbracket = true;
                                break;
                            }
                        }

                        if (!hasbracket) {
                            item += ch;
                            break;
                        }
                    }

                    if (ch == '=' ||
                        ch == '!' ||
                        ch == '&' ||
                        ch == '|') {
                            item += ch;
                            break;
                        }

                    addItem(ch);
                }
                    break;
                default: {
                    item += ch;
                    break;
                };
            }
        }
    }

    if (item && item.length > 0) {
        stack.push(makeExpItem(mustache(item)))
    }

    return stack;
}
function convert2Postfix(infix) {
    var postfix = []
    var opStack = []
    var item, op;

    for (var i = 0; i < infix.length; ++i) {
        item = infix[i]
        if (item.exp == true) {
            switch (item.value) {
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
                    while (opStack.length > 0) {
                        op = opStack[opStack.length - 1];
                        if (getPrecedence(item.value) <= getPrecedence(op.value)) {
                            postfix.push(op)
                            opStack.pop()
                        } else {
                            break;
                        }
                    }
                    opStack.push(item)
                }
                    break;
                case '$':
                case '(': {
                    opStack.push(item);
                }
                    break;
                case ')': {
                    op = opStack.pop()
                    while (op && op.value != '(') {
                        postfix.push(op)
                        op = opStack.pop()
                    }

                    if (op.value == '(' && opStack.length > 0 && opStack[opStack.length - 1].value == '$') {
                        postfix.push(opStack.pop())
                    }
                }
                    break;
                default: {
                    postfix.push(item);
                    break;
                }
            }
        } else {
            postfix.push(item);
        }
    }

    while (opStack.length > 0) {
        op = opStack.pop();
        postfix.push(op)
    }


    postfix = postfix.map((exp, index) => {
        return exp.value;
    });
    if (1 == postfix.length)//优化减少dsl 输出大小
        return postfix[0]
    return postfix
}



function callMustache(items, scheduler) {
    if (1 == items.length && !Array.isArray(items[0])) {// dsl 优化的情况
        var r = scheduler.getprops(items[0]);
        return r ? r : '';
    }
    var result = []
    items.forEach((e) => {
        if (Array.isArray(e)) {
            e.forEach(k => {
                var r = scheduler.getprops(k);
                result.push(r ? r : '');
            });
        } else {
            result.push(e);
        }
    });

    return result.length > 1 ? result.join('') : result[0];
}


function calculate(postfix, scheduler) {
    if (postfix.length == 1) { // dsl 优化的情况
        return callMustache(postfix, scheduler);
    }

    var item, left, right, result;
    var opStack = []
    var k, r;
    for (var i = 0; i < postfix.length; ++i) {
        item = postfix[i]
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
                    opStack.push(Array.isArray(item) ? callMustache(item, scheduler) : item);
                }
            }
                break;
            case '$': {
                var args = []
                k = opStack.length;
                while (k-- > 0) {
                    var op = opStack[k]
                    if (!isfilter(op)) {
                        opStack.pop()
                        args.push(op)
                    } else {
                        break;
                    }
                }

                r = scheduler ? scheduler.filter(opStack.pop(), args.reverse()) : ''
                opStack.push(r ? r : '')
            }
                break;
            default: {
                opStack.push(Array.isArray(item) ? callMustache(item, scheduler) : item);
                break;
            }
        }
    }
    return opStack.length > 1 ? opStack.join('') : opStack.pop();
}



module.exports = {
    expression(value, scheduler) {
        var postfix = value;
        if (!Array.isArray(value)) {
            postfix = __cache[value]
            if (!postfix) {
                postfix = convert2Postfix(infixExpression(value))
                __cache[value] = postfix
            }
        }
        try {
            return calculate(postfix, scheduler);
        } catch (error) {
        }
        return ''
    },
    postfix(value) {
        var postfix = value;
        if (!Array.isArray(value)) {
            postfix = __cache[value]
            if (!postfix) {
                postfix = convert2Postfix(infixExpression(value))
                __cache[value] = postfix
            }
        }
        return postfix;
    }
}




function test() {
    var scheduler = {
        filter(name, args) {
            if ('$.utils.option' == name) {
                return args[2]
            }
            else if (name == '$.util.test') {
                var result = null;
                args.forEach((param) => {
                    if (result == null)
                        result = parseInt(param)
                    else
                        result -= parseInt(param)
                });
                return result;
            } else if (name == '$.date.count') {
                return parseFloat(args[0]) + parseFloat(args[1]);
            }
        },
        getprops(key) {
            var vm = {
                name: 19,
                '*': ' why '
            }

            return vm[key]
        }
    }




    var examples = [
        "{{334}}'<span class=\\'test\\'>'567'{'{ac}}fea $.date.count({{name}}, 1) 'abc</span>'",
        // "$.array.length({{feed.elements}}) > 0 && $.array.length({{feed.elements}}) < 6",
        // "{{name}}==700",
        // "!$.utils.option({{name}}, 'selected', '')",
        // "+({{name}}-4)",
        // "{{name}}-",
        // "!$.utils.option({{feedExtend.favourStatus}}, 'selected', '')",
        // "$.utils.option({{config.isWT}},weitao,root)",
        // '{"page":"{{config.pageName}}","exposure":{"name":"Show_WeiTaoFeed","args":{"id":"{{id}}","feed_id":"{{referId}}","seq_type":"{{refType}}","media_type":"pic","spm-cnt":"{{config.spm}}.{{config.tabName}}.{{$.index}}","OwnerTopicID":"{{nodeId}}","cdm":"{{cdms}}", "pvid":"{{pvid}}","scm":"{{scm}}","CardType":"content"}},"click":{"name":"WeiTaoFeedContent","args":{"id":"{{id}}","spm-cnt":"{{config.spm}}.{{config.tabName}}.{{$.index}}","feed_id":"{{referId}}","pvid":"{{pvid}}","OwnerTopicID":"{{nodeId}}","seq_type":"{{refType}}","scm":"{{scm}}","media_type":"pic","cdm":"{{cdms}}","CardType": "content"}}}',
        // // "{{name}} +3 || 8>3",
        // "{{name}} + 3 && 8>3",
        // "{{name}}&123",
        // "{{title}} version: {{version}}",
        // "{{334}}'<span class=\\'test\\'>'567'{'{ac}}fea $.date.count({{name}}, 1) 'abc</span>'",
        // '$.util.test(4, 1)',
        // ' 6 - 4 > 1',
        // '{{module}} - 3',
        // "{{name}} - 3 > 3",
        // "{{name}} - 3 < 3",
        // "{{name}} - 3",
        // "{{name}} - 3 > 16",
        // "{{name}} - 3 >= 16",
        // "{{name}} - 3 < 16",
        // "{{name}} - 3 <= 16",
        // "{{name}} - 3 == 16",
        // "{{name}} - 3 != 16"
    ]


    examples.forEach(item => {
        console.log('ex:\t' + item)
        var r = module.exports.expression(item, scheduler)
        console.log('r:\t' + r + '\n')
    });
}

// test();

