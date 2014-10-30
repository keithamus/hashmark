# HashMark

HashMark is a small utility which takes a file (or sdtin) as input, and writes
the contents of the input to a file named with a hash digest of the file. This
is useful for cache busting sticky caches - files can have far future expires
headers and when the code changes, a new filename is created.

## Examples:

### Shell

```bash
cat file.js | ./bin/hashmark 'file.#.js' # Writes to test.3eae1599bb7f187b86d6427942d172ba8dd7ee5962aab03e0839ad9d59c37eb0.js
> Computed hash: 3eae1599bb7f187b86d6427942d172ba8dd7ee5962aab03e0839ad9d59c37eb0
>
cat file.js | ./bin/hashmark -l 8 'file.#.js' # Writes to test.3eae1599.js
> Computed hash: 3eae1599
>
cat file.js | ./bin/bashmark -l 4 -d md5 'dist/#.js' # Writes to dist/cbd8f798.js
> Computed hash: cbd8f798
>
```

The `hashmark` command will output the hash to stdout (and some friendly text to
stderr), meaning you can pipe the hash to other programs. To make `hashmark`
completely silent - simply pass the `--silent` or `-s` flag.

```bash
cat file.js | ./bin/bashmark -l 4 'dist/#.js' --silent
```

If you want just the hash - without the friendly text, just redirect stderr:

```bash
cat file.js | ./bin/bashmark -l 4 'dist/#.js' 2> /dev/null
> 3eae
```

### Progamatically

The hashmark function can be used programatically. You can pass it a String,
Buffer or Stream as the first argument, an options object as the second
argument, and a callback as the third.

The callback receives an error as the first argument (or null) and the hash
digest as the second argument.

```js
var hashmark = require('hashmark');
var file = fs.createReadStream('file.js');

hashmark(file, { length: 8, digest: 'md5'}, function (err, hash) {
    console.log(hash);
});
```

If you pass in the `file` option, then hashmark will write to the filesystem
at that filename (replacing `#` with the hash). Without the `file` option - it
will not write anything to the filesystem.

```js
var hashmark = require('hashmark');
var file = fs.createReadStream('file.js');

hashmark(file, { length: 8, digest: 'md5', file: 'file.#.js'}, function (err, hash) {
    console.log('File written to file.' + hash + '.js');
    console.log(hash);
});
```

You can omit the entire options object, to resort to default behavior. This will
behave a bit like a simple `sha256` function.

```js
var hashmark = require('hashmark');
hashmark('Foo', function (err, hash) {
    console.log('"Foo" hashed is ' + hash);
});
```

## Contributing

This is such a small utility - there's very little point in contributing. If it
doesn't do something that you really think it should, feel free to raise an
issue - just be aware I might say no. If you can make it faster/better/stronger
without changing the API/functionality then send a PR!
