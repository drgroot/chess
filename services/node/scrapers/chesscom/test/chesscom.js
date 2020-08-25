import { assert } from 'chai';
import { getArchives, getGames } from '../src/chesscom';

describe('validating chess.com endpoints', () => {
  let archives = [];
  before(() => getArchives('aarange')
    .then((urls) => { archives = urls; }));

  describe('/games/archives', () => {
    it('should have data', () => assert.isAbove(archives.length, 0));

    it('url should match regex', () => {
      const [{ url }] = archives;
      const regex = /games\/(\d{4})\/(\d{2})$/;
      assert.isTrue(regex.test(url), `${url} does not match /YYYY/MM`);

      const [, year, month] = url.match(regex);
      const date = new Date(parseInt(year, 10), parseInt(month, 10));

      // make sure date is in list of years
      assert.isTrue(archives.map((d) => d.date.getTime()).includes(date.getTime()));
    });
  });

  describe('getting pgns', () => {
    it('should return pgn without issue', () => getGames([archives[0].url])
      .then((games) => {
        assert.isAbove(games.length, 0);

        const [{
          pgn, white, black, rules, time_class: time,
        }] = games;

        // make sure required elements are here
        assert.isString(pgn, games[0]);
        assert.isString(white.username, games[0]);
        assert.isString(black.username, games[0]);
        assert.isString(rules, games[0]);
        assert.isString(time, games[0]);
        assert.isDefined(white.rating, games[0]);
        assert.isDefined(black.rating, games[0]);
      }));
  });
});
