/**
 * Module Dependencies
 */

var model = require('modella');
var leveldb = require('level-11')(__dirname + '/mydb');
var level = require('../')(leveldb);
var uid = require('uid');

var User = model('user')
  .attr('id')
  .attr('name')
  .attr('email')
  .attr('password');

User.use(level);

var Task = model('task')
  .attr('id')
  .attr('title')
  .attr('description')
  .attr('price')

Task.use(level);

/**
 * Initialize
 */

var user = new User;

user.id(uid(6))
    .name('matt')
    .email('mattmuelle@gmail.com')
    .password('test');

var task = new Task

task.id(uid(6))
  .title('scraper needed')
  .description('some description')
  .price(65)

var pending = 2

user.save(function(err, user) {
  if (err) throw err;
  next();
});

task.save(function(err, task) {
  if (err) throw err;
  next();
})

function next() {
  if (!--pending) return;

  User.all(function(err, users) {
    // console.log('users', users);
  });

  Task.all(function(err, tasks) {
    // console.log(tasks);
    // console.log('tasks', tasks[0].toJSON());
  });

  Task.get('oy3h62', function(err, task) {
    if (err) throw err;
    console.log(task.toJSON());
  });
}


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
