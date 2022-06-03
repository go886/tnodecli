var path = require('path')
var fs = require("fs");
var jison = require("jison");

var filename = path.join(__dirname, "grammar.bison")
var bnf = fs.readFileSync(filename, "utf8");
var options = { type: "slr", moduleType: "commonjs", moduleName: "jsoncheck" };
var code = new jison.Generator(bnf, options).generate();
var outfilename = path.join(__dirname, 'parser.js')
fs.writeFileSync(outfilename, code, 'utf8')
