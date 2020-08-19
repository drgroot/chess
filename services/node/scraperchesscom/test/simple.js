import { assert } from 'chai';
import { processUser } from '../src';
import nodeMQ from '../src/rabbitmq';
// import { clearDatabase } from '../../dbapi/src/transfer';

describe('simple chess.com scraping', () => {
  // before(() => clearDatabase());

  it('should scrape user', () => processUser('grandashak')
    .then(
      () => nodeMQ.publishMessage('dbapi', { model: 'match', method: 'find', methodData: { whiteName: 'grandashak' } }),
    )
    .then(({ results: [match] }) => {
      assert.isDefined(match);
      assert.isAtLeast(match.moves.length, 3);

      // make sure duration is defined
      const duration = match.moves[2].metadata.find((m) => m.key === 'duration');
      assert.isDefined(duration);
      assert.isAtLeast(duration.value, 0.1);
    }))
    .timeout(30000);
});
