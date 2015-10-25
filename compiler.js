var babel = require('babel-core');

var RSVP = require('rsvp-party').RSVP;
var Promise = RSVP.Promise;

var union = require('lodash/array/union');
var remove = require('lodash/array/remove');
var contains = require('lodash/collection/contains');
var without = require('lodash/array/without');
var startsWith = require('lodash/string/startsWith');
var babelConcat = require("babel-concat");
var path = require('path');

var sourceMapsSettings = false;

var objectValues = function (obj) {
    return Object.keys(obj).map(function (key) {
        return obj[key];
    });
};

var transformFile = function (fileName, moduleName, modules) {
    var options = {
        externalHelpers: true,
        modules: modules || 'amdStrict',
        moduleId: moduleName,
        filename: fileName,
        sourceMaps: sourceMapsSettings,
        resolveModuleSource: function(source, fileName) {
            var resolvedModuleSource = source;
            if(startsWith(source, './') || startsWith(source, '../')) {
                resolvedModuleSource = path.join(path.dirname(fileName), source);
            }
            return resolvedModuleSource;
        }
    };

    return new RSVP.Promise(function(resolve,reject) {
        babel.transformFile(fileName, options, function(err, result) {
            if(err) {
                reject(err);
            } else {
                result.moduleName = moduleName;
                result.fileName = fileName;
                resolve(result);
            }
        });
    })
};

module.exports = function compiler(startModuleFileName) {
    var codeResults = Object.create(null);
    // register this property early so it ends up at the top of the file while concatenating
    codeResults.usedHelpers = '';

    var usedHelpers = [];
    var requiredImports = [];

    var parseResult = function(babelResult) {
        var moduleName = babelResult.moduleName;
        codeResults[moduleName] = babelResult;

        // keep track of used helpers
        usedHelpers = union(usedHelpers, babelResult.metadata.usedHelpers);

        // keep track of required modules
        var imports = babelResult.metadata.modules.imports;
        for(var i=0;i<imports.length;i++) {
            var importName = imports[i].source;
            if(!codeResults[importName]) {
                requiredImports.push(importName);
            }
        }
    };


    return transformFile(__dirname + "/node_modules/rsvp/dist/rsvp.js", null, 'ignore').then(function(result) {
        codeResults['rsvp-global'] = result;
    }).then(function() {
        return transformFile(__dirname + "/node_modules/almond/almond.js", null, 'ignore').then(function(result) {
            codeResults['moduleLoader'] = result;
        });
    }).then(function() {
        return transformFile("imports/tomahawk/plugin-manager.js", 'tomahawk/plugin-manager').then(function(result) {
            codeResults['tomahawk/plugin-manager'] = result;
        });
    }).then(function() {
        return transformFile("imports/rsvp.js", 'rsvp').then(function(result) {
            codeResults['rsvp'] = result;
        });
    }).then(function() {
        return transformFile(startModuleFileName, 'main').then(function(startResult) {
            parseResult(startResult);

            return RSVP.promiseWhile(function() {
                return requiredImports.length > 0;
            }, function () {
                var compilePromises = [];
                for(var i=0;i<requiredImports.length;i++) {
                    var importName = requiredImports[i];
                    requiredImports = without(requiredImports, importName);

                    compilePromises.push(transformFile('imports/'+importName+'.js', importName));
                }

                return RSVP.Promise.all(compilePromises).then(function(results) {
                    results.forEach(parseResult);
                });
            });
        }).then(function() {
            return transformFile("tomahawk-env.js", null, 'ignore').then(function(result) {
                codeResults['tomahawkEnv'] = result;
            });
        }).then(function() {
            codeResults.usedHelpers = babel.transform(babel.buildExternalHelpers(usedHelpers), {
                externalHelpers: false,
                sourceMaps: sourceMapsSettings,
                modules: 'ignore'
            });

            return babelConcat.babelConcat(objectValues(codeResults), {
                sourceMaps: true,
                sourceMaps: sourceMapsSettings
            });
        });
    });
}
