'use strict';
var Stream = require('stream');
var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');

function parseFilePattern(pattern, fileName, hash) {
    pattern = pattern || '';
    fileName = fileName || '';
    var ext = path.extname(fileName);
    return pattern
        .replace('{dir}', path.dirname(fileName))
        .replace('{hash}', hash)
        .replace('{name}', path.basename(fileName, ext))
        .replace('{ext}', ext);
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
    contents.map(function (contents) {
        if (contents instanceof Stream.Readable) {
            contents.fileName = contents.fileName || '<anonymous>';
            return contents;
        } else {
            var stream = fs.createReadStream(contents);
            stream.fileName = contents;
            return stream;
        }
    }).forEach(function (stream) {
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
                var fileName = parseFilePattern(options.pattern, stream.fileName, digest);
                fs.writeFile(fileName, contents, function (err) {
                    if (err) {
                        return mapEvents.emit('error', err);
                    }
                    mapEvents.emit('file', stream.fileName, fileName);
                });
            } else {
                mapEvents.emit('file', stream.fileName, digest);
            }
        });
        stream.pipe(hash, { end: false });
    });
    return mapEvents.on('file', function (fileName, newFileName) {
        map[fileName] = newFileName;
        fileCount--;
        if (fileCount === 0) {
            mapEvents.emit('end', map);
        }
    });
};
