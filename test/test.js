var store = process.env.LEVEL_COV ? require('../lib-cov/level-modella') : require('../');
var model = require('modella');
var level = require('level');
var uid = require('uid');
var mkdirp = require('mkdirp');
var type = require('type-component');
var leveldown = require('leveldown');
var assert = require('assert');
var cursor = require('level-cursor');
var path = require('path');

var User, location = path.join(__dirname, 'db'), user = {
  id: uid(),
  name: 'seth cohen'
};

var close = function(done) {
  if(type(User.db) === 'undefined') return done();

  User.db.close(function() {
    leveldown.destroy(location, done);
  });
};

var use = function(done) {
  User.use(store(level(location, done)));
};

beforeEach(function(done) {
  mkdirp(location, done);
});

beforeEach(function() {
  User = model('User');
  User.attr('id');
  User.attr('name');
});

afterEach(close);

describe('store', function() {
  afterEach(close);

  it('store() accept a string', function() {
    User.use(store(location));
    assert(User.db);
    assert(User.db.location === location);
  });

  it('store() should return a fn', function() {
    var db = level(location);
    var adapter = store(db);
    assert(type(adapter) === 'function');
    User = {db: db} // make sure it's cleaned
  });

  it('should fill static methods', function() {
    User.use(store(level(location)));
    assert(type(User.get) === 'function');
    assert(type(User.save) === 'function');
    assert(type(User.remove) === 'function');
  });

  it('close all', function(done) {
    User.use(store(level(location)));
    User.__close_all(done);
  });
});

describe('put', function() {
  beforeEach(use);
  afterEach(close);

  it('should save', function(done) {
    var model = User(user);

    model.save(function(err, model) {
      if(err) return done(err);

      model.model.db.get(model.id(), {
        valueEncoding: 'json'
      }, function(err, value) {
        if(err) return done(err);

        assert(value.id === model.id());
        assert(value.name === model.name());

        done()
      });
    });
  });

  it('should emit when no callback is passed', function(done) {
    var model = User(user);

    model.once('error', function(err) {
      assert(err && err.message === 'put() requires a callback argument');
      done();
    });

    store.save.call(model);
  });
});

describe('remove', function() {
  beforeEach(use);
  afterEach(close);

  it('should remove', function(done) {
    var model = User(user);

    model.save(function(err, model) {
      if(err) return done(err);

      model.remove(function(err) {
        if(err) return done(err);

        model.model.db.get(model.id(), function(err) {
          assert(err && err.type === 'NotFoundError')
          done();
        });
      });
    });
  });

  it('should emit when no callback is passed', function(done) {
    var model = User(user);

    model.once('error', function(err) {
      assert(err && err.message === 'remove() requires a callback argument');
      done();
    });

    store.remove.call(model);
  });

  it('should remove all', function(done) {
    var model = User(user);

    model.save(function(err, model) {
      if(err) return done(err);

      User.remove.all(function(err){
        if(err) return done(err);

        cursor(User.get.all()).all(function(err, users){
          if(err) return done(err);
          assert(users.length === 0);
          done();
        });
      });
    });
  });
});

describe('get', function() {
  beforeEach(use);
  afterEach(close);

  it('should get', function(done) {
    var model = User(user);

    model.save(function(err, model) {
      if(err) return done(err);

      User.get(model.id(), function(err, value) {
        if(err) return done(err);

        assert(value.id() === model.id());
        assert(value.name() === model.name());

        done();
      });
    });
  });

  it('should emit when no callback/key is passed', function(done) {
    User.once('error', function(err) {
      assert(err && err.message === 'get() requires key and callback arguments');
      done();
    });

    User.get();
  });

  it('should get all', function(done) {
    var model = User(user);

    model.save(function(err, model) {
      if(err) return done(err);

      cursor(User.get.all()).all(function(err, users){
        assert(users[0].primary() === model.primary());
        done(err);
      });
    });
  });
});