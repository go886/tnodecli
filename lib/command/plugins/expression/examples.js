const expression = require('./index')
function isString(v) {
    return v && (typeof v === "string");
}

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


var examples = [
    "a-b",
    "$.utils.option() > 0",
    "$.utils.option({{feedExtend.favourStatus}}, 'selected', ' ')",
    "8 <= 9 ",
    '$.utils.isNotEmpty({{cardExtend.cornerPicItem}}) && $.utils.isNotEmpty({{cardExtend.festivalOrnament}}) != false',
    '$.util.test({{a.b.c}}3, 4)',
    '1 + $.util.test(1, 2, 3, 4) + 5',
    '{{$(abc)}} == "iOS" && $.weitao.getImageRatio({{.}}) > 3',
    "1 + (( 2 + 3)* 4 ) - {{name}}",
    "(4 - 5) - 5",
    // "{{vers}}ion}}",
    // "$.array.length({{feed.elements}})   >  0  && $.array.length({{feed.elements}}) < 6",
    "$.util.json($.util.test(6.89), 678 / 4)",
    "{{a.b.c}}abc",
    "$.util.test(3, {{a.b.c}})+3",
    "$.util.test(3, {{a.b.c}})3",
    utargs,

]

var r, postfix, exp = expression;
examples.forEach(e => {
    console.log('----------------------------->')
    console.info('ex:%s\t', e)
    postfix = exp.postfix(e)
    console.log('postfix:%s', isString(postfix) ? postfix : JSON.stringify(postfix, null, 2))
    r = exp.expression(e)
    console.log('result:%s\n', isString(r) ? r : JSON.stringify(r, null, 2))
});

console.log('<------end')
