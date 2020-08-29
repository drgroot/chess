const mongoose = require('mongoose');
const chai = require('chai');

// eslint-disable-next-line func-names
module.exports = async function () {
  const User = mongoose.model('User');
  await User.syncIndexes();

  const yusuf = new User({
    username: 'arangefruit',
    scrapeTasks: [
      { name: 'chesscom', params: { username: 'aarange', alias: 'Yusuf Ali' } },
      { name: 'chesscom', params: { username: 'groot_tree', alias: 'Yusuf Ali' } },
      { name: 'chesscom', params: { username: 'abdullahs484' } },
      { name: 'chesscom', params: { username: 'MuhammadE' } },
      { name: 'chesscom', params: { username: 'grandashak' } },
    ],
  });
  await yusuf.save();

  return new Promise((resolve) => {
    User.find({}, (e, docs) => {
      resolve(docs);
    });
  })
    .then((users) => users.map((u) => u.username))
    .then((usernames) => chai.assert.include(usernames, 'arangefruit'));
};
