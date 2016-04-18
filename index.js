'use strict';
var Stream = require('stream');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var PATTERN_KEYS = Object.keys(path.parse('')).concat('hash');

function parseFilePattern(options, fileName, hash, cwd) {
    var pattern = options.pattern || '';
    var cwd = options.cwd || './';
    var srcPath = options['src-base'] || './';
    fileName = fileName || '';
    var resolved = path.relative(cwd, path.relative(srcPath, fileName));
    var values = path.parse(resolved);
    values.hash = hash;
    return PATTERN_KEYS.reduce(function(newFilePath, key) {
      return newFilePath.replace('{' + key + '}', values[key]);
    }, pattern);
}

module.exports = function hashmark(contents, options, callback) {
    contents = (contents instanceof Array) ? contents : [contents];
    var mapEvents = new EventEmitter();
    var fileCount = contents.length;
    var map = {};
    if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
    }
    options.digest = options.digest || 'sha256';
    options.length = options.length || 0;
    if (callback) {
        mapEvents.on('error', callback);
        mapEvents.on('end', function (map) {
            callback(null, map);
        });
    }

    contents.forEach(function(contents){
      if (contents instanceof Stream.Readable) {
          contents.fileName = contents.fileName || '<anonymous>';
          fileContents(contents);
      } else {
          fs.stat(contents, function(err, stats){
              if(stats.isFile()){
                var stream = fs.createReadStream(contents);
                stream.fileName = contents;
                fileContents(stream);
              }
          });
      }
    });

    function fileContents(stream) {
        var contents = new Buffer('');
        var hash = crypto.createHash(options.digest);
        hash.on('error', mapEvents.emit.bind(mapEvents, 'error'));
        stream.on('error', mapEvents.emit.bind(mapEvents, 'error'));
        if (options.pattern) {
            var contentStream = new Stream.PassThrough();
            contentStream.on('error', mapEvents.emit.bind(mapEvents, 'error'));
            contentStream.on('data', function (chunk) {
                contents = Buffer.concat([contents, chunk]);
            });
            stream.pipe(contentStream);
        }
        stream.on('end', function () {
            var digest = hash.digest('hex');
            if (options.length) {
                digest = digest.slice(0, options.length);
            }
            if (options.pattern) {
                var fileName = parseFilePattern(options, stream.fileName, digest);
                var distName = path.parse(fileName).dir;
                mkdirp(distName, function(){
                  if (options.rename === true ) {
                      fs.rename(stream.fileName, fileName, function (err) {
                          if (err) {
                              return mapEvents.emit('error', err);
                          }
                          mapEvents.emit('file', stream.fileName, fileName);
                      });
                  } else {
                      fs.writeFile(fileName, contents, function (err) {
                          if (err) {
                              return mapEvents.emit('error', err);
                          }
                          mapEvents.emit('file', stream.fileName, fileName);
                      });
                  }
                })
            } else {
                mapEvents.emit('file', stream.fileName, digest);
            }
        });
        stream.pipe(hash, { end: false });
    }

    return mapEvents.on('file', function (fileName, newFileName) {
        map[path.relative(options.cwd, fileName)] = path.relative(options.cwd, newFileName);
        fileCount--;
        if (fileCount === 0) {
            mapEvents.emit('end', map);
        }
    });
};
