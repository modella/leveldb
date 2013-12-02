/**
 * Module dependencies
 */
var debug = require('debug')('modella:level'),
    type = require('type-component'),
    xtend = require('xtend');

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

/* if a function is passed, then it sends the error through that
 * if not, it emits the error through the model
 *
 * @param {object} model
 * @param {error} err
 * @param {function} [fn]
 * @api private
 */
function dispatch_error(model, err, fn) {
  type(fn) === 'function' ? fn(err) : model.emit('error', err);
}

// automatically cleanup on termination
process.on('SIGTERM', function() {
  dbs.forEach(function(db) {
    db.close(function (err) {
      if(err) console.error(err);
    });
  });
});


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
  dbs.push(db);

  return function(model) {
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
    return dispatch_error(this, new Error('put() requires a callback arguments'))

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
    return dispatch_error(this, new Error('get() requires key and callback arguments'));

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
    return dispatch_error(this, new Error('remove() requires a callback arguments'));

  var key = this.primary();
  debug('remove: %s', key);

  this.db.del(key, options, function(err) {
    if (err) return fn(err);

    debug('success remove: %s', key);
    fn(err);
  });
};