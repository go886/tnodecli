const mustache = require('./mustache')
/*
{ type: "punc", value: "(" }           // 标点符号: 括号，逗号，分号等
{ type: "num", value: 5 }              // 数字
{ type: "str", value: "Hello World!" } // 字符串 //
{ type: "kw", value: "lambda" }        // 关键字
{ type: "var", value: "a" }            // 标识符
{ type: "op", value: "!=" }            // 操作符
{ type: "nor", value: "abc"}
*/

const ExpType = {
    str: 'str',
    op: 'op',
    filter: 'filter',
    mustache: 'mustache',
    number: 'number',
    punc: 'punc',
    keyword: 'keyword',
    var: 'var',
}

function InputStream(input) {
    this.input = input || '';
    this.pos = 0;
    this.line = 1;
    this.col = 0;
    return this;
}
InputStream.prototype.peek = function () {
    return this.input.charAt(this.pos);
}
InputStream.prototype.next = function () {
    let ch = this.input.charAt(this.pos++);
    if (ch == '\n') {
        this.line++;
        this.col = 0;
    } else {
        this.col++;
    }
    return ch;
}
InputStream.prototype.setPos = function (pos) {
    return this.pos = pos
}
InputStream.prototype.test = function (reg) {
    let s = this.input.substring(this.pos)
    return reg.test(s);
}
InputStream.prototype.isbeing = function () {
    return this.pos == 0
}
InputStream.prototype.isend = function () {
    return this.pos == this.input.length - 1
}

InputStream.prototype.eof = function () {
    return this.peek() == '';
}
InputStream.prototype.croak = function (msg) {
    throw new Error(msg + ' (' + this.line + ':' + this.col + ')');
}



