/*
Copyright (c) 2013 Sam Decrock <sam.decrock@gmail.com>

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var sax = require("sax");


function setNodeAttr(node, key, value) {
	if (key && node) {
		var attrs = node.attrs
		if (!attrs) {
			attrs = {}
			node.attrs = attrs;
		}
		attrs[key] = value;
	}
}

function setNodeAttrs(node, attributes) {
	Object.keys(attributes).forEach(function (k, i) {
		setNodeAttr(node, k, attributes[k]);
	});
}


exports.read = function (xmlstring, callback) {
	var strict = true;
	var saxparser = sax.parser(strict/*, {
		xmlns: true,
		strictEntities: true,
		trim: true,
		lowercase: false,
		position: true
	}*/);
	var rootNodeInfo;
	var nodesStack = [];
	var uid = 0;

	function getCurrentNodeInfo() {
		return nodesStack.length ? nodesStack[nodesStack.length - 1] : null;
	}
	saxparser.onerror = function (err) {
		// var n = getCurrentNodeInfo();
		// an error happened.
		const tag = xmlstring.substring(this.startTagPosition, this.position)
		const message = `tag: ${tag}\nattribName: ${this.attribName}\nerror: ${err.message}`
		return callback({ message });
	};
	saxparser.onend = function () {
		return callback(null, rootNodeInfo);
	};
	saxparser.oncdata = function (cdata) {
		getCurrentNodeInfo().text = cdata;
	};

	saxparser.ontext = function (text) {
		text = text.trim()
		if (text.length) {
			var curNode = getCurrentNodeInfo();
			var key = 'text'
			if (curNode.type === 'image' || curNode.type === 'template') {
				key = 'src'
			}
			setNodeAttr(curNode, key, text);
		}
	};

	saxparser.onclosetag = function (node) {
		// set the object back to its parent:
		nodesStack.pop();
	}
	saxparser.onopentag = function (node) {
		// opened a tag.  node has "name" and "attributes"
		var nodeInfo = {
			type: node.name,
			uid: uid++,
		};
		setNodeAttrs(nodeInfo, node.attributes)

		var curNodeInfo = getCurrentNodeInfo();
		if (curNodeInfo) {
			if (!curNodeInfo.children) curNodeInfo.children = []
			curNodeInfo.children.push(nodeInfo);
		} else {
			rootNodeInfo = nodeInfo;
		}
		nodesStack.push(nodeInfo);
	};

	// pass the xml string to the awesome sax parser:
	saxparser.write(xmlstring.trim()).close();
}