import { assert } from 'chai';
import nodeMQ from 'chess_jsrabbitmq';
import { getLastEntry, getTasks } from '../src/dbapi';
import { filterArchives } from '../src';

const username = 'jay';
const add = (curdate, years, months, days) => {
  const date = new Date();
  date.setDate(curdate.getDate() + days);
  date.setMonth(curdate.getMonth() + months);
  date.setFullYear(curdate.getFullYear() + years);
  return date;
};

describe('retreiving scrape tasks', () => {
  before(() => nodeMQ.publishMessage('dbapi', { model: 'user', method: 'login', methodData: { name: 'chesscom', token: '1234', username } }));

  describe('retrieving tasks', () => {
    before(() => Promise.all([
      { name: 'chesscom', params: { username: 'pro-palestine' } },
      { name: 'chessbase', params: {} },
      { name: 'chesscom', params: { username: 'abdullahs484', alias: 'Abdullah' } },
    ].map((scrapeTask) => nodeMQ.publishMessage('dbapi', { model: 'user', method: 'addScrapeTask', methodData: { username, scrapeTask } }))));

    it('should retrieve the tasks correctly', () => getTasks()
      .then((tasks) => assert.lengthOf(tasks, 2)));
  });

  describe('get last match entry', () => {
    const dates = [...Array(5).keys()]
      .filter((i) => i > 0)
      .map((month) => add(new Date(), 0, -month, 0));

    before(() => Promise.all(
      dates
        .map((date) => nodeMQ.publishMessage(
          'dbapi',
          {
            model: 'match',
            method: 'add',
            methodData: {
              user: username,
              date,
              whiteName: 'Yusuf Ali',
              blackName: 'asdad',
              database: 'All Games',
              result: 0.5,
              pgnraw: 'White "aarange"',
              moves: [],
            },
          },
        )),
    ));

    it('should retrieve the latest entry', () => getLastEntry(username, 'aarange')
      .then((latestDate) => assert.strictEqual(latestDate.getTime(), dates[0].getTime())));

    it('should return false if no games', () => getLastEntry(username, 'MuhammadE')
      .then((latestDate) => assert.isFalse(latestDate)));

    describe('getting archives', () => {
      it('should have less archives for existing players', () => filterArchives('aarange', -Infinity)
        .then((archives) => filterArchives('aarange', dates[0].getTime())
          .then((filtered) => assert.isBelow(filtered.length, archives.length))));

      it('should have same number for new players', () => filterArchives('MuhammadE', -Infinity)
        .then((archives) => assert.isAbove(archives.length, 0)));
    });
  });
});