function makeOP(type, value) {
    return { type, value };
}
function isObject(o) {
    return o instanceof Object
}
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
function TokenStream(input) {
    this.input = new InputStream(trim(input));
    this.current = null;
    return this;
}
TokenStream.prototype = {
    constructor: TokenStream,
    keywords: ' if then else lambda λ true false ',
    is_keyword: function (x) {
        return this.keywords.indexOf(' ' + x + ' ') > -1;
    },
    is_digit: function (ch) {
        return /[0-9]/i.test(ch);
    },
    is_id_start: function (ch) {
        return /[a-zλ_]/i.test(ch);
    },
    is_id: function (ch) {
        return this.is_id_start(ch) || '?!-<>=0123456789'.indexOf(ch) > -1;
    },
    is_op_char: function (ch) {
        if (this.input.isbeing() || this.input.isend())
            return false;

        const regs = [
            /^\s+[\+\-\*\/\%\<\>]\s+/,
            /^\s+(==|>=|<=|\|\||&&|!=)\s+/,
        ]
        for (var i = 0; i < regs.length; ++i) {
            const r = regs[i]
            if (this.input.test(r)) return true;
        }
        const errRegs = [
            /^[\+\-\*\/\%\<\>][^\s+]/,
            /^[^\s+][\+\-\*\/\%\<\>]/,
            /^(==|>=|<=|\|\||&&|!=)[^\s]/,
            /^[^\s](==|>=|<=|\|\||&&|!=)/,
        ]

        for (var i = 0; i < errRegs.length; ++i) {
            const r = errRegs[i]
            if (this.input.test(r)) {
                console.warn('warning invalid expression: %s \r\nex: a + b ', this.input.input)
            }
        }
        return false;
        // return this.input.test(/^\s*[\+\-\*\/\%\=\&\|\<\>\!]\s*/)
        // return '+-*/%=&|<>!'.indexOf(ch) > -1;
    },
    is_punc: function (ch) {
        return ',()'.indexOf(ch) > -1;
    },
    is_whitespace: function (ch) {
        return ' \t\n'.indexOf(ch) > -1;
    },
    is_filter: function (ch) {
        if (ch == '$') {
            if (this.input.test(/\$(\.[a-zA-Z]+){2}\(.*?\)/))
                return true;
            if (this.input.test(/\$(\.[a-zA-Z]+)\(/)) {
                console.warn('filter invalid:%s', this.input.input)
            }
        }
        return false;
    },
    has_mustache: function (str) {
        return /\{\{.*?\}\}/.test(str)
    },
    is_mustache: function (ch) {
        return '{' == ch && this.input.test(/\{\{.*?\}\}/)
    },
    read_while: function (predicate) {
        let str = '';
        while (!this.input.eof() && predicate.call(this, (this.input.peek()))) {
            str += this.input.next();
        }
        return str;
    },
    read_until: function (preadicate) {
        return this.read_while((ch) => {
            return !preadicate(ch)
        });
    },
    read_number: function () {
        let has_dot = false;
        let number = this.read_while(ch => {
            if (ch == ".") {
                if (has_dot) return false;
                has_dot = true;
                return true;
            }
            return this.is_digit(ch);
        });
        return makeOP(ExpType.number, parseFloat(number));
    },
    read_ident: function () {
        let id = this.read_while(this.is_id);
        var type = this.is_keyword(id) ? ExpType.keyword : ExpType.var;
        return makeOP(type, id)
    },
    read_escaped: function (end) {
        let escaped = false, str = '';
        this.input.next();
        while (!this.input.eof()) {
            var ch = this.input.next();
            if (escaped) {
                str += ch;
                escaped = false;
            } else if (ch == '\\') {
                escaped = true;
            } else if (ch == end) {
                break;
            } else {
                str += ch;
            }
        }
        return str;
    },
    read_string: function (end = '"') {
        return makeOP(ExpType.str, this.read_escaped(end))
    },
    skip_comment: function () {
        this.read_while(ch => ch != "\n");
        this.input.next();
    },
    read_filter: function () {
        var value = this.read_until(ch => {
            return ch == '(';
        });

        var op1 = makeOP(ExpType.filter, '$')
        var op2 = makeOP(ExpType.str, value)
        return [op1, op2];
    },
    read_mustache: function () {
        var value =
            this.read_until(ch => {
                return ch == '}'
            });
        this.input.next()
        this.input.next()
        return makeOP(ExpType.mustache, value.substr(2));
    },
    read_op: function () {
        var stop = false;
        var value = this.read_until(ch => {
            if (stop && ch != ' ') return true;
            stop = '+-*/%'.indexOf(ch) != -1
            return ' +-*/%=&|<>!'.indexOf(ch) == -1;
        });
        return makeOP(ExpType.op, trim(value))
    },
    read_punc: function () {
        var value = this.input.next();
        return makeOP(ExpType.punc, (value));
    },
    read_next_: function (ch) {
        // if (ch == '"') return this.read_string();
        if (ch == '\'' && this.input.test(/\'.*?\'/)) return this.read_string('\'')
        if (this.is_filter(ch)) return this.read_filter();
        // if (this.is_mustache(ch)) return this.read_mustache();
        if (this.is_punc(ch)) return this.read_punc();
        if (this.is_op_char(ch)) return this.read_op();

        return null;
    },
    read_next: function () {
        // let whitespace = this.read_while(this.is_whitespace);
        // if (whitespace && whitespace.length > 0) return makeOP('str', whitespace)

        if (this.input.eof()) return null;
        let ch = this.input.peek();
        let token = this.read_next_(ch);
        if (token) return token;

        var value = ch;
        while (!this.input.eof()) {
            this.input.next();
            ch = this.input.peek()
            const pos = this.input.pos
            var t = this.read_next_(ch)
            if (t) {
                this.input.setPos(pos)
                // value = trim(value)
                break;
            }
            else {
                value += ch;
            }
        }

        if (this.has_mustache(value)) {
            return makeOP(ExpType.mustache, mustache(value))
        } else {
            return makeOP(ExpType.str, value);
        }
    },
    peek: function () {
        return this.current || (this.current = this.read_next());
    },
    next: function () {
        let tok = this.current;
        this.current = null;
        return tok || this.read_next();
    },
    eof: function () {
        return this.peek() == null;
    },
    parse() {
        var stack = [];
        var r = null;
        while (r = this.next()) {
            if (Array.isArray(r)) {
                stack = stack.concat(r)
            } else {
                stack.push(r)
            }
        }

        for (var i = stack.length - 1; i >= 0; --i) { //string merge
            var cur = stack[i];
            var pre = i - 1 >= 0 ? stack[i - 1] : null;
            if (pre && pre.type == cur.type && cur.type == ExpType.str) {
                pre.value += cur.value;
                stack.splice(i, 1)
            }
        }

        for (var i = stack.length - 1; i >= 0; --i) {
            var cur = stack[i];
            var pre = i - 1 >= 0 ? stack[i - 1] : null;
            if (pre && pre.type == ExpType.str && cur.type == ExpType.punc) {
                pre.value = trim(pre.value)
            }
        }

        // console.log(JSON.stringify(stack, null, 2))
        return stack;
    }
}


function getPrecedence(op) {
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

function infixExpression(value) {
    return (new TokenStream(value)).parse()
}
function convert2Postfix(infix) {
    var postfix = []
    var opStack = []
    var item, op;

    for (var i = 0; i < infix.length; ++i) {
        item = infix[i]
        if (item.type == ExpType.op) {
            //+-*/%=&|<>!
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
                // case '$':
                // case '(': {
                //     opStack.push(item);
                // }
                //     break;
                // case ')': {
                //     op = opStack.pop()
                //     while (op && op.value != '(') {
                //         postfix.push(op)
                //         op = opStack.pop()
                //     }

                //     if (op.value == '(' && opStack.length > 0 && opStack[opStack.length - 1].value == '$') {
                //         postfix.push(opStack.pop())
                //     }
                // }
                //     break;
                default: {
                    console.error('error op:%s value:%s', item.type, item.value)
                    throw "error op"
                    break;
                }
            }
        } else {
            if (item.type == ExpType.filter) {
                opStack.push(item);
                continue;
            } else if (item.type == ExpType.punc) {
                if (item.value == '(') {
                    opStack.push(item)
                    continue;
                } else if (item.value == ',') {
                    continue;
                } else if (item.value == ')') {
                    op = opStack.pop()
                    while (op && !(op.type == ExpType.punc && op.value == '(')) {
                        postfix.push(op)
                        op = opStack.pop()
                    }

                    if (op && op.type == ExpType.punc && op.value == '(' && opStack.length > 0 && opStack[opStack.length - 1].value == '$') {
                        postfix.push(opStack.pop())
                    }
                    continue;
                }
            }

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
    if (!Array.isArray(postfix)) {
        Object.keys(postfix).forEach(k => {
            if (Array.isArray(postfix[k]) || !isString(postfix[k])) {
                postfix[k] = calculate(postfix[k], scheduler)
            }
        });
        return postfix;
    }
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

__cache = {}
module.exports = {
    type: ExpType,
    expression(value, scheduler) {
        var postfix = this.postfix(value);
        try {
            return calculate(postfix, scheduler);
        } catch (error) {
            console.error(error)
        }
        return ''
    },
    infix(value) {
        return infixExpression(value)
    },
    // ['a', [], 'b']
    postfix(value) {
        var postfix = value;
        if (isString(value)) {
            postfix = __cache[value]
            if (!postfix) {
                postfix = convert2Postfix(this.infix(value))
                __cache[value] = postfix
            }
        } else if (isObject(value) && !Array.isArray(value)) {
            Object.keys(value).forEach(k => {
                value[k] = this.postfix(value[k])
            });
            return value
        }
        return postfix;
    }
}

function test(oldexpression) {
    var scheduler = {
        filter(name, args) {
            if ('$.utils.option' == name) {
                return args[1]
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



    var json = {
        "page": "{{config.pageName}}",
        "exposure": {
            "name": "Show_WeiTaoFeed",
            "args": {
                "id": "{{id}}",
                "feed_id": "{{referId}}",
                "seq_type": "{{refType}}",
                "media_type": "pic",
                "spm-cnt": "{{config.spm}}.{{config.tabName}}.{{$.index}}",
                "OwnerTopicID": "{{nodeId}}",
                "cdm": "{{cdms}}",
                "pvid": "{{pvid}}",
                "scm": "{{scm}}",
                "CardType": "content"
            }
        },
        "click": {
            "name": "WeiTaoFeedContent",
            "args": {
                "id": "{{id}}",
                "spm-cnt": "ss",
                "feed_id": "{{referId}}",
                "pvid": "{{pvid}}",
                "OwnerTopicID": "{{nodeId}}",
                "seq_type": "{{refType}}",
                "scm": "{{scm}}",
                "media_type": "pic",
                "cdm": "{{cdms}}",
                "CardType": "content"
            }
        }
    }

    json = JSON.stringify(json).replace(/,\"/mg, '\',\'"')

    var utargs = {
        "page": "{{$.vm.pageName}}",
        "click": {
            "name": "WeiTaoFeedContent",
            "args": "$.utils.toJSONString({{ utParams }})",
            "argsEx": {
                "feed_Num": "{{$.index}} + 1",
                "page": "{{$.vm.pageName}}",
                "spm-cnt": "{{$.vm.spm}}",
            }
        },
        "exposure": {
            "name": "Show_WeiTaoFeed",
            "maxNum": "1",
            "args": "$.utils.toJSONString({{ utParams }})",
            "argsEx": {
                "feed_Num": "{{$.index}} - 1",
                "page": "{{$.vm.pageName}}",
                "spm-cnt": "{{$.vm.spm}}",
            }
        }
    }
    var listexp = [
        '{{$.index}} + 1',
        'abc'
    ]
    // utargs = JSON.stringify(json).replace(/,\"/mg, '\',\'"')
    // utargs = utargs.replace(/\-/mg, '\'\-\'')
    var examples = [
        listexp,
        utargs,
        "'<span>'$.string({{account.certDesc}}'</span>'",
        "'<span>'$.string.escapeXMLCharactor({{account.certTitle}})'</span>'",
        "$://openURL",
        "((4 - 3) / 2)",
        '{"page":"{{$.vm.pageName}}","click":{"name":"WeiTaoFeedComment","argsEx":' + utargs + '}}',
        "r >= b ",
        json,
        "\"a'bc\"",
        "$.array.length({{feed.elements}})   >  0  && $.array.length({{feed.elements}}) < 6",
        "{{334}}'<span class=\\'test\\'>'567'{'{ac}}fea $.date.count( {{ name }}  , 1) 'abc</span>'",
        '$://interact.redirectUrl?{"data":{{feed.interactbar.data|toJSONString}},"defaultUrl":"{{feed.interactbar.targetUrl}}", "bizType":"weitao"}',
        "$.array.length({{feed.elements}}) > 0 && $.array.length({{feed.elements}}) < 6",
        "{{name}}==700",
        "!$.utils.option({{name}}, 'selected', '')",
        "+({{name}} - 4)",
        "{{name}}-",
        "!$.utils.option({{feedExtend.favourStatus}}, 'selected', '')",
        "$.utils.option({{config.isWT}},weitao,root)",
        "{{name}} + 3 || 8 > 3",
        "{{name}} + 3 && 8 > 3",
        "{{name}}&123",
        "{{title}} version: {{version}}",
        "{{334}}'<span class=\\'test\\'>'567'{'{ac}}fea $.date.count({{name}}, 1) 'abc</span>'",
        '$.util.test(4, 1)',
        ' 6 - 4 > 1',
        '{{module}}abc-3',
        "{{name}} - 3 > 3",
        "{{name}} - 3 < 3",
        "{{name}} - 3",
        "{{name}} - 3 > 16",
        "{{name}} - 3 >= 16",
        "{{name}} - 3 < 16",
        "{{name}} - 3 <= 16",
        "{{name}} - 3 == 16",
        "{{name}} - 3 != 16"
    ]



    examples.forEach(item => {
        console.log('ex:\t' + item)
        var r = module.exports.expression(item, scheduler)
        // var k = JSON.parse(r);
        //  var r2 = oldexpression.expression(item, scheduler)
        console.log('r:\t' + r + '\n')
        // console.log('o:\t' + r2 + '\n')
    });
}

// test(require('./expression'));



/**
 * ,
 * /'
 * ${}
 */