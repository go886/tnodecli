
function parserTag(tag, uid) {
    const reg = /([:\w-]+)|['"]{1}([^'"]*)['"]{1}/g;
    let items;
    let result = {
        tag,
        uid,
        type: null,
    }
    let i = 0;
    let key;
    while (items = reg.exec(tag)) {
        const match = items[1]
        if (0 == i) {
            result.type = match;
        } else {
            if (!result.attrs) result.attrs = {}
            if (i % 2)
                key = match;
            else {
                result.attrs[key] = items[2];
            }
        }
        ++i;
    }

    return result;
}

function parser(html) {
    // const reg = /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g
    const reg =  /<(?:"[^"]*"|'[^']*'|[^'">])*>/g
    let uid = 0;
    let level = 0;
    let arr = [];
    let current;
    let index = 0;
    let items;
    while (items = reg.exec(html)) {
        if (items.index != index) {
            const text = html.substring(index, items.index).trim()
            if (text.length > 0) {
                current = arr[level -1]
                if (!current.attrs) current.attrs = {}

                let key = 'text'
                if (current.type === 'image' || current.type === 'template') {
                    key = 'src'
                }
                current.attrs[key] = text;
            }
        }
        const tag = items[0];
        index = items.index + tag.length;
        const isOpen = tag.charAt(1) !== '/';
        if (isOpen) {
            current = parserTag(tag, uid++);
            arr[level++] = current;
        }

        if (!isOpen || tag.charAt(tag.length - 2) == '/') {
            let closeTag = parserTag(tag, 0);
            let currentTag = arr[--level];
            if (currentTag.type !== closeTag.type) {
                const message = `tag:${currentTag.type} closetag:${closeTag.type} tag not match`;
                console.error(message);
                return null;
            }
            if (level > 0) {
                let parent = arr[level - 1]
                if (!parent.children) parent.children = []
                parent.children.push(arr[level]);
            } else {
                arr.pop();
            }
        }
    }

    return arr[0]
}

module.exports = {
    parser,
}