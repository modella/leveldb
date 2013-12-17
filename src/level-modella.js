/**
 * Module dependencies
 */
var debug = require('debug')('modella:level'),
    type = require('type-component'),
    xtend = require('xtend'),
    through = require('ordered-through'),
    series = require('map-series'),
    cursor = require('level-cursor'),
    level = require('level');

// holds all the dbs, so that it can close them on process SIGTERM
var dbs = [];
// default options
var default_options = {
  valueEncoding: 'json',
  keyEncoding: 'utf8'
};

/* Parses options/fn so that it handles situations where no options
 * are passed to the function
 *
 * @param {object} options
 * @param {function} [fn]
 * @return {function} callback
 * @api private
 */
function get_callback(options, fn) {
  return type(options) === 'function' ? options : fn;
}

// automatically cleanup on termination
function close_all(done) {
  series(dbs, function(db, fn) {
    db.close(function(err) {
      if(err) console.error(err);
      fn();
    });
  }, function() {
    if(done) done();
  });
}

process.on('SIGTERM', close_all);

/* level_modella costructor
 *
 * @param {object} model
 * @param {object} db
 * @api private
 */
var level_modella = function (model) {
  if(!(this instanceof level_modella)) return new level_modella(model);
  var self = this

  model.get = function () {
    return self.get.apply(this, arguments);
  };

  model.get.all = function () {
    return self.getAll.apply(self, arguments);
  };

  model.del = model.remove = function () {
    return self.del.apply(this, arguments);
  };

  model.del.all = model.remove.all = function () {
    return self.delAll.apply(self, arguments);
  };

  model.all = model.get.all
  model.put = model.save = model.update = self.put;
  self.model = model;
};

/* save a model into the store
 *
 * ```javascript
 * user.save(function(err) {})
 * ```
 *
 * @param {object} [options]
 * @param {function} fn
 * @api public
 */
level_modella.prototype.put = function(options, fn) {
  fn = get_callback(options, fn);
  options = xtend(default_options, options);

  if (type(fn) !== 'function')
    return this.emit('error', new Error('put() requires a callback argument'));

  var value = this.toJSON();
  var key = this.primary();
  debug('put: %s -> %j', key, value);

  this.model.db.put(key, value, options, function(err) {
    if (err) return fn(err);

    debug('success put: %s -> %j', key, value);
    fn(err, value);
  });
};

/* gets a model from the store
 *
 * ```javascript
 * User.get(1, function(err, user) {})
 * ```
 *
 * @param {any} key
 * @param {object} [options]
 * @param {function} fn
 * @api public
 */
level_modella.prototype.get = function(key, options, fn) {
  fn = get_callback(options, fn);
  options = xtend(default_options, options);
  var self = this;

  if (type(fn) !== 'function')
    return self.emit('error', new Error('get() requires key and callback arguments'));

  debug('get: %s', key);

  self.db.get(key, options, function(err, value) {
    if (err) return fn(err);
    if (options.raw) return fn(err, value);

    debug('success get: %s -> %j', key, value);
    fn(null, self(value));
  });
};

/* get all models from the store
 *
 * ```javascript
 * var cursor = require('level-cursor')
 * cursor(User.get.all()).each(function (user) {}, function (err) {})
 * ```
 *
 * @param {object} [options]
 * @api public
 */
level_modella.prototype.getAll = function(options) {
  options = xtend(default_options, options);
  var self = this;
  var db = self.model.db;

  debug('all');

  if (options.raw && !options.keys) {
    return db.createValueStream(options);
  }

  if (options.raw && options.keys) {
    return db.createKeyStream(options);
  }

  return db.createReadStream(options).pipe(through(function(data, fn) {
    debug('success get: %s -> %j', data.key, data.value);
    fn(null, self.model(data.value));
  }));
};

/* removes a model from the store
 *
 * ```javascript
 * user.remove(function(err) {})
 * ```
 *
 * @param {object} [options]
 * @param {function} fn
 * @api public
 */
level_modella.prototype.del = function(options, fn) {
  fn = get_callback(options, fn);
  options = xtend(default_options, options);

  if (type(fn) !== 'function')
    return this.emit('error', new Error('remove() requires a callback argument'));

  var key = this.primary();
  debug('remove: %s', key);

  this.model.db.del(key, options, function(err) {
    if (err) return fn(err);

    debug('success remove: %s', key);
    fn(err);
  });
};

/* get all models from the store
 *
 * ```javascript
 * User.remove.all(function (err) {})
 * ```
 *
 * @param {object} [options]
 * @api public
 */
level_modella.prototype.delAll = function(options, fn) {
  fn = get_callback(options, fn);
  options = xtend(default_options, options);
  var self = this;

  debug('remove.all');

  cursor(self.model.db.createKeyStream(options).pipe(through(function(key, fn) {
    self.model.db.del(key, options, fn);
  }))).all(fn);
};

/* exports a function to be passed to `Model.use`
 *
 * ```javascript
 * var level_modella = require('level-modella')
 * var modella = require('modella')
 * var level = require('level')
 *
 * User = modella('User');
 *
 * User.use(level_modella(level))
 * ```
 *
 * @param {object} db
 * @return {fn}
 * @api public
 */
module.exports = function(db){
  if(type(db) === 'string')
    db = level(db);

  dbs.push(db);

  return function(model) {
    model.db = db;
    level_modella(model);
    return model;
  };
};

/* closes all db instances
 *
 * @api private
 */
module.exports.__close_all = close_all;