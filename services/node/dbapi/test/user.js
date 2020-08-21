import { assert } from 'chai';
import Send from './app';

const send = (method, methodData = {}) => Send({ model: 'user', method, methodData });

const username = 'jay';
describe('Model Users', () => {
  it('should always require a username', () => send('login', { name: 'asdad', token: 'asdasd' })
    .then(({ isSuccess, error }) => {
      assert.isFalse(isSuccess);
      assert.include(error, 'username incorrect type or unspecified');
    }));

  it('should fail for non existent methods', () => send('asdad', { username, name: 'asdad', token: 'asdasd' })
    .then(({ isSuccess, error }) => {
      assert.isFalse(isSuccess);
      assert.include(error, 'invalid method');
    }));

  describe('authenticating', () => {
    describe('new user', () => {
      [
        { test: 'require token name', input: { token: 'asads' } },
        { test: 'require token', input: { name: 'twitch' } },
        { test: 'require string name', input: { name: undefined, token: 'asdasd' } },
        { test: 'require string token', input: { name: 'twitch', token: {} } },
      ].forEach((t) => it(`input: ${t.test}`, () => send('login', { username, ...t.input })
        .then(({ isSuccess }) => assert.isFalse(isSuccess))));

      it('create on login',
        () => send('login', { username, name: 'twitch', token: '123' })
          .then(({ isSuccess, error, results: [user] }) => {
            assert.isTrue(isSuccess, error);
            assert.strictEqual(user.username, username);
            assert.strictEqual(user.authentication[0].name, 'twitch');
            assert.strictEqual(user.authentication[0].active, true);
          }));

      it('tokens are unique', () => send('login', { username: 'drgroot', name: 'twitch', token: '123' })
        .then(({ isSuccess, error, results: [user] }) => {
          assert.isTrue(isSuccess, error);
          assert.strictEqual(user.username, username);
        }));
    });

    describe('removing authentication', () => {
      const token = { name: 'chesscom', token: '12' };

      before(() => send('login', { username: 'rip', ...token })
        .catch(() => true));

      it('disabling auth', () => send('removeAuthentication', { username: 'rip', ...token })
        .then(({ isSuccess, error, results: [user] }) => {
          assert.isTrue(isSuccess, error);
          assert.isFalse(user.authentication[0].active);
        })
        .then(() => send('login', { username: 'rip', ...token }))
        .then(({ isSuccess }) => assert.isFalse(isSuccess)));

      [
        { test: 'user does not exist', input: { ...token, username: 'asasd' } },
        { test: 'token does not exist', input: { ...token, name: 'chess.com' } },
        { test: 'used by another error', input: { ...token, token: '123' } },
      ].forEach(
        ({ method = 'removeAuthentication', ...t } = {}) => it(`error: ${t.test}`,
          () => send(method, { username: 'rip', ...t.input })
            .then(({ isSuccess }) => assert.isFalse(isSuccess))),
      );
    });

    describe('adding tokens', () => {
      const token = { name: 'chesscom', token: '12' };

      it('should activate', () => send('addAuthentication', { username: 'rip', ...token })
        .then(({ isSuccess, results: [user], error }) => {
          assert.isTrue(isSuccess, error);
          assert.isTrue(user.authentication[0].active);
        }));

      it('another source', () => send('addAuthentication', { username: 'rip', ...token, name: 'twitch' })
        .then(({ isSuccess, results: [user], error }) => {
          assert.isTrue(isSuccess, error);
          assert.isTrue(user.authentication[0].active);
        }));

      it('cannot add same token source', () => send('addAuthentication', { username: 'rip', name: 'chesscom', token: '30' })
        .then(({ isSuccess }) => assert.isFalse(isSuccess)));

      [
        { test: 'user does not exist', input: { ...token, username: 'asasd' } },
        { test: 'token already used', input: { name: 'twitch', token: '123' } },
      ].forEach(
        ({ method = 'addAuthentication', ...t } = {}) => it(`error: ${t.test}`,
          () => send(method, { username: 'rip', ...t.input })
            .then(({ isSuccess }) => assert.isFalse(isSuccess))),
      );
    });
  });

  describe('scrape tasks', () => {
    it('should be able to add scrape tasks', () => Promise.all([
      { name: 'chesscom', params: { username: 'arange', alias: 'Yusuf Ali' } },
      { name: 'chesscom', params: { username: 'MuhammadE' } },
      { name: 'chessbase', params: { displayName: 'abdullahs484' } },
    ].map((scrapeTask) => send('addScrapeTask', { username, scrapeTask })
      .then(({ isSuccess, error }) => assert.isTrue(isSuccess, error)))));

    it('should be able to retrieve scrape tasks', () => Promise.all([
      { name: 'chesscom', n: 2 },
      { name: 'chessbase', n: 1 },
    ].map(({ name: scrapename, n }) => send('getScrapeTasks', { username: 't', scrapename })
      .then(({ isSuccess, results: users, error }) => {
        assert.isTrue(isSuccess, error);

        const tasks = [];
        for (const user of users) {
          tasks.push(...user.scrapeTasks.filter((t) => t.name === scrapename));
        }

        assert.lengthOf(tasks, n);
      }))));
  });
});
