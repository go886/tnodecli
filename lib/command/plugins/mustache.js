function isString(v) {
    return v && (typeof v === "string");
}
function trim(str) {
    return isString(str) && str.replace(/^\s+|\s+$/g, '')
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


module.exports = mustache;