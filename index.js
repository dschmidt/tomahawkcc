#! /usr/bin/env node

var fs = require('fs-promise');
var compiler = require('./compiler');

fs.lstat('tomahawk/resolver.js').then(function(stats) {
    if(!stats.isFile()) {
        throw new Error();
    }
}, function () {
    throw new Error('tomahawk/resolver.js not a file, probably not in tomahawk-resolvers main dir');
}).then(function() {
    var args = process.argv;
     return compiler(args[args.length-1]);
}).then(function(output) {
    console.log(output.code);
}, function(err) {
    console.error(err);
});
