/**
 * Module Dependencies
 */

var modella = require('modella');
var rmrf = require('rimraf').sync;
var join = require('path').join;
var assert = require('assert');
var leveldb = require('../');

/**
 * DB
 */

var db = join(__dirname, 'db');
var level = leveldb(db);

/**
 * User model
 */

var User = modella('user')
  .attr('id')
  .attr('name')
  .attr('email')
  .use(level)
  .index('email');

/**
 * Blog post model
 */

var Post = modella('post')
  .attr('id')
  .attr('title')
  .attr('content')
  .use(level);

/**
 * Tests
 */

describe('leveldb', function() {
  var user;
  var expected = {
    id: '1',
    name: 'matt',
    email: 'matt@matt.com'
  }

  beforeEach(function() {
    user = User(expected);
  });

  after(function() {
    rmrf(db);
  });

  describe('save', function(done) {
    it('should save users', function(done) {
      user.save(function(err) {
        if (err) return done(err);
        User.find(user.primary(), function(err, user) {
          if (err) return done(err);
          assert.deepEqual(expected, user.json());
          done();
        });
      });
    });

    afterEach(function(done) {
      user.remove(done);
    });
  })

  describe('all', function() {
    var ea = { id: '1', email: 'm@m.com', name: 'matt' };
    var eb = { id: '2', email: 'n@n.com', name: 'natt' };
    var ec = { id: '3', title: 'lorem', content: 'ipsum' };
    var a, b, c;

    beforeEach(function(done) {
      var pending = 3;
      a = User(ea);
      b = User(eb);
      c = Post(ec);
      a.save(fn);
      b.save(fn);
      c.save(fn);
      function fn(err) {
        if (err) return done(err);
        else if (!--pending) done();
      }
    });

    afterEach(function(done) {
      var pending = 3;
      a.remove(fn);
      b.remove(fn);
      c.remove(fn);
      function fn(err) {
        if (err) return done(err);
        else if (!--pending) done();
      }
    });

    it('should get multiple models', function(done) {
      User.all(function(err, users) {
        if (err) return done(err);
        assert.deepEqual(users[0].json(), ea);
        assert.deepEqual(users[1].json(), eb);
        done();
      });
    });

    it('should not get models from other sublevels', function(done) {
      var post = Post();
      Post.all(function(err, posts) {
        if (err) return done(err);
        assert.equal(1, posts.length);
        assert.deepEqual(posts[0].json(), ec);
        done();
      });
    })
  })

  describe('find(id)', function() {
    it('should return null when an id is not found', function(done) {
      User.find('4', function(err, user) {
        assert(!err);
        assert(null === user);
        done();
      });
    })
  });

  describe('find(query)', function() {
    var ea = { id: '1', email: 'm@m.com', name: 'matt' };
    var eb = { id: '2', email: 'n@n.com', name: 'natt' };
    var ec = { id: '3', email: 'o@o.com', name: 'oatt' };
    var a, b, c;

    beforeEach(function(done) {
      var pending = 3;
      a = User(ea);
      b = User(eb);
      c = User(ec);
      a.save(fn);
      b.save(fn);
      c.save(fn);
      function fn(err) {
        if (err) return done(err);
        else if (!--pending) return done();
      }
    });

    afterEach(function(done) {
      var pending = 3;
      a.remove(fn);
      b.remove(fn);
      c.remove(fn);
      function fn(err) {
        if (err) return done(err);
        else if (!--pending) return done();
      }
    });

    it('should find users by email', function(done) {
      User.find({ email: 'n@n.com'}, function(err, user) {
        if (err) return done(err);
        assert.deepEqual(user.json(), eb);
        done();
      });
    });
  });
})
