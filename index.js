/**
 * Module dependencies
 */

var debug = require('debug')('modella:leveldb');
var level = require('level');
var sync = {};

/**
 * Export `LevelDB`
 */

module.exports = function(path, options) {
  options = options || {};
  options.valueEncoding = options.valueEncoding || 'json';

  var db = level(path, options);

  return function(model) {
    model._sync = sync;
    model.db = db;

  };
};

/**
 * Sync Name
 */

sync.name = 'leveldb';

/**
 * All
 */

sync.all = function(options, fn) {
  if (arguments.length == 1) {
    fn = options;
    options = {};
  }

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
    return fn(null, buffer);
  });
};

/**
 * Get
 */

sync.get = function(key, options, fn) {
  var db = this.db;

  if(arguments.length == 2) {
    fn = options;
    options = {};
  }

  debug('getting %j with %j options...', key, options);
  db.get(key, options, function(err, model) {
    if(err) return fn(err);
    else if(!model) return fn(null, false);
    debug('got %j', model);
    return fn(null, model);
  });
};

/**
 * removeAll
 */

sync.removeAll = function(query, fn) {
  throw new Error('model.removeAll not implemented');
};

/**
 * save
 */

sync.save =
sync.update = function(options, fn) {
  if (1 == arguments.length) {
    fn = options;
    options = {};
  }

  var json = this.toJSON();
  debug('saving... %j', json);
  var id = this.primary();
  console.log(id);
  this.model.db.put(id, json, function(err) {
    if(err) return fn(err);
    debug('saved %j', json);
    return fn(null, json);
  });
};

/**
 * remove
 */

sync.remove = function(options, fn) {
  if (1 == arguments.length) {
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
