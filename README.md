# HashMark

HashMark is a small utility which takes a file (or sdtin) as input, and writes
the contents of the input to a file named with a hash digest of the file. This
is useful for cache busting sticky caches - files can have far future expires
headers and when the code changes, a new filename is created.

## Examples:

### Shell

```bash
cat file.js | ./bin/hashmark 'file.{hash}.js' # Writes to test.3eae1599bb7f187b86d6427942d172ba8dd7ee5962aab03e0839ad9d59c37eb0.js
> Computed hash: 3eae1599bb7f187b86d6427942d172ba8dd7ee5962aab03e0839ad9d59c37eb0
>
cat file.js | ./bin/hashmark -l 8 'file.{hash}.js' # Writes to test.3eae1599.js
> Computed hash: 3eae1599
>
cat file.js | ./bin/hashmark -l 4 -d md5 'dist/{hash}.js' # Writes to dist/cbd8.js
> Computed hash: cbd8
>
```
`hashmark` also supports file globs - meaning you can read in many files and it
will output hashed versions of each:

```bash
./bin/hashmark path/to/*.js 'dist/{name}.{hash}.js'
./bin/hashmark path/to/{filea,fileb,filec}.js 'dist/{name}.{hash}.js'
./bin/hashmark **.js 'dist/{dir}/{name}.{hash}.js'
./bin/hashmark **.{js,css} 'dist/{dir}/{name}.{hash}.{ext}'
```

The `hashmark` command will output the some JSON stdout with a map of filenames
and their new hashes, meaning you can pipe the hash to other programs. To make
`hashmark` completely silent - simply pass the `--silent` or `-s` flag.

```bash
./bin/hashmark -l 4 file.js 'dist/{hash}.js' --silent
```

You can also output the JSON map to a file, by passing the `--asset-map` or `-m`
flag. It will still be logged to stdout unless you pass `--silent`

```bash
./bin/hashmark -l 4 file.js 'dist/{hash}.js' --asset-map assets.json
```

### Programmatically

The hashmark function can be used programmatically. You can pass it a String,
Buffer or Stream as the first argument, an options object as the second
argument, and a callback as the third.

The callback receives an error as the first argument (or null) and an object
which maps each given file to the newly hashed file name.

```js
var hashmark = require('hashmark');
var file = fs.createReadStream('file.js');

hashmark(file, { length: 8, digest: 'md5', 'pattern': '{hash}'}, function (err, map) {
    console.log(map);
});
```

The function also returns an event emitter which emits `error`, `file` and `end`
events. File events get fired when an individual file has been hashed, and the
`end` event is fired when all have been done. `file` is given two arguments -
the files old name, and the new calculated filename (given the template string),
and the `end` event is given an object mapping of all files.

```js
var hashmark = require('hashmark');
var file = fs.createReadStream('file.js');

hashmark(file, { length: 8, digest: 'md5', pattern: 'hash'})
    .on('file', function (oldFileName, newFileName) {
        console.log('File hashed!', oldFileName, newFileName);
    })
    .on('end', function (jsonMap) {
        console.log('~FIN');
    })
```

Files can be a single Stream, or filename String, or an Array of Streams and/or
filename Strings. Globbing is not supported here (the globbing functionality
lives in the command line).

```js
var hashmark = require('hashmark');
var file = fs.createReadStream('file.js');

hashmark([file, 'file2.js'], { length: 8, digest: 'md5', file: 'file.#.js'}, function (err, hash) {
    console.log('File written to file.' + hash + '.js');
    console.log(hash);
});
```

## Contributing

This is such a small utility - there's very little point in contributing. If it
doesn't do something that you really think it should, feel free to raise an
issue - just be aware I might say no. If you can make it faster/better/stronger
without changing the API/functionality then send a PR!
