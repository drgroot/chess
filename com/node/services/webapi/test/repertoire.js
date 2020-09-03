import { clearDatabase } from 'chess_jstransfer';
import fs from 'fs';
import { assert } from 'chai';
import { get, post } from './games';

describe('repertoire', () => {
  before(() => clearDatabase());

  describe('saving repertoire', () => {
    const pgn = fs.readFileSync(`${__dirname}/../../../tools/pgnextract/test/test.pgn`, 'utf8');

    it('should save repertoire', () => post('/repertoire', { color: 'white', database: 'Kings Gambit', pgnBig: pgn })
      .then(({ data }) => assert.isTrue(data)));
  });

  describe('getting repertoire', () => {
    it('should get repertoire by color', () => get('/repertoire/white')
      .then(({ data }) => assert.lengthOf(data, 5)));

    it('should return empty if no repertoire', () => get('/repertoire/black')
      .then(({ data }) => assert.lengthOf(data, 0)));
  });
});
