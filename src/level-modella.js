/**
 * Module dependencies
 */
var debug = require('debug')('modella:level'),
    type = require('type-component'),
    xtend = require('xtend'),
    through = require('ordered-through'),
    series = require('map-series'),
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
var level_modella = module.exports = function(db) {
  if(type(db) === 'string')
    db = level(db)

  dbs.push(db);

  return function(model) {
    model.db = db;

    Object.keys(level_modella).forEach(function(proto) {
      model[proto] = level_modella[proto];
    });
  };
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
level_modella.put = level_modella.save = level_modella.update = function(options, fn) {
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
level_modella.get = function(key, options, fn) {
  fn = get_callback(options, fn);
  options = xtend(default_options, options);

  if (type(fn) !== 'function')
    return this.emit('error', new Error('get() requires key and callback arguments'));

  debug('get: %s', key);
  var self = this;

  this.db.get(key, options, function(err, value) {
    if (err) return fn(err);

    debug('success get: %s -> %j', key, value);
    fn(null, self(value));
  });
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
level_modella.remove = level_modella.del = function(options, fn) {
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
 * var cursor = require('level-cursor')
 * cursor(user.all()).each(function (user) {}, function (err) {})
 * ```
 *
 * @param {object} [options]
 * @api public
 */
level_modella.all = function(options) {
  options = xtend(default_options, options);
  var self = this;

  debug('all');

  return this.db.createReadStream(options).pipe(through(function(data, fn) {
    debug('success get: %s -> %j', data.key, data.value);
    fn(null, self(data.value));
  }));
};

/* closes all db instances
 *
 * @api private
 */
module.exports.__close_all = close_all;