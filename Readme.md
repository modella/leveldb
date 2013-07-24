# LevelDB

LevelDB plugin for [modella](https://github.com/modella/modella).

## Installation

    npm install modella-leveldb

## Example

```js
var model = require('modella');
    level = require('modella-leveldb')('./mydb');

var User = model('user')
  .attr('_id')
  .attr('name')
  .attr('email')
  .attr('password');

User.use(level);

/**
 * Initialize
 */

var user = new User;

user.name('matt')
    .email('mattmuelle@gmail.com')
    .password('test');

user.save(function(err) {
  console.log(user.toJSON());
});
```

## API

### Level(path, options)

Initialize leveldb with a `path` to the database. If path doesn't exist, it will be created. `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup)

### Static: Model.all([options], fn)

Get all models

### Static: Model.find(id, [options], fn)

Find a model

### Instance: model.save([options], fn)

Save the model

### Instance: model.remove([options], fn)

Remove the model

All `options` will be passed through to [levelup](https://github.com/rvagg/node-levelup).

## License

MIT
