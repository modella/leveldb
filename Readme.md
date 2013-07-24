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

### Level(path, options)

Initialize leveldb with a `path` to the database. If path doesn't exist, it will be created. `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup)

### Model.all([options], fn)

Get all models (static method)

### Model.find(id, [options], fn)

Find a model (static method)

### model.save([options], fn)

Save the model (instance method)

### model.remove([options], fn)

Remove the model (instance method)

All `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup).

## License

MIT
