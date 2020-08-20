import fs from 'fs';
import { assert } from 'chai';
import nodeMQ from 'chess_jsrabbitmq';
import app, { queueName } from '../src';

const testPGN = fs.readFileSync(`${__dirname}/test.pgn`).toString();
describe('simple pgn extraction', () => {
  before(() => app());

  it('should extract pgns and all variations with no comments', () => nodeMQ.publishMessage(queueName, testPGN)
    .then(({ isSuccess, results, error }) => {
      assert.isTrue(isSuccess, error);
      assert.lengthOf(results, 5);

      const variations = new Set(['Nxe4 Nd7', '5. Nxf3', 'gxf3 Nf6', 'Nxe4 Nd7', 'exd5 exd5']);

      for (const result of results) {
        for (const end of variations) {
          if (result.endsWith(end)) {
            variations.delete(end);
            break;
          }
        }
      }

      assert.lengthOf([...variations], 0, `Did not find variations: ${[...variations].join(', ')}`);
    }));
});
