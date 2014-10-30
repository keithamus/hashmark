'use strict';
var Stream = require('stream');
var crypto = require('crypto');
var fs = require('fs');
module.exports = function hashmark(contents, options, callback) {
    var stream;
    if (!callback && typeof options === 'function') {
        callback = options;
        options = {};
    }
    if (!callback) {
        throw new TypeError('Must pass a callback');
    }
    if (!options.hasOwnProperty('digest')) {
        options.digest = 'sha256';
    }
    if (!options.hasOwnProperty('length')) {
        options.length = 0;
    }
    if (contents instanceof Stream.Readable) {
        stream = contents;
    } else {
        stream = new Stream.Readable();
        stream._read = function () {};
        stream.push(contents.toString());
        stream.push(null);
    }
    var hash = crypto.createHash(options.digest);
    var contentStream = new Stream.PassThrough();
    stream.on('error', callback);
    contentStream.on('error', callback);
    hash.on('error', callback);
    contentStream.on('data', function (chunk) {
        contents = Buffer.concat([contents, chunk]);
    });
    contents = new Buffer('');
    stream.on('end', function () {
        hash = hash.digest('hex');
        if (options.length) {
            hash = hash.slice(0, options.length);
        }
        if (options.file) {
            var file = fs.writeFile(options.file.replace('#', hash), contents, function () {
                callback(null, hash, contents);
            });
        } else {
            callback(null, hash, contents);
        }
    });
    stream.pipe(contentStream);
    stream.pipe(hash, { end: false });
};
