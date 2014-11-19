# LevelDB

[LevelDB](https://code.google.com/p/leveldb/) plugin for [modella](https://github.com/modella/modella).

## Installation

    npm install modella-leveldb

## Example

```js
var model = require('modella');
var level = require('modella-leveldb')('./mydb');
var uid = require('uid');

var User = model('user')
  .attr('id')
  .attr('name')
  .attr('email')
  .attr('password');

User.use(level);

/**
 * Initialize
 */

var user = new User;

user.id(uid(6))
    .name('matt')
    .email('mattmuelle@gmail.com')
    .password('test');

user.save(function(err) {
  console.log(user.toJSON());
});
```

## API

### Level(path|db, options)

Initialize leveldb with a `path` to the database. If path doesn't exist, it will be created. `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup)

Alternatively, you can pass your own level `db` instance in.

### Model.index(index, opts)

Create a secondary `index` using [leveldex](https://github.com/lapwinglabs/leveldex). You may ensure that key is unique by passing `unique : true` in `opts`.

```js
User.index('email', { unique: true });
```

### Model.all([options], fn)

Get all models (static method)

### Model.find(id|object, [options], fn)

Find a model (static method).

If you provide a secondary index, you can search by that key:

```js
Model.find({ email: 'hi@lapwinglabs.com' } , fn);
```

### model.save([options], fn)

Save the model (instance method)

### model.remove([options], fn)

Remove the model (instance method)

All `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup).

## License

MIT
