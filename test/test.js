/**
 * Module Dependencies
 */

var model = require('modella');
var level = require('../')(__dirname + '/mydb');
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

// user.save(function(err, user) {
//   console.log(user);
// });

User.all(function(err, users) {
  console.log(users);
});

// User.find('ewcbix', function(err, user) {
//   if (err) throw err;
//   console.log(user);
// });

// User.find('ewcbix', function(err, user) {
//   if (err) throw err;
//   user.remove(function(err) {
//     if (err) throw err;
//     console.log('removed');
//   });
// });
