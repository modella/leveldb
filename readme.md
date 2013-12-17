# level-modella

[![NPM version](https://badge.fury.io/js/level-modella.png)](http://badge.fury.io/js/level-modella)
[![Build Status](https://secure.travis-ci.org/modella/level-modella.png)](http://travis-ci.org/modella/level-modella)
[![Dependency Status](https://gemnasium.com/modella/level-modella.png)](https://gemnasium.com/modella/level-modella)
[![Coverage Status](https://coveralls.io/repos/modella/level-modella/badge.png?branch=master)](https://coveralls.io/r/modella/level-modella?branch=master)
[![Code Climate](https://codeclimate.com/github/modella/level-modella.png)](https://codeclimate.com/github/modella/level-modella)

[Level](https://github.com/level/level) plugin for [modella](https://github.com/modella/modella).

## install

```bash
npm install [--save/--save-dev] level-modella
```

## example

```js
var model = require('modella');
var store = require('level-modella');
var level = require('level')('/tmp/level');
var sublevel = require('sublevel');
var uid = require('uid');

var users_store = sublevel(level, 'users');

var User = model('user');

User.attr('id');
User.attr('name');
User.attr('email');
User.attr('password');

User.use(store(users_store));

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

## api

### store(db)

Use the plugin.

### model.save([options,] fn)
### model.put([options,] fn)

Save a model.

### model.del([options,] fn)
### model.remove([options,] fn)

Remove a model.

### Model.get(key, [options,] fn)

Get a model. The object passes to the callback is a `Model` instance.

### Model.get.all([options])

Returns a stream that will emit a model instance on each `data` event. Accepted options are the [same](https://github.com/rvagg/node-levelup/#dbcreatereadstreamoptions) that levelup accepts.

### Model.remove.all([options,] fn)

Removes all models.

### Model.db

`level` instance

## license

MIT