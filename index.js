/**
 * Module dependencies
 */

var debug = require('debug')('modella:leveldb');
var indexing = require('leveldex');
var sublevel = require('level-sub');
var level = require('level-11');
var noop = function() {};
var sync = {};

/**
 * Export `LevelDB`
 */

module.exports = function(path, options) {
  options = options || {};
  options.valueEncoding = options.valueEncoding || 'json';

  // allow you to pass your own instance in
  var db = path.get && path.put ? path : level(path, options);

  return function(model) {
    model.db = sublevel(db).sublevel(model.modelName);
    indexing(model.db);
    for (fn in sync) model[fn] = sync[fn];
  };
};

/**
 * Index
 */

sync.index = function(key, opts) {
  opts = opts || {};

  // index the DB usuing level-indexing
  this.db.index(key);

  // ensure the key is unique
  opts.unique && this.db.unique(key);

  return this;
};

/**
 * All
 */

sync.all = function(options, fn) {
  options = options || {}
  fn = fn || noop;

  if ('function' == typeof options) {
    fn = options;
    options = {};
  }

  var model = this;

  // default options
  options.valueEncoding = options.valueEncoding || 'json';

  debug('getting all data with options %j', options);
  var rs = this.db.createReadStream(options);
  var buffer = [];

  rs.on('error', function(err) {
    return fn(err);
  });

  rs.on('data', function(data) {
    buffer[buffer.length] = data.value;
  });

  rs.on('end', function() {
    return fn(null, buffer.map(model));
  });
};

/**
 * Get
 */

sync.get =
sync.find = function(key, options, fn) {
  options = options || {};
  fn = fn || noop;

  if('function' == typeof options) {
    fn = options;
    options = {};
  }

  var db = this.db;
  var model = this;

  // default options
  options.encoding = options.encoding || 'json';

  debug('getting %j with %j options...', key, options);

  if ('object' == typeof key) {
    var k = Object.keys(key)[0];
    var v = key[k];
    db.by(k, v, options, function(err, json) {
      if (err) return err.notFound ? fn(null, null) : fn(err);
      debug('got %j', json);
      return fn(null, model(json));
    });
  } else {
    db.get(key, options, function(err, json) {
      if (err) return err.notFound ? fn(null, null) : fn(err);
      debug('got %j', json);
      return fn(null, model(json));
    });
  }

};

/**
 * removeAll
 */

sync.removeAll = function(query, fn) {
  throw new Error('model.removeAll not yet implemented');
};

/**
 * batch
 */

sync.batch = function () {
  throw new Error('model.batch not yet implemented');
};

/**
 * save
 */

sync.save =
sync.update = function(options, fn) {
  options = options || {};
  fn = fn || noop;

  if ('function' == typeof options) {
    fn = options;
    options = {};
  }

  // default options
  options.encoding = options.encoding || 'json';

  var json = this.toJSON();
  debug('saving... %j', json);

  var id = this.primary();
  this.model.db.put(id, json, options, function(err) {
    if(err) return fn(err);
    debug('saved %j', json);
    // do not pass body through,
    // modella messes with the primary key
    // when it's not an id
    return fn();
  });
};

/**
 * remove
 */

sync.remove = function(options, fn) {
  options = options || {};
  fn = fn || noop;

  if ('function' == typeof options) {
    fn = options;
    options = {};
  }

  var db = this.model.db;
  var id = this.primary();
  debug('removing %s with options %j', id, options);
  db.del(id, options, function(err) {
    if(err) return fn(err);
    debug('removed %s', id);
    return fn();
  });
};
