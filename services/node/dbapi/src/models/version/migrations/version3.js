const mongoose = require('mongoose');
const chai = require('chai');

// eslint-disable-next-line func-names
module.exports = async function () {
  const Match = mongoose.model('Match');
  await Match.deleteMany({});

  return new Promise((resolve) => {
    Match.find({}, (e, docs) => {
      resolve(docs);
    });
  })
    .then((matches) => chai.assert.lengthOf(matches, 0));
};
