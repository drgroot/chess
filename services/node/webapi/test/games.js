import axios from 'axios';
import { assert } from 'chai';
import { weburl } from '../src/url';

const cookie = { value: false };

export const post = (path = '/', data = {}) => axios
  .post(`${weburl}/api${path}`, data, { headers: cookie.value ? { Cookie: cookie.value } : {} });
export const get = (path = '/', params = {}) => axios
  .get(`${weburl}/api${path}`, { params, headers: cookie.value ? { Cookie: cookie.value } : {} });
export const user = 'arangefruit';

describe('getting games', () => {
  it('simple test', () => get('/')
    .then(({ data }) => assert.strictEqual(data, 'Works')));

  describe('chunked get', () => {
    const allGames = new Set();
    const chunkSize = 25;
    [0, 1, 2, 3, 4].forEach((v, i) => it(`iteration ${i + 1}`,
      () => get('/games', { skip: allGames.size, chunkSize })
        .then(({ data: { games } }) => {
          for (const { matchid } of games) {
            allGames.add(matchid);
          }

          assert.isAbove(allGames.size, 0);
        })));
  });
});
